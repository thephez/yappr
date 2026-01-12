'use client'

import { useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useLoginPromptModal, LoginPromptAction } from '@/hooks/use-login-prompt-modal'

/**
 * Hook that provides utilities for requiring authentication before actions.
 *
 * Usage:
 * ```tsx
 * const { requireAuth, isAuthenticated } = useRequireAuth()
 *
 * const handleLike = () => {
 *   if (!requireAuth('like')) return
 *   // ... proceed with like action
 * }
 * ```
 */
export function useRequireAuth() {
  const { user } = useAuth()
  const { open: openLoginPrompt } = useLoginPromptModal()

  const isAuthenticated = !!user

  /**
   * Check if user is authenticated. If not, opens the login prompt modal.
   * @param action - The type of action being attempted (for display purposes)
   * @returns true if authenticated, false if login prompt was shown
   */
  const requireAuth = useCallback(
    (action: LoginPromptAction = 'generic'): boolean => {
      if (user) {
        return true
      }
      openLoginPrompt(action)
      return false
    },
    [user, openLoginPrompt]
  )

  /**
   * Wrap an async function to require auth before executing.
   * Returns a function that will check auth and either execute
   * the original function or show the login prompt.
   */
  const withAuth = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      action: LoginPromptAction = 'generic'
    ): ((...args: Parameters<T>) => Promise<ReturnType<T> | undefined>) => {
      return async (...args: Parameters<T>) => {
        if (!requireAuth(action)) {
          return undefined
        }
        return fn(...args)
      }
    },
    [requireAuth]
  )

  return {
    /** Whether the user is currently authenticated */
    isAuthenticated,
    /** The current user object (null if not authenticated) */
    user,
    /** Check auth and show login prompt if needed. Returns true if authenticated. */
    requireAuth,
    /** Wrap an async function to require auth before executing */
    withAuth,
    /** Directly open the login prompt modal */
    openLoginPrompt,
  }
}
