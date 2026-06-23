/**
 * disable-2fa.ts
 * 
 * Disables TOTP 2FA and removes all WebAuthn credentials for the admin user.
 * 
 * Usage:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/disable-2fa.ts
 * 
 * Prerequisites:
 *   - DATABASE_URL must be set (load from .env.local or export manually)
 *   - ADMIN_EMAIL must be set in .env.local
 */
import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  
  if (!adminEmail) {
    console.error('Error: ADMIN_EMAIL environment variable must be set')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: {
      id: true,
      email: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
      webAuthnCredentials: true,
    },
  })

  if (!user) {
    console.error(`User not found: ${adminEmail}`)
    process.exit(1)
  }

  console.log('Current 2FA state:')
  console.log(`  Email: ${user.email}`)
  console.log(`  twoFactorEnabled: ${user.twoFactorEnabled}`)
  console.log(`  twoFactorSecret: ${user.twoFactorSecret ? 'SET' : 'null'}`)
  console.log(`  twoFactorBackupCodes: ${user.twoFactorBackupCodes.length} codes`)
  console.log(`  webAuthnCredentials: ${user.webAuthnCredentials.length} keys`)

  // Disable TOTP 2FA
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
      twoFactorVerifiedAt: null,
    },
  })

  // Delete all WebAuthn credentials
  if (user.webAuthnCredentials.length > 0) {
    await prisma.webAuthnCredential.deleteMany({
      where: { userId: user.id },
    })
    console.log(`\nDeleted ${user.webAuthnCredentials.length} WebAuthn credential(s)`)
  }

  console.log('\n2FA disabled successfully for admin user')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
