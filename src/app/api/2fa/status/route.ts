import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'

const authRateLimit = rateLimit('auth')

export async function GET(request: NextRequest) {
  const limitedResponse = await authRateLimit(request)
  if (limitedResponse) return limitedResponse

  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorVerifiedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      hasTotp: user.twoFactorSecret !== null,
      verifiedAt: user.twoFactorVerifiedAt
    })
  } catch (error) {
    console.error('2FA status error:', error)
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    )
  }
}