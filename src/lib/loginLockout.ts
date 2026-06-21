import { securityConfig } from './security.config'

const { maxAttempts, windowMs, lockoutMs } = securityConfig.lockout

interface LoginAttemptRecord {
  attempts: number[]
  lockedUntil?: number
}

const lockoutStore = new Map<string, LoginAttemptRecord>()

function getNow(): number {
  return Date.now()
}

function cleanupExpiredEntries(): void {
  const now = getNow()
  const windowStart = now - windowMs
  const lockoutCutoff = now - lockoutMs

  for (const [key, record] of lockoutStore.entries()) {
    const hasActiveLockout = record.lockedUntil && record.lockedUntil > now
    const hasRecentAttempts = record.attempts.some((timestamp) => timestamp > windowStart)

    if (!hasActiveLockout && !hasRecentAttempts) {
      lockoutStore.delete(key)
      continue
    }

    record.attempts = record.attempts.filter((timestamp) => timestamp > windowStart)

    if (record.lockedUntil && record.lockedUntil <= lockoutCutoff) {
      record.lockedUntil = undefined
    }

    if (record.attempts.length === 0 && !record.lockedUntil) {
      lockoutStore.delete(key)
    }
  }
}

setInterval(cleanupExpiredEntries, 60 * 1000)

export function recordFailedLogin(identifier: string): void {
  cleanupExpiredEntries()

  const now = getNow()
  const record = lockoutStore.get(identifier) ?? { attempts: [] }
  const windowStart = now - windowMs

  record.attempts = record.attempts.filter((timestamp) => timestamp > windowStart)
  record.attempts.push(now)

  if (record.attempts.length >= maxAttempts) {
    record.lockedUntil = now + lockoutMs
  }

  lockoutStore.set(identifier, record)
}

export function recordSuccessfulLogin(identifier: string): void {
  lockoutStore.delete(identifier)
}

export function isLockedOut(identifier: string): { locked: boolean; remainingSeconds?: number } {
  cleanupExpiredEntries()

  const now = getNow()
  const record = lockoutStore.get(identifier)

  if (!record?.lockedUntil) {
    return { locked: false }
  }

  if (record.lockedUntil > now) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    }
  }

  record.lockedUntil = undefined

  if (record.attempts.length === 0) {
    lockoutStore.delete(identifier)
  }

  return { locked: false }
}
