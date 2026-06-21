import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import type { DefaultSession, Session } from 'next-auth'
import { CredentialsSignin } from '@auth/core/errors'
import { logLoginAttempt } from '@/lib/security-logger'
import { isLockedOut, recordFailedLogin, recordSuccessfulLogin } from '@/lib/loginLockout'
import { verifyTOTP, decryptSecret } from '@/lib/totp'

/** Thrown from the credentials authorize callback when 2FA is required. */
class TwoFactorRequired extends CredentialsSignin {
  code = '2FA_REQUIRED'
}

/** Thrown from the credentials authorize callback when the account is locked out. */
class LockedOutError extends CredentialsSignin {
  code = 'LOCKED_OUT'
}

function getIpFromHeaders(headers?: Headers): string {
  if (!headers) return 'unknown'

  const forwarded = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return 'unknown'
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'ADMIN' | 'EDITOR'
    } & DefaultSession['user']
  }
}

export function requireRole(
  session: Session | null,
  allowedRoles: Array<'ADMIN' | 'EDITOR'>
): Session {
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden: insufficient role')
  }

  return session
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const ip = getIpFromHeaders(request?.headers)
        const userAgent = request?.headers?.get('user-agent') ?? 'unknown'

        const emailLockout = isLockedOut(email)
        if (emailLockout.locked) {
          logLoginAttempt(ip, userAgent, false, undefined)
          const error = new LockedOutError()
          error.cause = { remainingSeconds: emailLockout.remainingSeconds }
          throw error
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          recordFailedLogin(email)
          logLoginAttempt(ip, userAgent, false, user?.id)
          return null
        }

        const passwordValid = await compare(
          credentials.password as string,
          user.password as string
        )

        if (!passwordValid) {
          recordFailedLogin(email)
          logLoginAttempt(ip, userAgent, false, user.id)
          return null
        }

        recordSuccessfulLogin(email)
        logLoginAttempt(ip, userAgent, true, user.id)

        if (user.twoFactorEnabled) {
          throw new TwoFactorRequired()
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
    Credentials({
      id: 'credentials-2fa',
      name: 'credentials-2fa',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        twoFactorToken: { label: '2FA Token', type: 'text' },
      },
      async authorize(credentials, request) {
        if (!credentials?.userId || !credentials?.twoFactorToken) {
          return null
        }

        const userId = credentials.userId as string
        const twoFactorToken = credentials.twoFactorToken as string
        const ip = getIpFromHeaders(request?.headers)
        const userAgent = request?.headers?.get('user-agent') ?? 'unknown'

        const user = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
          logLoginAttempt(ip, userAgent, false, userId)
          return null
        }

        const decryptedSecret = decryptSecret(user.twoFactorSecret)
        const isValid = verifyTOTP(twoFactorToken, decryptedSecret)

        if (!isValid) {
          logLoginAttempt(ip, userAgent, false, userId)
          return null
        }

        logLoginAttempt(ip, userAgent, true, userId)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
    Credentials({
      id: 'credentials-webauthn',
      name: 'credentials-webauthn',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        webauthnChallenge: { label: 'WebAuthn Challenge', type: 'text' },
        webauthnResponse: { label: 'WebAuthn Response', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.userId) {
          return null
        }

        const userId = credentials.userId as string

        const user = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!user) {
          return null
        }

        // The WebAuthn authentication was already verified by
        // /api/webauthn/authenticate/finish — the challenge was consumed,
        // the response was verified, and the credential counter was updated.
        // This provider only needs to create the session for the verified user.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'ADMIN' | 'EDITOR'
      }
      return session
    },
  },
})
