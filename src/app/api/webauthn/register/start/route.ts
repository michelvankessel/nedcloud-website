import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateRegistrationOptions } from '@/lib/webauthn'
import { createChallenge } from '@/lib/webauthn-challenge'
import { rateLimit } from '@/lib/rateLimit'
import { logAPIRequest } from '@/lib/security-logger'

const apiRateLimit = rateLimit('api')

function getClientInfo(request: NextRequest): { ip: string; userAgent: string } {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return { ip, userAgent }
}

export async function POST(request: NextRequest) {
  const limitedResponse = await apiRateLimit(request)
  if (limitedResponse) return limitedResponse

  const session = await auth()

  if (!session?.user?.id) {
    const { ip, userAgent } = getClientInfo(request)
    logAPIRequest(
      ip,
      userAgent,
      'POST',
      '/api/webauthn/register/start',
      undefined,
      401
    )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ip, userAgent } = getClientInfo(request)

  try {
    const existingCredentials = await prisma.webAuthnCredential.findMany({
      where: { userId: session.user.id },
      select: { credentialId: true }
    })

    const challengeResult = await createChallenge({
      userId: session.user.id,
      purpose: 'registration',
      ttlSeconds: 300
    })

    const options = await generateRegistrationOptions(
      session.user.id,
      session.user.email ?? '',
      existingCredentials.map(credential => credential.credentialId)
    )

    logAPIRequest(
      ip,
      userAgent,
      'POST',
      '/api/webauthn/register/start',
      session.user.id,
      200
    )

    return NextResponse.json({ options: { ...options, challenge: challengeResult.challenge } })
  } catch (error) {
    console.error('WebAuthn register start error:', error)
    logAPIRequest(
      ip,
      userAgent,
      'POST',
      '/api/webauthn/register/start',
      session.user.id,
      500
    )
    return NextResponse.json(
      { error: 'Failed to start WebAuthn registration' },
      { status: 500 }
    )
  }
}
