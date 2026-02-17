'use client'

import { useState, useEffect } from 'react'
import { Key, User, Save, Shield, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function SettingsManager({ initialUser }: { initialUser: { name: string | null; email: string } }) {
  const [user, setUser] = useState(initialUser)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [setupToken, setSetupToken] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verifyToken, setVerifyToken] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    fetch('/api/2fa/status')
      .then(res => res.json())
      .then(data => {
        setTwoFactorEnabled(data.enabled)
      })
      .catch(console.error)
  }, [])

  const handleStart2FASetup = async () => {
    setIsSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/2fa/setup', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setShowSetup(true)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start 2FA setup' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to start 2FA setup' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!setupToken || setupToken.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a 6-digit code' })
      return
    }

    setIsSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: setupToken,
          encryptedSecret: secret
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setBackupCodes(data.backupCodes)
        setTwoFactorEnabled(true)
        setShowSetup(false)
        setMessage({ type: 'success', text: '2FA enabled successfully! Save your backup codes.' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid verification code' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to verify 2FA' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!verifyToken) {
      setMessage({ type: 'error', text: 'Please enter a verification code' })
      return
    }

    setIsSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setTwoFactorEnabled(false)
        setVerifyToken('')
        setMessage({ type: 'success', text: '2FA disabled successfully' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to disable 2FA' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to disable 2FA' })
    } finally {
      setIsSaving(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleUpdateName = async () => {
    if (!user.name) return
    
    setIsSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name }),
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Name updated successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update name' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update name' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-neon-green/10 text-neon-green' : 'bg-red-500/10 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User size={20} />
          Profile
        </h2>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 bg-dark-700/30 border border-dark-600 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="text-gray-500 text-sm mt-1">Email cannot be changed</p>
          </div>
          
          <Input
            label="Name"
            value={user.name || ''}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            placeholder="Your name"
          />
          
          <Button variant="primary" onClick={handleUpdateName} isLoading={isSaving}>
            <Save size={16} className="mr-2" />
            Save Name
          </Button>
        </div>
      </div>

      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Key size={20} />
          Change Password
        </h2>
        
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            required
          />
          
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
          
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
          
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Key size={16} className="mr-2" />
            Change Password
          </Button>
        </form>
      </div>

      <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl border border-dark-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          {twoFactorEnabled ? <ShieldCheck size={20} className="text-neon-green" /> : <Shield size={20} />}
          Two-Factor Authentication
        </h2>
        
        <div className="space-y-4 max-w-md">
          {twoFactorEnabled ? (
            <>
              <p className="text-neon-green flex items-center gap-2">
                <ShieldCheck size={18} />
                2FA is enabled on your account
              </p>
              <p className="text-gray-400 text-sm">
                You will need to enter a verification code from your authenticator app when signing in.
              </p>
              
              {backupCodes.length > 0 && (
                <div className="bg-dark-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-white">Backup Codes</p>
                    <button
                      onClick={copyBackupCodes}
                      className="text-neon-blue hover:text-neon-green text-sm flex items-center gap-1"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      {copiedCode ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="text-gray-300 bg-dark-800 rounded px-2 py-1">{code}</div>
                    ))}
                  </div>
                  <p className="text-yellow-500 text-xs mt-2">
                    Save these codes securely. They can be used to access your account if you lose your authenticator.
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t border-dark-700">
                <p className="text-sm text-gray-400 mb-2">Disable 2FA</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter code to disable"
                    className="w-48"
                    maxLength={6}
                  />
                  <Button variant="danger" onClick={handleDisable2FA} isLoading={isSaving}>
                    <ShieldOff size={16} className="mr-2" />
                    Disable 2FA
                  </Button>
                </div>
              </div>
            </>
          ) : showSetup ? (
            <div className="space-y-4">
              <p className="text-gray-400">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              
              {qrCode && (
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
              
              <p className="text-gray-500 text-sm">
                Manual entry key: <code className="text-neon-blue">{secret}</code>
              </p>
              
              <div className="pt-4 border-t border-dark-700">
                <p className="text-sm text-gray-400 mb-2">Enter the 6-digit code from your app</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-32"
                    maxLength={6}
                  />
                  <Button variant="primary" onClick={handleVerify2FA} isLoading={isSaving}>
                    Verify & Enable
                  </Button>
                  <Button variant="secondary" onClick={() => setShowSetup(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-400">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>
              <Button variant="primary" onClick={handleStart2FASetup} isLoading={isSaving}>
                <Shield size={16} className="mr-2" />
                Enable 2FA
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}