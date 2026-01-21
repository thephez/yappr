'use client'

import { useState, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { XMarkIcon, KeyIcon, ExclamationTriangleIcon, CheckCircleIcon, ClipboardIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon, CheckIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'
import { YAPPR_CONTRACT_ID } from '@/lib/constants'

interface AddEncryptionKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'intro' | 'generate' | 'confirm' | 'critical-key' | 'adding' | 'success' | 'error'

/**
 * AddEncryptionKeyModal Component
 *
 * Modal for generating and adding an encryption key to an identity.
 * Implements PRD §6.2 - Key Addition Flow
 *
 * NOTE: Adding an encryption key to an identity requires a MASTER
 * security level key for signing. The typical HIGH security level login key
 * is insufficient for identity modifications on Dash Platform (SDK dev.11+).
 */
export function AddEncryptionKeyModal({
  isOpen,
  onClose,
  onSuccess,
}: AddEncryptionKeyModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('intro')
  const [privateKeyWif, setPrivateKeyWif] = useState<string>('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // MASTER key for identity modification
  const [criticalKeyWif, setCriticalKeyWif] = useState<string>('')
  const [showCriticalKey, setShowCriticalKey] = useState(false)
  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const [keyValidationError, setKeyValidationError] = useState<string | null>(null)

  // Generate a new encryption keypair
  const generateKeyPair = useCallback(async () => {
    try {
      // Generate random 32 bytes for private key
      const privateKeyBytes = new Uint8Array(32)
      crypto.getRandomValues(privateKeyBytes)

      // Convert to WIF format
      const { privateKeyToWif } = await import('@/lib/crypto/wif')
      const privateWif = privateKeyToWif(privateKeyBytes, 'testnet', true)

      setPrivateKeyWif(privateWif)
      setStep('generate')
    } catch (err) {
      console.error('Error generating keypair:', err)
      setError('Failed to generate encryption key')
      setStep('error')
    }
  }, [])

  // Copy private key to clipboard
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(privateKeyWif)
      setHasCopied(true)
      toast.success('Private key copied to clipboard')
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy to clipboard')
    }
  }, [privateKeyWif])

  // Add the encryption key to identity
  const addKeyToIdentity = useCallback(async () => {
    if (!user || !privateKeyWif || !criticalKeyWif.trim()) return

    setStep('adding')
    setError(null)

    try {
      const { storeEncryptionKey } = await import('@/lib/secure-storage')
      const { parsePrivateKey } = await import('@/lib/crypto/wif')

      // Parse the WIF key to get bytes
      const parsed = parsePrivateKey(privateKeyWif)
      const privateKeyBytes = parsed.privateKey

      // Add the encryption key to identity using the MASTER-level key
      const { identityService } = await import('@/lib/services/identity-service')
      const result = await identityService.addEncryptionKey(
        user.identityId,
        privateKeyBytes,
        criticalKeyWif.trim(),
        YAPPR_CONTRACT_ID // Contract-bound to Yappr
      )

      if (result.success) {
        // Store the encryption key in session (WIF format)
        storeEncryptionKey(user.identityId, privateKeyWif)

        setStep('success')
        toast.success('Encryption key added to your identity!')

        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.error || 'Failed to add encryption key')
        setStep('error')
      }
    } catch (err) {
      console.error('Error adding encryption key:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setStep('error')
    }
  }, [user, privateKeyWif, criticalKeyWif, onSuccess])

  // Validate the CRITICAL key before proceeding
  const validateCriticalKey = useCallback(async () => {
    if (!user || !criticalKeyWif.trim()) {
      setKeyValidationError('Please enter your MASTER key')
      return
    }

    setIsValidatingKey(true)
    setKeyValidationError(null)

    try {
      const { identityService } = await import('@/lib/services/identity-service')
      const validation = await identityService.validateKeySecurityLevel(
        criticalKeyWif.trim(),
        user.identityId
      )

      if (!validation.isValid) {
        setKeyValidationError(validation.error || 'Invalid key')
        setIsValidatingKey(false)
        return
      }

      // Key is valid, proceed to add the encryption key
      setIsValidatingKey(false)
      await addKeyToIdentity()
    } catch (err) {
      console.error('Error validating key:', err)
      setKeyValidationError(err instanceof Error ? err.message : 'Failed to validate key')
      setIsValidatingKey(false)
    }
  }, [user, criticalKeyWif, addKeyToIdentity])

  // Handle close
  const handleClose = useCallback(() => {
    // Reset state
    setStep('intro')
    setPrivateKeyWif('')
    setShowPrivateKey(false)
    setHasCopied(false)
    setHasConfirmedBackup(false)
    setError(null)
    setCriticalKeyWif('')
    setShowCriticalKey(false)
    setKeyValidationError(null)
    onClose()
  }, [onClose])

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'intro':
        return (
          <>
            <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
              <KeyIcon className="h-6 w-6 text-yappr-500" />
              Add Encryption Key
            </Dialog.Title>

            <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-4">
              To use private feeds, you need an encryption key on your identity.
            </Dialog.Description>

            <div className="space-y-4 mb-6">
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                <div className="flex gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
                    <p className="font-medium">Important:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>A new encryption key will be generated for you</li>
                      <li>You <strong>must</strong> save this key securely</li>
                      <li>Without it, you cannot access your private feed data</li>
                      <li>This key is separate from your login key</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <p className="font-medium">MASTER Key Required:</p>
                    <p>
                      Modifying your identity requires your <strong>MASTER</strong> key
                      (not your regular HIGH login key). You&apos;ll need this key in a later step.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-sm">What this key is used for:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex gap-2">
                    <span className="text-yappr-500">•</span>
                    Encrypting your private feed seed
                  </li>
                  <li className="flex gap-2">
                    <span className="text-yappr-500">•</span>
                    Decrypting grants from private feeds you follow
                  </li>
                  <li className="flex gap-2">
                    <span className="text-yappr-500">•</span>
                    Securely managing private feed access
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={generateKeyPair} className="w-full">
                <KeyIcon className="h-4 w-4 mr-2" />
                Generate Encryption Key
              </Button>
              <Button onClick={handleClose} variant="outline" className="w-full">
                Cancel
              </Button>
            </div>
          </>
        )

      case 'generate':
        return (
          <>
            <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
              <KeyIcon className="h-6 w-6 text-yappr-500" />
              Save Your Encryption Key
            </Dialog.Title>

            <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-4">
              Your encryption key has been generated. Save it securely now.
            </Dialog.Description>

            <div className="space-y-4 mb-6">
              {/* Warning */}
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <p className="font-bold">Save this key NOW!</p>
                    <p>Once you close this dialog, you cannot view this key again.</p>
                  </div>
                </div>
              </div>

              {/* Private Key Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Private Key (WIF)</label>
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex-1 p-3 font-mono text-sm overflow-hidden min-h-[44px] flex items-center">
                    {showPrivateKey ? (
                      <span>
                        {privateKeyWif.slice(0, Math.ceil(privateKeyWif.length / 2))}
                        <br />
                        {privateKeyWif.slice(Math.ceil(privateKeyWif.length / 2))}
                      </span>
                    ) : (
                      <span className="truncate">••••••••••••••••••••••••••••••••</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-2 border-l border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title={showPrivateKey ? 'Hide key' : 'Show key'}
                    >
                      {showPrivateKey ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {hasCopied ? (
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <ClipboardIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Backup Confirmation */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <input
                  type="checkbox"
                  id="confirm-backup"
                  checked={hasConfirmedBackup}
                  onChange={(e) => setHasConfirmedBackup(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-yappr-600 focus:ring-yappr-500"
                />
                <label
                  htmlFor="confirm-backup"
                  className="text-sm cursor-pointer select-none"
                >
                  I have securely saved my private key in a password manager or other secure location
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setStep('confirm')}
                disabled={!hasConfirmedBackup}
                className="w-full"
              >
                Continue
              </Button>
              <Button onClick={handleClose} variant="outline" className="w-full">
                Cancel (key will be lost)
              </Button>
            </div>
          </>
        )

      case 'confirm':
        return (
          <>
            <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
              <KeyIcon className="h-6 w-6 text-yappr-500" />
              Confirm Key Addition
            </Dialog.Title>

            <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-4">
              Ready to add the encryption key to your identity.
            </Dialog.Description>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-sm text-blue-800 dark:text-blue-200">
                  What happens next:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li className="flex gap-2">
                    <span>1.</span>
                    <span>You&apos;ll enter your MASTER key to authorize the change</span>
                  </li>
                  <li className="flex gap-2">
                    <span>2.</span>
                    <span>A transaction will be broadcast to add this key to your identity</span>
                  </li>
                  <li className="flex gap-2">
                    <span>3.</span>
                    <span>The encryption key will be stored locally for this session</span>
                  </li>
                  <li className="flex gap-2">
                    <span>4.</span>
                    <span>You can then enable your private feed</span>
                  </li>
                </ul>
              </div>

              <div className="text-sm text-gray-500 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p>
                  This will cost a small amount of Dash Platform credits from your identity balance.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => setStep('critical-key')} className="w-full">
                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                Continue with MASTER Key
              </Button>
              <Button onClick={() => setStep('generate')} variant="outline" className="w-full">
                Back
              </Button>
            </div>
          </>
        )

      case 'critical-key':
        return (
          <>
            <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
              <ShieldCheckIcon className="h-6 w-6 text-yappr-500" />
              Enter MASTER Key
            </Dialog.Title>

            <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-4">
              Enter your MASTER key to authorize the identity modification.
            </Dialog.Description>

            <div className="space-y-4 mb-6">
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                <div className="flex gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium">Why is this needed?</p>
                    <p>
                      Dash Platform requires a MASTER security level key to modify
                      your identity. Your regular HIGH login key cannot be used for this operation.
                    </p>
                  </div>
                </div>
              </div>

              {/* MASTER Key Input */}
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>MASTER Key (WIF format)</span>
                  <button
                    type="button"
                    onClick={() => setShowCriticalKey(!showCriticalKey)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                  >
                    {showCriticalKey ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <input
                  type={showCriticalKey ? 'text' : 'password'}
                  value={criticalKeyWif}
                  onChange={(e) => {
                    setCriticalKeyWif(e.target.value)
                    setKeyValidationError(null)
                  }}
                  placeholder="Enter your MASTER private key..."
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-yappr-500"
                />
                {keyValidationError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{keyValidationError}</p>
                )}
              </div>

              <div className="text-xs text-gray-500 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p>
                  <strong>Tip:</strong> Your MASTER key was provided when you created your identity.
                  It starts with &apos;c&apos; (testnet) or &apos;X&apos; (mainnet) and is about 51-52 characters.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={validateCriticalKey}
                disabled={!criticalKeyWif.trim() || isValidatingKey}
                className="w-full"
              >
                {isValidatingKey ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <KeyIcon className="h-4 w-4 mr-2" />
                    Add Encryption Key
                  </>
                )}
              </Button>
              <Button onClick={() => setStep('confirm')} variant="outline" className="w-full" disabled={isValidatingKey}>
                Back
              </Button>
            </div>
          </>
        )

      case 'adding':
        return (
          <>
            <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
              <KeyIcon className="h-6 w-6 text-yappr-500" />
              Adding Encryption Key
            </Dialog.Title>

            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-yappr-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Broadcasting identity update transaction...
              </p>
              <p className="text-sm text-gray-500 mt-2 text-center">
                This may take a few seconds
              </p>
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              Encryption Key Added
            </Dialog.Title>

            <div className="space-y-4 mb-6">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="flex gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <p className="font-medium">Success!</p>
                    <p>Your encryption key has been added to your identity and is now ready to use.</p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>You can now:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Enable your private feed</li>
                  <li>Request access to others&apos; private feeds</li>
                  <li>View encrypted content from feeds you follow</li>
                </ul>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </>
        )

      case 'error':
        return (
          <>
            <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              Error
            </Dialog.Title>

            <div className="space-y-4 mb-6">
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error || 'An unknown error occurred'}
                </p>
              </div>

              {privateKeyWif && (
                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Note:</strong> Your private key was generated. If you saved it, you can try again later using the &quot;Enter Encryption Key&quot; option after manually adding the key to your identity.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => setStep('critical-key')} className="w-full">
                Try Again
              </Button>
              <Button onClick={handleClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </>
        )
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
              >
                <Dialog.Content asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-xl relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {step !== 'adding' && (
                      <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}

                    {renderStepContent()}
                  </motion.div>
                </Dialog.Content>
              </motion.div>
            </Dialog.Overlay>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
