import {
  createChallenge,
  consumeChallenge,
  deleteExpiredChallenges
} from '../src/lib/webauthn-challenge'

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    fail(message)
  }
}

async function run(): Promise<void> {
  await deleteExpiredChallenges()

  // 1. Create a challenge
  const { id, challenge } = await createChallenge({
    purpose: 'registration',
    ttlSeconds: 300
  })
  assert(typeof id === 'string' && id.length > 0, 'created challenge should have an id')
  assert(typeof challenge === 'string' && challenge.length > 0, 'created challenge should have a challenge string')
  console.log('PASS: createChallenge returns id and challenge')

  // 2. Consume it successfully
  const consumed = await consumeChallenge(challenge, 'registration')
  assert(consumed.id === id, 'consumed row id should match created id')
  console.log('PASS: consumeChallenge succeeds on first use')

  // 3. Reuse should fail
  try {
    await consumeChallenge(challenge, 'registration')
    fail('consuming the same challenge twice should throw')
  } catch (error) {
    assert(
      error instanceof Error && error.message === 'Challenge not found or expired',
      'reuse should throw "Challenge not found or expired"'
    )
    console.log('PASS: consumeChallenge rejects reuse')
  }

  // 4. Expired challenge should fail
  const { challenge: expiredChallenge } = await createChallenge({
    purpose: 'authentication',
    ttlSeconds: -1
  })
  try {
    await consumeChallenge(expiredChallenge, 'authentication')
    fail('consuming an expired challenge should throw')
  } catch (error) {
    assert(
      error instanceof Error && error.message === 'Challenge not found or expired',
      'expired challenge should throw "Challenge not found or expired"'
    )
    console.log('PASS: consumeChallenge rejects expired challenge')
  }

  // 5. userId-scoped challenge should not match when userId differs
  const { challenge: scopedChallenge } = await createChallenge({
    userId: 'user-a',
    purpose: 'authentication',
    ttlSeconds: 300
  })
  try {
    await consumeChallenge(scopedChallenge, 'authentication', 'user-b')
    fail('consuming a challenge with wrong userId should throw')
  } catch (error) {
    assert(
      error instanceof Error && error.message === 'Challenge not found or expired',
      'wrong userId should throw "Challenge not found or expired"'
    )
    console.log('PASS: consumeChallenge rejects challenge with mismatched userId')
  }

  // 6. Cleanup removes consumed/expired rows
  const deletedCount = await deleteExpiredChallenges()
  assert(deletedCount >= 1, 'cleanup should remove at least one stale row')
  console.log('PASS: deleteExpiredChallenges removes stale rows')

  console.log('\nAll WebAuthn challenge tests passed.')
}

run().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
