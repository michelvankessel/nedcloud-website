import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyRegistrationResponse, getWebAuthnConfig } from '@/lib/webauthn'
import { consumeChallenge } from '@/lib/webauthn-challenge'
import { rateLimit } from '@/lib/rateLimit'
import { logAPIRequest } from '@/lib/security-logger'
import type { RegistrationResponseJSON } from '@simplewebauthn/types'

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
      '/api/webauthn/register/finish',
      undefined,
      401
    )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ip, userAgent } = getClientInfo(request)

  try {
    const body = await request.json()
    const { challenge, name, response } = body

    if (!challenge || !response) {
      logAPIRequest(
        ip,
        userAgent,
        'POST',
        '/api/webauthn/register/finish',
        session.user.id,
        400
      )
      return NextResponse.json(
        { error: 'Challenge and response are required' },
        { status: 400 }
      )
    }

    await consumeChallenge(
      challenge as string,
      'registration',
      session.user.id
    )

    const { origin, rpID } = getWebAuthnConfig()

    const result = await verifyRegistrationResponse(
      response as RegistrationResponseJSON,
      challenge as string,
      origin,
      rpID
    )

    if (!result.verified) {
      logAPIRequest(
        ip,
        userAgent,
        'POST',
        '/api/webauthn/register/finish',
        session.user.id,
        400
      )
      return NextResponse.json(
        { error: 'Invalid registration response' },
        { status: 400 }
      )
    }

    const existingCredential = await prisma.webAuthnCredential.findFirst({
      where: {
        userId: session.user.id,
        credentialId: result.credentialID
      }
    })

    if (existingCredential) {
      logAPIRequest(
        ip,
        userAgent,
        'POST',
        '/api/webauthn/register/finish',
        session.user.id,
        409
      )
      return NextResponse.json(
        { error: 'Credential already registered' },
        { status: 409 }
      )
    }

    const credential = await prisma.webAuthnCredential.create({
      data: {
        userId: session.user.id,
        credentialId: result.credentialID,
        publicKey: Buffer.from(result.credentialPublicKey),
        counter: result.counter,
        transports: result.transports,
        deviceType: result.deviceType,
        backedUp: result.backedUp,
        aaguid: result.aaguid,
        name: typeof name === 'string' ? name || null : null
      }
    })

    logAPIRequest(
      ip,
      userAgent,
      'POST',
      '/api/webauthn/register/finish',
      session.user.id,
      201
    )

    return NextResponse.json(
      {
        success: true,
        credential: {
          id: credential.id,
          credentialId: credential.credentialId,
          name: credential.name
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('WebAuthn register finish error:', error)
    logAPIRequest(
      ip,
      userAgent,
      'POST',
      '/api/webauthn/register/finish',
      session.user.id,
      500
    )
    return NextResponse.json(
      { error: 'Failed to finish WebAuthn registration' },
      { status: 500 }
    )
  }
}
