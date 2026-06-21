import { hash } from 'bcryptjs'
import { prisma } from '../src/lib/prisma'
import {
  encryptSecret,
  generateBackupCodes,
  generateTOTPSecret,
  hashBackupCodes,
} from '../src/lib/totp'
import { securityConfig } from '../src/lib/security.config'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET

type Command = 'setup-user' | 'cleanup-credentials' | 'count-credentials'

interface SetupResult {
  success: true
  secret: string
}

interface CleanupResult {
  success: true
  deletedCount: number
}

interface CountResult {
  success: true
  count: number
  names: (string | null)[]
}

type Result = SetupResult | CleanupResult | CountResult

function getEnv(): { email: string; password: string; nextauthSecret: string } {
  if (!ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL environment variable is not set')
  }
  if (!ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD environment variable is not set')
  }
  if (!NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable is not set')
  }

  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, nextauthSecret: NEXTAUTH_SECRET }
}

async function setupUser(): Promise<SetupResult> {
  const { email, password, nextauthSecret } = getEnv()

  const secret = generateTOTPSecret()
  const encryptedSecret = encryptSecret(secret, nextauthSecret)
  const backupCodes = generateBackupCodes(8)
  const hashedBackupCodes = hashBackupCodes(backupCodes)
  const passwordHashRounds = securityConfig.session.passwordHashRounds

  await prisma.user.upsert({
    where: { email },
    update: {
      twoFactorEnabled: true,
      twoFactorSecret: encryptedSecret,
      twoFactorBackupCodes: hashedBackupCodes,
    },
    create: {
      email,
      name: 'Admin User',
      password: await hash(password, passwordHashRounds),
      role: 'ADMIN',
      twoFactorEnabled: true,
      twoFactorSecret: encryptedSecret,
      twoFactorBackupCodes: hashedBackupCodes,
    },
  })

  return { success: true, secret }
}

async function cleanupCredentials(): Promise<CleanupResult> {
  const { email } = getEnv()

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) {
    return { success: true, deletedCount: 0 }
  }

  const result = await prisma.webAuthnCredential.deleteMany({
    where: { userId: user.id },
  })

  return { success: true, deletedCount: result.count }
}

async function countCredentials(): Promise<CountResult> {
  const { email } = getEnv()

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) {
    return { success: true, count: 0, names: [] }
  }

  const credentials = await prisma.webAuthnCredential.findMany({
    where: { userId: user.id },
    select: { name: true },
  })

  return {
    success: true,
    count: credentials.length,
    names: credentials.map(c => c.name ?? null),
  }
}

async function run(): Promise<void> {
  const command = process.argv[2] as Command | undefined

  if (!command) {
    throw new Error('No command provided')
  }

  let result: Result

  switch (command) {
    case 'setup-user':
      result = await setupUser()
      break
    case 'cleanup-credentials':
      result = await cleanupCredentials()
      break
    case 'count-credentials':
      result = await countCredentials()
      break
    default:
      throw new Error(`Unknown command: ${command}`)
  }

  console.log(JSON.stringify(result))
}

run()
  .then(() => {
    void prisma.$disconnect()
  })
  .catch(error => {
    console.error(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    )
    void prisma.$disconnect().finally(() => process.exit(1))
  })
