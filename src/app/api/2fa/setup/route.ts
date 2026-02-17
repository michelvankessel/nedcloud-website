import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTOTPSecret, generateQRCodeDataURL, encryptSecret } from '@/lib/totp'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, twoFactorEnabled: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled. Disable it first to set up again.' },
        { status: 400 }
      )
    }

    const secret = generateTOTPSecret()
    const encryptedSecret = encryptSecret(secret)
    const qrCodeDataURL = await generateQRCodeDataURL(secret, user.email)

    return NextResponse.json({
      secret,
      encryptedSecret,
      qrCode: qrCodeDataURL
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Failed to generate 2FA setup' },
      { status: 500 }
    )
  }
}