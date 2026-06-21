import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { logAPIRequest } from '@/lib/security-logger'

const authRateLimit = rateLimit('auth')

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp
  return 'unknown'
}

export async function GET(request: NextRequest) {
  const limitedResponse = await authRateLimit(request)
  if (limitedResponse) return limitedResponse

  const session = await auth()

  if (!session?.user?.id) {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/webauthn/credentials',
      undefined,
      401
    )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        credentialId: true,
        name: true,
        deviceType: true,
        backedUp: true,
        transports: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/webauthn/credentials',
      session.user.id,
      200
    )

    return NextResponse.json(credentials)
  } catch (error) {
    console.error('WebAuthn credentials list error:', error)
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/webauthn/credentials',
      session.user.id,
      500
    )
    return NextResponse.json(
      { error: 'Failed to load credentials' },
      { status: 500 }
    )
  }
}
