import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAuthenticationOptions, getWebAuthnConfig } from '@/lib/webauthn'
import { createChallenge } from '@/lib/webauthn-challenge'
import { rateLimit } from '@/lib/rateLimit'
import { logAPIRequest } from '@/lib/security-logger'
import type { AuthenticatorTransportFuture } from '@simplewebauthn/types'

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
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    getWebAuthnConfig()

    let options

    if (user) {
      const credentials = await prisma.webAuthnCredential.findMany({
        where: { userId: user.id },
        select: {
          credentialId: true,
          publicKey: true,
          counter: true,
          transports: true
        }
      })

      if (credentials.length > 0) {
        const challengeResult = await createChallenge({
          userId: user.id,
          purpose: 'authentication',
          ttlSeconds: 300
        })

        options = await generateAuthenticationOptions(
          challengeResult.challenge,
          credentials.map(credential => ({
            credentialID: credential.credentialId,
            credentialPublicKey: Buffer.from(credential.publicKey),
            counter: credential.counter,
            transports: credential.transports.length > 0
              ? (credential.transports as AuthenticatorTransportFuture[])
              : undefined
          }))
        )
      } else {
        const challengeResult = await createChallenge({
          purpose: 'authentication',
          ttlSeconds: 300
        })

        options = await generateAuthenticationOptions(challengeResult.challenge)
      }
    } else {
      const challengeResult = await createChallenge({
        purpose: 'authentication',
        ttlSeconds: 300
      })

      options = await generateAuthenticationOptions(challengeResult.challenge)
    }

    logAPIRequest(ip, userAgent, 'POST', '/api/webauthn/authenticate/start', undefined, 200)

    return NextResponse.json({ options }, { status: 200 })
  } catch (error) {
    console.error('WebAuthn authenticate start error:', error)
    return NextResponse.json(
      { error: 'Failed to start WebAuthn authentication' },
      { status: 500 }
    )
  }
}
