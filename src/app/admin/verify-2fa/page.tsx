'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AlertCircle, Shield, Fingerprint } from 'lucide-react'
import { startAuthentication } from '@simplewebauthn/browser'
import type { AuthenticationResponseJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export const dynamic = 'force-dynamic'

function Verify2FAContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isWebAuthnLoading, setIsWebAuthnLoading] = useState(false)

  useEffect(() => {
    if (!email) {
      router.push('/admin/login')
    }
  }, [email, router])

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!email) {
      setError('Missing email. Please start from the login page.')
      return
    }

    if (token.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/2fa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      })

      const data = await response.json()

      if (response.ok && data.valid && data.user) {
        const result = await signIn('credentials-2fa', {
          userId: data.user.id,
          twoFactorToken: token,
          redirect: false,
        })

        if (result?.error) {
          setError('Failed to complete login')
        } else {
          router.push('/admin')
          router.refresh()
        }
      } else {
        setError('Invalid verification code')
        setToken('')
      }
    } catch {
      setError('Failed to verify code')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleWebAuthn() {
    if (!email) {
      setError('Missing email. Please start from the login page.')
      return
    }

    setIsWebAuthnLoading(true)
    setError(null)

    try {
      // Step 1: Start WebAuthn authentication
      const startResponse = await fetch('/api/webauthn/authenticate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!startResponse.ok) {
        throw new Error('Failed to start security key authentication')
      }

      const { options } = await startResponse.json() as { options: unknown }

      // Step 2: Trigger browser WebAuthn flow
      let authResponse: AuthenticationResponseJSON
      try {
        authResponse = await startAuthentication(options as PublicKeyCredentialRequestOptionsJSON)
      } catch (err) {
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Security key authentication was cancelled or timed out.')
          return
        }
        throw new Error('Your browser does not support security keys or the operation was cancelled.')
      }

      // Step 3: Finish WebAuthn authentication
      const finishResponse = await fetch('/api/webauthn/authenticate/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge: (options as { challenge?: string }).challenge,
          response: authResponse
        })
      })

      const finishData = await finishResponse.json() as {
        valid?: boolean
        user?: { id: string }
        challengeId?: string
      }

      if (!finishResponse.ok || !finishData.valid || !finishData.user) {
        setError('Security key authentication failed.')
        return
      }

      // Step 4: Sign in with credentials-webauthn provider
      const result = await signIn('credentials-webauthn', {
        userId: finishData.user.id,
        webauthnChallenge: finishData.challengeId,
        webauthnResponse: JSON.stringify(authResponse),
        redirect: false
      })

      if (result?.error) {
        setError('Failed to complete login with security key.')
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch {
      setError('Security key authentication failed. Please try again.')
    } finally {
      setIsWebAuthnLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-dark-950 mesh-background flex items-center justify-center">
        <div className="text-white">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 mesh-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-neon-blue" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h1>
          <p className="text-gray-400">Enter the code from your authenticator app</p>
        </div>

        <form onSubmit={handleVerify} className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Verify
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              isLoading={isWebAuthnLoading}
              onClick={handleWebAuthn}
              iconLeft={<Fingerprint className="w-5 h-5" />}
            >
              Use Security Key
            </Button>

            <button
              type="button"
              onClick={() => router.push('/admin/login')}
              className="w-full text-gray-400 hover:text-white text-sm"
            >
              Use a different account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 mesh-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <Verify2FAContent />
    </Suspense>
  )
}