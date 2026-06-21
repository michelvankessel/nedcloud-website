import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

export type WebAuthnChallengePurpose = 'registration' | 'authentication'

export interface CreateChallengeInput {
  userId?: string
  purpose: WebAuthnChallengePurpose
  ttlSeconds?: number
}

export interface CreateChallengeResult {
  id: string
  challenge: string
}

export async function createChallenge({
  userId,
  purpose,
  ttlSeconds = 300
}: CreateChallengeInput): Promise<CreateChallengeResult> {
  const challenge = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  const row = await prisma.webAuthnChallenge.create({
    data: {
      userId,
      challenge,
      purpose,
      expiresAt
    }
  })

  return { id: row.id, challenge: row.challenge }
}

export async function consumeChallenge(
  challenge: string,
  purpose: WebAuthnChallengePurpose,
  userId?: string
) {
  const where: {
    challenge: string
    purpose: string
    usedAt: null
    expiresAt: { gt: Date }
    userId?: string | null
  } = {
    challenge,
    purpose,
    usedAt: null,
    expiresAt: { gt: new Date() }
  }

  if (userId !== undefined) {
    where.userId = userId
  }

  const row = await prisma.webAuthnChallenge.findFirst({
    where,
    orderBy: { createdAt: 'desc' }
  })

  if (!row) {
    throw new Error('Challenge not found or expired')
  }

  await prisma.webAuthnChallenge.update({
    where: { id: row.id },
    data: { usedAt: new Date() }
  })

  return row
}

export async function deleteExpiredChallenges(): Promise<number> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const result = await prisma.webAuthnChallenge.deleteMany({
    where: {
      OR: [{ expiresAt: { lte: now } }, { usedAt: { not: null, lte: oneHourAgo } }]
    }
  })

  return result.count
}
