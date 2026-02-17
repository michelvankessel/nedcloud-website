import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTOTP, verifyBackupCode, decryptSecret } from '@/lib/totp'
import { signIn } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true
      }
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this user' },
        { status: 400 }
      )
    }

    const decryptedSecret = decryptSecret(user.twoFactorSecret)
    const isValidTOTP = verifyTOTP(token, decryptedSecret)

    if (isValidTOTP) {
      return NextResponse.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    }

    if (!user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
      return NextResponse.json({ valid: false })
    }

    const { valid, remainingCodes } = verifyBackupCode(
      token,
      user.twoFactorBackupCodes
    )

    if (valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: remainingCodes }
      })

      return NextResponse.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    }

    return NextResponse.json({ valid: false })
  } catch (error) {
    console.error('2FA login verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}