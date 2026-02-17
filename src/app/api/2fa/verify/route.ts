import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  verifyTOTP,
  generateBackupCodes,
  hashBackupCodes,
  encryptSecret
} from '@/lib/totp'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { token, encryptedSecret } = body

    if (!token || !encryptedSecret) {
      return NextResponse.json(
        { error: 'Token and secret are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 }
      )
    }

    const decryptedSecret = encryptedSecret.split(':')[1]
      ? encryptedSecret
      : Buffer.from(encryptedSecret, 'base64').toString('utf8')

    const isValid = verifyTOTP(token, decryptedSecret.includes(':')
      ? require('@/lib/totp').decryptSecret(encryptedSecret)
      : decryptedSecret
    )

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    const backupCodes = generateBackupCodes(8)
    const hashedBackupCodes = hashBackupCodes(backupCodes)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashedBackupCodes,
        twoFactorVerifiedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      backupCodes
    })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}