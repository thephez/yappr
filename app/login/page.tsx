'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { PasswordSetModal } from '@/components/auth/password-set-modal'
import { PasswordUnlockModal } from '@/components/auth/password-unlock-modal'
import {
  hasStoredCredential,
  getLastUsedIdentityId,
  storeEncryptedCredential
} from '@/lib/password-encrypted-storage'

export default function LoginPage() {
  const [identityId, setIdentityId] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  // Stored credential states
  const [storedIdentityId, setStoredIdentityId] = useState<string | null>(null)
  const [hasStoredCred, setHasStoredCred] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [showPasswordSetModal, setShowPasswordSetModal] = useState(false)
  const [pendingCredentials, setPendingCredentials] = useState<{ identityId: string; privateKey: string } | null>(null)

  const { login } = useAuth()
  const router = useRouter()

  // Check for stored credentials on mount
  useEffect(() => {
    const lastId = getLastUsedIdentityId()
    if (lastId) {
      setStoredIdentityId(lastId)
      setIdentityId(lastId)
      const hasStored = hasStoredCredential(lastId)
      setHasStoredCred(hasStored)
      if (hasStored) {
        // Automatically show unlock modal for returning users
        setShowUnlockModal(true)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(identityId, privateKey)

      // If remember me is checked, show password set modal
      if (rememberMe) {
        setPendingCredentials({ identityId, privateKey })
        setShowPasswordSetModal(true)
      }
      // Navigation handled by auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlockSuccess = async (decryptedPrivateKey: string) => {
    setShowUnlockModal(false)
    setError(null)
    setIsLoading(true)

    try {
      await login(storedIdentityId!, decryptedPrivateKey)
      // Navigation handled by auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseDifferent = () => {
    setShowUnlockModal(false)
    setHasStoredCred(false)
    setIdentityId('')
    setPrivateKey('')
    setStoredIdentityId(null)
  }

  const handlePasswordSetSuccess = async (password: string) => {
    if (pendingCredentials) {
      await storeEncryptedCredential(
        pendingCredentials.identityId,
        pendingCredentials.privateKey,
        password
      )
    }
    setShowPasswordSetModal(false)
    setPendingCredentials(null)
  }

  const handlePasswordSetCancel = () => {
    setShowPasswordSetModal(false)
    setPendingCredentials(null)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">Yappr</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in with your Dash Platform identity</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="identityId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Identity ID
              </label>
              <input
                id="identityId"
                type="text"
                value={identityId}
                onChange={(e) => setIdentityId(e.target.value)}
                placeholder="e.g., 5DbLwAxGBzUzo81VewMUwn4b5P4bpv9FNFybi25XB5Bk"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yappr-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Private Key (WIF format)
              </label>
              <input
                id="privateKey"
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="e.g., XK6CFyvYUMvY9FVQLeYBZBF..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yappr-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-400">
                Remember me on this device
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yappr-500 focus:ring-offset-2 ${
                  rememberMe ? 'bg-yappr-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    rememberMe ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading || !identityId || !privateKey}
              className="w-full shadow-yappr-lg"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>

          </div>
        </form>

        <div className="mt-8 space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Requirements:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>A Dash Platform identity</li>
              <li>At least one high security key</li>
              <li>Private key in WIF format</li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Security Notice:</h3>
            <p>Your private key is only used locally to sign transactions. It is never sent to any server.</p>
          </div>
        </div>
      </div>

      {/* Password Unlock Modal for returning users */}
      <PasswordUnlockModal
        isOpen={showUnlockModal}
        identityId={storedIdentityId || ''}
        onSuccess={handleUnlockSuccess}
        onCancel={() => setShowUnlockModal(false)}
        onUseDifferent={handleUseDifferent}
      />

      {/* Password Set Modal for new "remember me" users */}
      <PasswordSetModal
        isOpen={showPasswordSetModal}
        onSuccess={handlePasswordSetSuccess}
        onCancel={handlePasswordSetCancel}
      />
    </div>
  )
}
