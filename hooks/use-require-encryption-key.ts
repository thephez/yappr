'use client'

import { useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useEncryptionKeyModal, EncryptionKeyAction } from './use-encryption-key-modal'

/**
 * Hook to require encryption key for private feed operations.
 *
 * If the user has a private feed enabled but no encryption key in session storage,
 * this will open the encryption key modal. Otherwise, it will execute the callback.
 *
 * Example usage:
 * ```tsx
 * const { requireEncryptionKey, hasEncryptionKey } = useRequireEncryptionKey()
 *
 * const handleCreatePrivatePost = async () => {
 *   const canProceed = await requireEncryptionKey('create_private_post', () => {
 *     // This callback will be called after the key is entered successfully
 *     doCreatePost()
 *   })
 *   if (!canProceed) return // Modal was opened, user needs to enter key
 * }
 * ```
 */
export function useRequireEncryptionKey() {
  const { user } = useAuth()
  const { open: openModal } = useEncryptionKeyModal()

  /**
   * Check if the user has an encryption key stored
   */
  const hasEncryptionKey = useCallback((): boolean => {
    if (typeof window === 'undefined' || !user) return false

    // Dynamically check secure storage to avoid SSR issues
    try {
      const { hasEncryptionKey: checkKey } = require('@/lib/secure-storage')
      return checkKey(user.identityId)
    } catch {
      return false
    }
  }, [user])

  /**
   * Get the stored encryption key as bytes
   */
  const getEncryptionKeyBytes = useCallback((): Uint8Array | null => {
    if (typeof window === 'undefined' || !user) return null

    try {
      const { getEncryptionKey } = require('@/lib/secure-storage')
      const keyHex = getEncryptionKey(user.identityId)
      if (!keyHex) return null

      // Parse hex to bytes
      const cleanHex = keyHex.startsWith('0x') ? keyHex.slice(2) : keyHex
      const bytes = new Uint8Array(32)
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16)
      }
      return bytes
    } catch {
      return null
    }
  }, [user])

  /**
   * Require encryption key for an action.
   * Returns true if key is available, false if modal was opened.
   */
  const requireEncryptionKey = useCallback((
    action: EncryptionKeyAction = 'generic',
    onSuccess?: () => void
  ): boolean => {
    if (!user) return false

    if (hasEncryptionKey()) {
      // Key is available, proceed
      if (onSuccess) onSuccess()
      return true
    }

    // Key not available, open modal
    openModal(action, onSuccess)
    return false
  }, [user, hasEncryptionKey, openModal])

  /**
   * Async version that resolves when key is entered or rejects if skipped
   */
  const requireEncryptionKeyAsync = useCallback((
    action: EncryptionKeyAction = 'generic'
  ): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      if (!user) {
        reject(new Error('User not logged in'))
        return
      }

      const existingKey = getEncryptionKeyBytes()
      if (existingKey) {
        resolve(existingKey)
        return
      }

      // Open modal and wait for completion
      openModal(action, () => {
        const key = getEncryptionKeyBytes()
        if (key) {
          resolve(key)
        } else {
          reject(new Error('Encryption key not entered'))
        }
      })
    })
  }, [user, getEncryptionKeyBytes, openModal])

  return {
    hasEncryptionKey,
    getEncryptionKeyBytes,
    requireEncryptionKey,
    requireEncryptionKeyAsync,
  }
}
