import {
  generateRegistrationOptions as simpleGenerateRegistrationOptions,
  verifyRegistrationResponse as simpleVerifyRegistrationResponse,
  generateAuthenticationOptions as simpleGenerateAuthenticationOptions,
  verifyAuthenticationResponse as simpleVerifyAuthenticationResponse
} from '@simplewebauthn/server'

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  PublicKeyCredentialDescriptorFuture,
  AuthenticatorDevice,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture
} from '@simplewebauthn/types'

export interface WebAuthnConfig {
  rpID: string
  rpName: string
  origin: string
}

export interface WebAuthnCredential {
  credentialID: string
  credentialPublicKey: Buffer | Uint8Array
  counter: number
  transports?: AuthenticatorTransportFuture[]
}

function credentialToDescriptor(
  credentialID: string,
  transports: AuthenticatorTransportFuture[] = []
): PublicKeyCredentialDescriptorFuture {
  return {
    id: Buffer.from(credentialID, 'base64url'),
    type: 'public-key',
    transports
  }
}

export interface WebAuthnVerificationResult {
  verified: boolean
  credentialID: string
  credentialPublicKey: Buffer | Uint8Array
  counter: number
  transports: AuthenticatorTransportFuture[]
  aaguid: string | undefined
  deviceType: string
  backedUp: boolean
}

export interface WebAuthnAuthenticationResult {
  verified: boolean
  newCounter: number
}

export function getWebAuthnConfig(): WebAuthnConfig {
  const rpID = process.env.WEBAUTHN_RP_ID
  const rpName = process.env.WEBAUTHN_RP_NAME
  const origin = process.env.WEBAUTHN_ORIGIN

  if (!rpID || rpID.trim() === '') {
    throw new Error('WEBAUTHN_RP_ID environment variable is required')
  }

  if (!rpName || rpName.trim() === '') {
    throw new Error('WEBAUTHN_RP_NAME environment variable is required')
  }

  if (!origin || origin.trim() === '') {
    throw new Error('WEBAUTHN_ORIGIN environment variable is required')
  }

  return { rpID, rpName, origin }
}

function encodeUserId(userId: string): string {
  return Buffer.from(userId, 'utf8').toString('base64url')
}

function base64urlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url')
}

export async function generateRegistrationOptions(
  userId: string,
  email: string,
  existingCredentialIds: string[] = []
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const { rpID, rpName } = getWebAuthnConfig()

  const excludeCredentials: PublicKeyCredentialDescriptorFuture[] =
    existingCredentialIds.map(id => credentialToDescriptor(id))

  return simpleGenerateRegistrationOptions({
    rpName,
    rpID,
    userID: encodeUserId(userId),
    userName: email,
    userDisplayName: email,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      userVerification: 'required',
      residentKey: 'preferred'
    }
  })
}

export async function verifyRegistrationResponse(
  response: RegistrationResponseJSON,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string
): Promise<WebAuthnVerificationResult> {
  const result = await simpleVerifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID
  })

  if (!result.verified || !result.registrationInfo) {
    return {
      verified: false,
      credentialID: '',
      credentialPublicKey: Buffer.alloc(0),
      counter: 0,
      transports: [],
      aaguid: undefined,
      deviceType: '',
      backedUp: false
    }
  }

  const info = result.registrationInfo

  return {
    verified: true,
    credentialID: base64urlEncode(info.credentialID),
    credentialPublicKey: Buffer.from(info.credentialPublicKey),
    counter: info.counter,
    transports: response.response.transports ?? [],
    aaguid: info.aaguid || undefined,
    deviceType: info.credentialDeviceType,
    backedUp: info.credentialBackedUp
  }
}

export async function generateAuthenticationOptions(
  challenge: string,
  credentials: WebAuthnCredential[] = []
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const { rpID } = getWebAuthnConfig()

  const allowCredentials: PublicKeyCredentialDescriptorFuture[] =
    credentials.map(credential =>
      credentialToDescriptor(credential.credentialID, credential.transports)
    )

  // SimpleWebAuthn treats a string challenge as UTF-8 bytes and re-encodes it,
  // which would produce a different value than what's in the DB.
  // Pass raw bytes so SimpleWebAuthn's isoBase64URL.fromBuffer() produces
  // the same base64url string we stored.
  const challengeBytes = Buffer.from(challenge, 'base64url')

  return simpleGenerateAuthenticationOptions({
    rpID,
    allowCredentials,
    challenge: challengeBytes,
    userVerification: 'required'
  })
}

export async function verifyAuthenticationResponse(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  expectedOrigin: string,
  expectedRPID: string,
  credential: WebAuthnCredential
): Promise<WebAuthnAuthenticationResult> {
  const authenticator: AuthenticatorDevice = {
    credentialID: Buffer.from(credential.credentialID, 'base64url'),
    credentialPublicKey: credential.credentialPublicKey,
    counter: credential.counter,
    transports: credential.transports ?? []
  }

  const result = await simpleVerifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    authenticator
  })

  return {
    verified: result.verified,
    newCounter: result.authenticationInfo.newCounter
  }
}
