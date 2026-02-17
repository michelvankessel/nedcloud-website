import * as crypto from 'crypto'
import { OTP } from 'otplib'
import QRCode from 'qrcode'

const APP_NAME = 'Nedcloud Solutions'

const otp = new OTP()

export function generateTOTPSecret(): string {
  return otp.generateSecret()
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const result = otp.verifySync({ token, secret })
    return result.valid === true
  } catch {
    return false
  }
}

export async function generateQRCodeDataURL(
  secret: string,
  email: string
): Promise<string> {
  const otpauth = otp.generateURI({
    secret,
    issuer: APP_NAME,
    label: email
  })
  return QRCode.toDataURL(otpauth)
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => crypto.createHash('sha256').update(code).digest('hex'))
}

export function verifyBackupCode(
  providedCode: string,
  hashedCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const hashedProvided = crypto
    .createHash('sha256')
    .update(providedCode.toUpperCase())
    .digest('hex')

  const index = hashedCodes.indexOf(hashedProvided)
  if (index === -1) {
    return { valid: false, remainingCodes: hashedCodes }
  }

  const remainingCodes = [
    ...hashedCodes.slice(0, index),
    ...hashedCodes.slice(index + 1)
  ]

  return { valid: true, remainingCodes }
}

export function encryptSecret(secret: string, key?: string): string {
  const encryptionKey = key || process.env.NEXTAUTH_SECRET || 'default-key'
  const iv = crypto.randomBytes(16)
  const derivedKey = crypto
    .createHash('sha256')
    .update(encryptionKey)
    .digest()
    .slice(0, 32)

  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv)
  let encrypted = cipher.update(secret, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

export function decryptSecret(encryptedSecret: string, key?: string): string {
  const encryptionKey = key || process.env.NEXTAUTH_SECRET || 'default-key'
  const [ivHex, encrypted] = encryptedSecret.split(':')

  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted secret format')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const derivedKey = crypto
    .createHash('sha256')
    .update(encryptionKey)
    .digest()
    .slice(0, 32)

  const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}