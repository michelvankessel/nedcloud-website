import {
  getWebAuthnConfig,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type WebAuthnCredential
} from '../src/lib/webauthn'

import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture
} from '@simplewebauthn/types'

import {
  isoBase64URL,
  isoUint8Array,
  isoCBOR,
  toHash,
  cose
} from '@simplewebauthn/server/helpers'

import { createHash, generateKeyPairSync, createSign, createPublicKey, randomBytes } from 'crypto'
import type { CBORType } from '@levischuck/tiny-cbor'

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    fail(message)
  }
}

// ---------------------------------------------------------------------------
// Crypto helpers for constructing valid FIDO2 responses
// ---------------------------------------------------------------------------

interface ECKeyPair {
  publicKey: Buffer
  privateKey: Buffer
  x: Buffer
  y: Buffer
}

function generateECKeyPair(): ECKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })

  // Export as JWK to get x and y coordinates cleanly
  const pubKeyObj = createPublicKey(publicKey)
  const jwk = pubKeyObj.export({ format: 'jwk' })
  if (!jwk.x || !jwk.y) {
    throw new Error('JWK export missing x or y')
  }
  const x = isoBase64URL.toBuffer(jwk.x)
  const y = isoBase64URL.toBuffer(jwk.y)

  return { publicKey: Buffer.from(publicKey), privateKey: Buffer.from(privateKey), x: Buffer.from(x), y: Buffer.from(y) }
}

function buildCOSEEC2PublicKey(x: Uint8Array, y: Uint8Array): Map<string | number, CBORType> {
  const key = new Map<string | number, CBORType>()
  key.set(cose.COSEKEYS.kty, cose.COSEKTY.EC2)
  key.set(cose.COSEKEYS.alg, cose.COSEALG.ES256)
  key.set(cose.COSEKEYS.crv, cose.COSECRV.P256)
  key.set(cose.COSEKEYS.x, x)
  key.set(cose.COSEKEYS.y, y)
  return key
}

function buildAuthenticatorData(
  rpIdHash: Uint8Array,
  flags: number,
  signCount: number,
  credentialID: Uint8Array,
  credentialPublicKeyCOSE: Uint8Array
): Uint8Array {
  const parts: Uint8Array[] = []

  // rpIdHash (32 bytes)
  parts.push(rpIdHash)

  // flags (1 byte)
  parts.push(new Uint8Array([flags]))

  // signCount (4 bytes, big-endian)
  const counterBuf = new Uint8Array(4)
  const view = new DataView(counterBuf.buffer)
  view.setUint32(0, signCount, false)
  parts.push(counterBuf)

  // attestedCredentialData
  // aaguid (16 zero bytes)
  parts.push(new Uint8Array(16))

  // credentialIdLength (2 bytes, big-endian)
  const lenBuf = new Uint8Array(2)
  const lenView = new DataView(lenBuf.buffer)
  lenView.setUint16(0, credentialID.length, false)
  parts.push(lenBuf)

  // credentialId
  parts.push(credentialID)

  // credentialPublicKey (COSE-encoded)
  parts.push(credentialPublicKeyCOSE)

  return isoUint8Array.concat(parts)
}

