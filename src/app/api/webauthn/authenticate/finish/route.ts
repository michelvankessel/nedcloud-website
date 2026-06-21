import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuthenticationResponse, getWebAuthnConfig } from '@/lib/webauthn'
import { consumeChallenge } from '@/lib/webauthn-challenge'
import { rateLimit } from '@/lib/rateLimit'
import { logAPIRequest } from '@/lib/security-logger'
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from '@simplewebauthn/types'

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

  const { ip, userAgent } = getClientInfo(request)

  try {
    const body = await request.json()
    const { challenge, response } = body

    if (!challenge || !response) {
      return NextResponse.json(
        { error: 'Challenge and response are required' },
        { status: 400 }
      )
    }

    const challengeRow = await consumeChallenge(
      challenge as string,
      'authentication'
    )

    if (!challengeRow.userId) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: challengeRow.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 400 }
      )
    }

    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        credentialId: true,
        publicKey: true,
        counter: true,
        transports: true
      }
    })

    const credential = credentials.find(
      c => c.credentialId === (response as AuthenticationResponseJSON).id
    )

    if (!credential) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 400 }
      )
    }

    const { origin, rpID } = getWebAuthnConfig()

    const result = await verifyAuthenticationResponse(
      response as AuthenticationResponseJSON,
      challenge,
      origin,
      rpID,
      {
        credentialID: credential.credentialId,
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransportFuture[]
      }
    )

    if (!result.verified) {
      return NextResponse.json(
        { error: 'Invalid authentication response' },
        { status: 400 }
      )
    }

    await prisma.webAuthnCredential.update({
      where: { id: credential.id },
      data: {
        counter: result.newCounter,
        lastUsedAt: new Date()
      }
    })

    logAPIRequest(ip, userAgent, 'POST', '/api/webauthn/authenticate/finish', user.id, 200)

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      challengeId: challengeRow.id
    })
  } catch (error) {
    console.error('WebAuthn authenticate finish error:', error)
    return NextResponse.json(
      { error: 'Failed to finish WebAuthn authentication' },
      { status: 500 }
    )
  }
}
