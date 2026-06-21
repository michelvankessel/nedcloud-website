import { prisma } from '../src/lib/prisma'

async function reset() {
  try {
    await prisma.user.update({
      where: { email: 'admin@nedcloudsolutions.nl' },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorVerifiedAt: null
      }
    })
    console.log('2FA disabled for test user')
  } catch (e) {
    console.error('Failed to reset 2FA:', e)
  } finally {
    await prisma.$disconnect()
  }
}

reset()
