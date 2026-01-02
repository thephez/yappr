'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2, Eye, EyeOff, Unlock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { retrieveDecryptedCredential, removeStoredCredential } from '@/lib/password-encrypted-storage'

interface PasswordUnlockModalProps {
  isOpen: boolean
  identityId: string
  onSuccess: (privateKey: string) => void
  onCancel: () => void
  onUseDifferent: () => void
}

export function PasswordUnlockModal({
  isOpen,
  identityId,
  onSuccess,
  onCancel,
  onUseDifferent
}: PasswordUnlockModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForgotConfirm, setShowForgotConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password) {
      setError('Please enter your password')
      return
    }

    setIsSubmitting(true)
    try {
      const privateKey = await retrieveDecryptedCredential(identityId, password)
      if (privateKey) {
        onSuccess(privateKey)
        setPassword('')
      } else {
        setError('Failed to decrypt credentials')
      }
    } catch (err) {
      setError('Invalid password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = () => {
    setShowForgotConfirm(true)
  }

  const handleConfirmForgot = () => {
    removeStoredCredential(identityId)
    setShowForgotConfirm(false)
    setPassword('')
    setError(null)
    onUseDifferent()
  }

  const handleClose = () => {
    setPassword('')
    setError(null)
    setShowForgotConfirm(false)
    onCancel()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full relative">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {showForgotConfirm ? (
                <>
                  <h1 className="text-2xl font-bold text-center mb-2">Forgot Password?</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    Your stored credentials will be cleared. You&apos;ll need to enter your Identity ID and Private Key again.
                  </p>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowForgotConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="flex-1"
                      onClick={handleConfirmForgot}
                    >
                      Clear & Re-enter
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-yappr-100 dark:bg-yappr-900/30 flex items-center justify-center">
                      <Unlock className="w-8 h-8 text-yappr-600 dark:text-yappr-400" />
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    Enter your password to unlock your credentials
                  </p>

                  {/* Identity display */}
                  <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Identity ID</label>
                    <p className="font-mono text-sm break-all mt-1">
                      {identityId}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="unlockPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="unlockPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full px-3 py-2 pr-10 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yappr-500 focus:border-transparent transition-colors"
                          autoComplete="current-password"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg p-3">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!password || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Unlocking...
                        </>
                      ) : (
                        'Unlock'
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      Forgot password?
                    </button>
                    <button
                      type="button"
                      onClick={onUseDifferent}
                      className="w-full text-sm text-yappr-600 hover:text-yappr-700 dark:text-yappr-400 dark:hover:text-yappr-300 transition-colors"
                    >
                      Use different credentials
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