function buildAuthDataForAssertion(
  rpIdHash: Uint8Array,
  flags: number,
  signCount: number
): Uint8Array {
  const parts: Uint8Array[] = []
  parts.push(rpIdHash)
  parts.push(new Uint8Array([flags]))
  const counterBuf = new Uint8Array(4)
  const view = new DataView(counterBuf.buffer)
  view.setUint32(0, signCount, false)
  parts.push(counterBuf)
  return isoUint8Array.concat(parts)
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const TEST_RP_ID = 'localhost'
const TEST_RP_NAME = 'Nedcloud Test'
const TEST_ORIGIN = 'http://localhost:3000'
const TEST_USER_ID = 'test-user-1'
const TEST_USER_EMAIL = 'test@nedcloud.com'

// ---------------------------------------------------------------------------
// Main test runner
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  // Set env vars for the test
  process.env.WEBAUTHN_RP_ID = TEST_RP_ID
  process.env.WEBAUTHN_RP_NAME = TEST_RP_NAME
  process.env.WEBAUTHN_ORIGIN = TEST_ORIGIN

  // =========================================================================
  // 1. getWebAuthnConfig() throws when env vars are missing
  // =========================================================================
  console.log('--- Test 1: getWebAuthnConfig() env var validation ---')

  const savedRpId = process.env.WEBAUTHN_RP_ID
  const savedRpName = process.env.WEBAUTHN_RP_NAME
  const savedOrigin = process.env.WEBAUTHN_ORIGIN

  // Test missing RP_ID
  delete process.env.WEBAUTHN_RP_ID
  try {
    getWebAuthnConfig()
    fail('getWebAuthnConfig() should throw when WEBAUTHN_RP_ID is missing')
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes('WEBAUTHN_RP_ID'),
      'should throw about missing WEBAUTHN_RP_ID'
    )
    console.log('PASS: throws when WEBAUTHN_RP_ID is missing')
  }
  process.env.WEBAUTHN_RP_ID = savedRpId

  // Test empty RP_ID
  process.env.WEBAUTHN_RP_ID = '   '
  try {
    getWebAuthnConfig()
    fail('getWebAuthnConfig() should throw when WEBAUTHN_RP_ID is whitespace')
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes('WEBAUTHN_RP_ID'),
      'should throw about empty WEBAUTHN_RP_ID'
    )
    console.log('PASS: throws when WEBAUTHN_RP_ID is whitespace')
  }
  process.env.WEBAUTHN_RP_ID = savedRpId

  // Test missing RP_NAME
  delete process.env.WEBAUTHN_RP_NAME
  try {
    getWebAuthnConfig()
    fail('getWebAuthnConfig() should throw when WEBAUTHN_RP_NAME is missing')
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes('WEBAUTHN_RP_NAME'),
      'should throw about missing WEBAUTHN_RP_NAME'
    )
    console.log('PASS: throws when WEBAUTHN_RP_NAME is missing')
  }
  process.env.WEBAUTHN_RP_NAME = savedRpName

  // Test missing ORIGIN
  delete process.env.WEBAUTHN_ORIGIN
  try {
    getWebAuthnConfig()
    fail('getWebAuthnConfig() should throw when WEBAUTHN_ORIGIN is missing')
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes('WEBAUTHN_ORIGIN'),
      'should throw about missing WEBAUTHN_ORIGIN'
    )
    console.log('PASS: throws when WEBAUTHN_ORIGIN is missing')
  }
  process.env.WEBAUTHN_ORIGIN = savedOrigin

  // Test valid config
  const config = getWebAuthnConfig()
  assert(config.rpID === TEST_RP_ID, 'rpID should match')
  assert(config.rpName === TEST_RP_NAME, 'rpName should match')
  assert(config.origin === TEST_ORIGIN, 'origin should match')
  console.log('PASS: getWebAuthnConfig() returns valid config')

  // =========================================================================
  // 2. generateRegistrationOptions() returns valid options
  // =========================================================================
  console.log('\n--- Test 2: generateRegistrationOptions() ---')

  const regOptions = await generateRegistrationOptions(TEST_USER_ID, TEST_USER_EMAIL)
  assert(typeof regOptions.challenge === 'string' && regOptions.challenge.length > 0,
    'registration options should have a challenge')
  assert(regOptions.rp.name === TEST_RP_NAME, 'rp.name should match')
  assert(regOptions.rp.id === TEST_RP_ID, 'rp.id should match')
  assert(regOptions.user.id.length > 0, 'user.id should be set')
  assert(regOptions.user.name === TEST_USER_EMAIL, 'user.name should be email')
  assert(regOptions.user.displayName === TEST_USER_EMAIL, 'user.displayName should be email')
  assert(Array.isArray(regOptions.pubKeyCredParams) && regOptions.pubKeyCredParams.length > 0,
    'pubKeyCredParams should be a non-empty array')
  assert(regOptions.attestation === 'none', 'attestation should be none')
  assert(regOptions.authenticatorSelection?.userVerification === 'required',
    'userVerification should be required')
  console.log('PASS: generateRegistrationOptions() returns valid options')

  // =========================================================================
  // 3. verifyRegistrationResponse() - valid response
  // =========================================================================
  console.log('\n--- Test 3: verifyRegistrationResponse() - valid ---')

  // Generate a key pair for the virtual authenticator
  const keyPair = generateECKeyPair()

  // Create a credential ID (random 32 bytes)
  const credentialID = randomBytes(32)

  // Build COSE public key
  const cosePublicKey = buildCOSEEC2PublicKey(
    new Uint8Array(keyPair.x),
    new Uint8Array(keyPair.y)
  )
  const cosePublicKeyBytes = isoCBOR.encode(cosePublicKey)

  // Compute rpIdHash
  const rpIdHash = createHash('sha256').update(TEST_RP_ID).digest()

  // Build authenticator data with flags: UP(0x01) | UV(0x04) | AT(0x40) = 0x45
  const authData = buildAuthenticatorData(
    rpIdHash,
    0x45, // UP + UV + AT
    0,    // initial counter
    credentialID,
    cosePublicKeyBytes
  )

  // Build attestation object: { fmt: 'none', attStmt: {}, authData }
  const attestationMap = new Map<string | number, CBORType>()
  attestationMap.set('fmt', 'none')
  attestationMap.set('attStmt', new Map<string | number, CBORType>())
  attestationMap.set('authData', authData)
  const attestationObjectBytes = isoCBOR.encode(attestationMap)

  // Build clientDataJSON
  const clientData = {
    type: 'webauthn.create',
    challenge: regOptions.challenge,
    origin: TEST_ORIGIN,
    crossOrigin: false
  }
  const clientDataJSONBytes = isoUint8Array.fromUTF8String(JSON.stringify(clientData))

  // Build RegistrationResponseJSON
  const validRegResponse: RegistrationResponseJSON = {
    id: isoBase64URL.fromBuffer(credentialID),
    rawId: isoBase64URL.fromBuffer(credentialID),
    response: {
      clientDataJSON: isoBase64URL.fromBuffer(clientDataJSONBytes),
      attestationObject: isoBase64URL.fromBuffer(attestationObjectBytes),
      transports: ['internal'] as AuthenticatorTransportFuture[]
    },
    clientExtensionResults: {},
    type: 'public-key'
  }

  const regResult = await verifyRegistrationResponse(
    validRegResponse,
    regOptions.challenge,
    TEST_ORIGIN,
    TEST_RP_ID
  )

  assert(regResult.verified === true, 'valid registration should be verified')
  assert(regResult.credentialID.length > 0, 'should have credentialID')
  assert(regResult.credentialPublicKey.length > 0, 'should have credentialPublicKey')
  assert(regResult.counter === 0, 'counter should be 0')
  assert(regResult.deviceType === 'singleDevice', 'deviceType should be singleDevice')
  assert(regResult.backedUp === false, 'backedUp should be false')
  console.log('PASS: verifyRegistrationResponse() accepts valid response')

  // =========================================================================
  // 4. verifyRegistrationResponse() - invalid response (wrong challenge)
  // =========================================================================
  console.log('\n--- Test 4: verifyRegistrationResponse() - invalid ---')

  const invalidClientData = {
    type: 'webauthn.create',
    challenge: 'wrong-challenge-value',
    origin: TEST_ORIGIN,
    crossOrigin: false
  }
  const invalidClientDataJSONBytes = isoUint8Array.fromUTF8String(JSON.stringify(invalidClientData))

  const invalidRegResponse: RegistrationResponseJSON = {
    id: isoBase64URL.fromBuffer(credentialID),
    rawId: isoBase64URL.fromBuffer(credentialID),
    response: {
      clientDataJSON: isoBase64URL.fromBuffer(invalidClientDataJSONBytes),
      attestationObject: isoBase64URL.fromBuffer(attestationObjectBytes),
      transports: ['internal'] as AuthenticatorTransportFuture[]
    },
    clientExtensionResults: {},
    type: 'public-key'
  }

  try {
    await verifyRegistrationResponse(
      invalidRegResponse,
      regOptions.challenge,
      TEST_ORIGIN,
      TEST_RP_ID
    )
    fail('verifyRegistrationResponse should throw for wrong challenge')
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes('challenge'),
      'should throw about unexpected challenge'
    )
    console.log('PASS: verifyRegistrationResponse() rejects invalid challenge')
  }

  // =========================================================================
  // 5. generateAuthenticationOptions() returns valid options
  // =========================================================================
  console.log('\n--- Test 5: generateAuthenticationOptions() ---')

  const authChallenge = isoBase64URL.fromBuffer(randomBytes(32))

  const storedCredential: WebAuthnCredential = {
    credentialID: regResult.credentialID,
    credentialPublicKey: regResult.credentialPublicKey,
    counter: regResult.counter,
    transports: ['internal'] as AuthenticatorTransportFuture[]
  }

  const authOptions = await generateAuthenticationOptions(authChallenge, [storedCredential])
  assert(typeof authOptions.challenge === 'string' && authOptions.challenge.length > 0,
    'authentication options should have a challenge')
  // SimpleWebAuthn converts the challenge string to UTF-8 bytes then base64url-encodes them
  const expectedAuthChallenge = isoBase64URL.fromBuffer(
    isoUint8Array.fromUTF8String(authChallenge)
  )
  assert(authOptions.challenge === expectedAuthChallenge, 'challenge should match encoded input')
  assert(authOptions.rpId === TEST_RP_ID, 'rpId should match')
  assert(authOptions.userVerification === 'required', 'userVerification should be required')
  assert(Array.isArray(authOptions.allowCredentials) && authOptions.allowCredentials.length === 1,
    'allowCredentials should have 1 entry')
  assert(authOptions.allowCredentials![0].type === 'public-key',
    'allowCredentials type should be public-key')
  console.log('PASS: generateAuthenticationOptions() returns valid options')

  // =========================================================================
  // 6. verifyAuthenticationResponse() - valid response
  // =========================================================================
  console.log('\n--- Test 6: verifyAuthenticationResponse() - valid ---')

  // Build authenticator data for assertion: flags UP(0x01) | UV(0x04) = 0x05
  const authDataForAssertion = buildAuthDataForAssertion(rpIdHash, 0x05, 1)

  // The challenge in clientDataJSON must match what the browser received.
  // SimpleWebAuthn converts the input challenge string to UTF-8 bytes then
  // base64url-encodes it, so the browser sees the encoded form.
  const browserChallenge = expectedAuthChallenge

  // Build clientDataJSON for authentication
  const authClientData = {
    type: 'webauthn.get',
    challenge: browserChallenge,
    origin: TEST_ORIGIN,
    crossOrigin: false
  }
  const authClientDataJSONBytes = isoUint8Array.fromUTF8String(JSON.stringify(authClientData))

  // Compute clientDataHash
  const authClientDataHash = createHash('sha256').update(authClientDataJSONBytes).digest()

  // Sign authData || clientDataHash with the private key
  const signData = isoUint8Array.concat([authDataForAssertion, authClientDataHash])
  const signer = createSign('SHA256')
  signer.update(signData)
  const derSignature = signer.sign(keyPair.privateKey)

  // Build AuthenticationResponseJSON
  // The server expects DER-encoded signature; it unwraps internally
  const validAuthResponse: AuthenticationResponseJSON = {
    id: regResult.credentialID,
    rawId: regResult.credentialID,
    response: {
      clientDataJSON: isoBase64URL.fromBuffer(authClientDataJSONBytes),
      authenticatorData: isoBase64URL.fromBuffer(authDataForAssertion),
      signature: isoBase64URL.fromBuffer(derSignature),
      userHandle: undefined
    },
    clientExtensionResults: {},
    type: 'public-key'
  }

  const authResult = await verifyAuthenticationResponse(
    validAuthResponse,
    browserChallenge,
    TEST_ORIGIN,
    TEST_RP_ID,
    storedCredential
  )

  assert(authResult.verified === true, 'valid authentication should be verified')
  assert(authResult.newCounter === 1, 'newCounter should be 1')
  console.log('PASS: verifyAuthenticationResponse() accepts valid response')

  // =========================================================================
  // 7. verifyAuthenticationResponse() - invalid response (wrong challenge)
  // =========================================================================
  console.log('\n--- Test 7: verifyAuthenticationResponse() - invalid ---')

  const invalidAuthClientData = {
    type: 'webauthn.get',
    challenge: 'wrong-auth-challenge',
    origin: TEST_ORIGIN,
    crossOrigin: false
  }
  const invalidAuthClientDataJSONBytes = isoUint8Array.fromUTF8String(
    JSON.stringify(invalidAuthClientData)
  )

  const invalidAuthResponse: AuthenticationResponseJSON = {
    id: regResult.credentialID,
    rawId: regResult.credentialID,
    response: {
      clientDataJSON: isoBase64URL.fromBuffer(invalidAuthClientDataJSONBytes),
      authenticatorData: isoBase64URL.fromBuffer(authDataForAssertion),
      signature: isoBase64URL.fromBuffer(derSignature),
      userHandle: undefined
    },
    clientExtensionResults: {},
    type: 'public-key'
  }

  try {
    await verifyAuthenticationResponse(
      invalidAuthResponse,
      browserChallenge,
      TEST_ORIGIN,
      TEST_RP_ID,
      storedCredential
    )
    fail('verifyAuthenticationResponse should throw for wrong challenge')
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes('challenge'),
      'should throw about unexpected challenge'
    )
    console.log('PASS: verifyAuthenticationResponse() rejects invalid challenge')
  }

  // =========================================================================
  // 8. verifyAuthenticationResponse() - invalid signature
  // =========================================================================
  console.log('\n--- Test 8: verifyAuthenticationResponse() - invalid signature ---')

  const badSigResponse: AuthenticationResponseJSON = {
    id: regResult.credentialID,
    rawId: regResult.credentialID,
    response: {
      clientDataJSON: isoBase64URL.fromBuffer(authClientDataJSONBytes),
      authenticatorData: isoBase64URL.fromBuffer(authDataForAssertion),
      signature: isoBase64URL.fromBuffer(randomBytes(64)),
      userHandle: undefined
    },
    clientExtensionResults: {},
    type: 'public-key'
  }

  try {
    await verifyAuthenticationResponse(
      badSigResponse,
      browserChallenge,
      TEST_ORIGIN,
      TEST_RP_ID,
      storedCredential
    )
    fail('verifyAuthenticationResponse should throw for invalid signature')
  } catch (error) {
    assert(
      error instanceof Error,
      'should throw Error for invalid signature'
    )
    console.log('PASS: verifyAuthenticationResponse() rejects invalid signature')
  }

  // =========================================================================
  // 9. verifyAuthenticationResponse() - counter mismatch
  // =========================================================================
  console.log('\n--- Test 9: verifyAuthenticationResponse() - counter mismatch ---')

  // Use a credential with counter=5 but authData says counter=1
  const staleCredential: WebAuthnCredential = {
    credentialID: regResult.credentialID,
    credentialPublicKey: regResult.credentialPublicKey,
    counter: 5,
    transports: ['internal'] as AuthenticatorTransportFuture[]
  }

  try {
    await verifyAuthenticationResponse(
      validAuthResponse,
      browserChallenge,
      TEST_ORIGIN,
      TEST_RP_ID,
      staleCredential
    )
    fail('verifyAuthenticationResponse should throw for counter mismatch')
  } catch (error) {
    assert(
      error instanceof Error,
      'should throw Error for counter mismatch'
    )
    console.log('PASS: verifyAuthenticationResponse() rejects counter mismatch')
  }

  console.log('\nAll WebAuthn ceremony tests passed.')
}

run().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
