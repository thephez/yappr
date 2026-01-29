'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getStorachaProvider, isUploadException, getUploadErrorMessage } from '@/lib/upload'
import type { UploadResult } from '@/lib/upload'

export interface UseImageUploadResult {
  /** Upload a file and return the result with CID and URL */
  upload: (file: File) => Promise<UploadResult>
  /** Whether an upload is currently in progress */
  isUploading: boolean
  /** Upload progress (0-100) */
  progress: number
  /** Error message if upload failed */
  error: string | null
  /** Whether a storage provider is connected */
  isProviderConnected: boolean
  /** Check and update provider connection status */
  checkProvider: () => Promise<boolean>
  /** Clear any error state */
  clearError: () => void
}

/**
 * Hook for handling image uploads to IPFS via Storacha.
 *
 * Usage:
 * ```tsx
 * const { upload, isUploading, progress, isProviderConnected } = useImageUpload()
 *
 * const handleUpload = async (file: File) => {
 *   try {
 *     const result = await upload(file)
 *     console.log('Uploaded:', result.url) // ipfs://CID
 *   } catch (err) {
 *     // Error is also available in error state
 *   }
 * }
 * ```
 */
export function useImageUpload(): UseImageUploadResult {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isProviderConnected, setIsProviderConnected] = useState(false)

  /**
   * Check if a storage provider is connected
   */
  const checkProvider = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setIsProviderConnected(false)
      return false
    }

    try {
      const provider = getStorachaProvider()
      provider.setIdentityId(user.identityId)

      // If already connected, return true
      if (provider.isConnected()) {
        setIsProviderConnected(true)
        return true
      }

      // Try to connect with stored credentials
      if (provider.hasStoredCredentials()) {
        try {
          await provider.connect()
          setIsProviderConnected(true)
          return true
        } catch {
          // Credentials invalid or expired
          setIsProviderConnected(false)
          return false
        }
      }

      setIsProviderConnected(false)
      return false
    } catch {
      setIsProviderConnected(false)
      return false
    }
  }, [user])

  /**
   * Upload a file to IPFS
   */
  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    if (!user) {
      const errorMsg = 'Not logged in'
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      const provider = getStorachaProvider()
      provider.setIdentityId(user.identityId)

      // Ensure connected
      if (!provider.isConnected()) {
        await provider.connect()
      }

      const result = await provider.uploadImage(file, {
        onProgress: (p) => setProgress(p)
      })

      setProgress(100)
      setIsProviderConnected(true)
      return result
    } catch (err) {
      const errorMsg = getUploadErrorMessage(err)
      setError(errorMsg)

      // Update connection status if it was a connection error
      if (isUploadException(err) && err.code === 'NOT_CONNECTED') {
        setIsProviderConnected(false)
      }

      throw err
    } finally {
      setIsUploading(false)
    }
  }, [user])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    upload,
    isUploading,
    progress,
    error,
    isProviderConnected,
    checkProvider,
    clearError,
  }
}
