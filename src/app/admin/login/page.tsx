'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, AlertCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export const dynamic = 'force-dynamic'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      if (result.error === '2FA_REQUIRED') {
        setPendingEmail(email)
        setShow2FA(true)
        setError(null)
      } else {
        setError('Invalid email or password')
      }
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  async function handle2FAVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!pendingEmail || twoFactorToken.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/2fa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail,
          token: twoFactorToken
        })
      })

      const data = await response.json()

      if (response.ok && data.valid && data.user) {
        const result = await signIn('credentials-2fa', {
          userId: data.user.id,
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
        setTwoFactorToken('')
      }
    } catch {
      setError('Failed to verify code')
    } finally {
      setIsLoading(false)
    }
  }

  if (show2FA) {
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

          <form onSubmit={handle2FAVerify} className="glass-card p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                type="text"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Verify
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShow2FA(false)
                  setPendingEmail(null)
                  setTwoFactorToken('')
                  setError(null)
                }}
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

  return (
    <div className="min-h-screen bg-dark-950 mesh-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400">Sign in to manage your content</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                required
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="pl-10"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 mesh-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}