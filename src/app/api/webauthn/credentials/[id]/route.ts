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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limitedResponse = await authRateLimit(request)
  if (limitedResponse) return limitedResponse

  const session = await auth()

  if (!session?.user?.id) {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PATCH',
      '/api/webauthn/credentials/[id]',
      undefined,
      401
    )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name } = body

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const credential = await prisma.webAuthnCredential.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!credential) {
      logAPIRequest(
        getClientIp(request),
        request.headers.get('user-agent') || 'unknown',
        'PATCH',
        `/api/webauthn/credentials/${id}`,
        session.user.id,
        404
      )
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.webAuthnCredential.update({
      where: { id: credential.id },
      data: { name: name.trim() },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PATCH',
      `/api/webauthn/credentials/${id}`,
      session.user.id,
      200
    )

    return NextResponse.json({
      success: true,
      credential: {
        id: updated.id,
        name: updated.name,
      },
    })
  } catch (error) {
    console.error('WebAuthn credential update error:', error)
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PATCH',
      '/api/webauthn/credentials/[id]',
      session.user.id,
      500
    )
    return NextResponse.json(
      { error: 'Failed to update credential' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limitedResponse = await authRateLimit(request)
    if (limitedResponse) return limitedResponse

    const session = await auth()

    if (!session?.user?.id) {
      logAPIRequest(
        getClientIp(request),
        request.headers.get('user-agent') || 'unknown',
        'DELETE',
        '/api/webauthn/credentials/[id]',
        undefined,
        401
      )
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const credential = await prisma.webAuthnCredential.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!credential) {
      logAPIRequest(
        getClientIp(request),
        request.headers.get('user-agent') || 'unknown',
        'DELETE',
        `/api/webauthn/credentials/${id}`,
        session.user.id,
        404
      )
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    const remainingCredentials = await prisma.webAuthnCredential.count({
      where: { userId: session.user.id },
    })

    const isLastCredential = remainingCredentials <= 1

    if (isLastCredential) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          twoFactorEnabled: true,
          twoFactorSecret: true,
        },
      })

      // hasRecovery means the user has a valid TOTP secret as fallback.
      // Backup codes alone are NOT usable without a TOTP secret
      // (confirmed by /api/2fa/login which requires twoFactorSecret !== null).
      const hasRecovery =
        user?.twoFactorEnabled === true &&
        user.twoFactorSecret !== null

      if (!hasRecovery) {
        // No recovery option — delete the credential and disable 2FA
        await prisma.webAuthnCredential.delete({
          where: { id: credential.id },
        })

        if (user?.twoFactorEnabled) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { twoFactorEnabled: false },
          })
        }

        logAPIRequest(
          getClientIp(request),
          request.headers.get('user-agent') || 'unknown',
          'DELETE',
          `/api/webauthn/credentials/${id}`,
          session.user.id,
          200
        )

        return NextResponse.json({
          success: true,
          twoFactorDisabled: true,
          message:
            'Security key removed. Two-factor authentication was disabled as no second factor remains.',
        })
      }
    }

    await prisma.webAuthnCredential.delete({
      where: { id: credential.id },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      `/api/webauthn/credentials/${id}`,
      session.user.id,
      200
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WebAuthn credential delete error:', error)
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      '/api/webauthn/credentials/[id]',
      undefined,
      500
    )
    if (error instanceof Response) {
      return error
    }
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    )
  }
}
