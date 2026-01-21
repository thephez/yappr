'use client'

import { useState, useEffect } from 'react'
import { Post } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { isPrivatePost } from '@/components/post/private-post-content'

/**
 * Hook to check if the current user can reply to a private post.
 *
 * Per PRD §5.5, replies to private posts inherit encryption from the parent.
 * Users can only reply if:
 * 1. They are logged in
 * 2. They are the post owner (or root post owner), OR
 * 3. They have access to decrypt the post (approved follower with valid keys)
 *
 * @param post - The post to check reply permissions for
 * @param rootPostOwnerId - Optional: The root/parent post owner ID. For replies to private posts,
 *                          access should be checked against the root post owner, not the reply author.
 *
 * Returns:
 * - canReply: boolean - Whether the user can reply
 * - isPrivate: boolean - Whether the post is private
 * - isLoading: boolean - Whether we're still checking access
 * - reason: string - Human-readable reason if can't reply
 */
export function useCanReplyToPrivate(post: Post | null | undefined, rootPostOwnerId?: string): {
  canReply: boolean
  isPrivate: boolean
  isLoading: boolean
  reason: string | null
} {
  const { user } = useAuth()
  const [canDecrypt, setCanDecrypt] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Handle null/undefined post (e.g., while loading)
  const isPrivate = post ? isPrivatePost(post) : false
  // For permission checks, use root post owner if provided (for replies), otherwise use post author
  const feedOwnerId = rootPostOwnerId || post?.author.id
  const isOwner = user?.identityId === feedOwnerId

  useEffect(() => {
    // If post not loaded yet, stay in loading state
    if (!post) {
      setIsLoading(true)
      return
    }

    // If not private, always can reply (via public reply)
    if (!isPrivate) {
      setCanDecrypt(true)
      setIsLoading(false)
      return
    }

    // If not logged in, can't reply
    if (!user) {
      setCanDecrypt(false)
      setIsLoading(false)
      return
    }

    // If owner of the feed, can always reply
    if (isOwner) {
      setCanDecrypt(true)
      setIsLoading(false)
      return
    }

    // Check if user can decrypt - use the feed owner (root post owner for replies)
    const checkAccess = async () => {
      if (!feedOwnerId) return
      setIsLoading(true)
      try {
        const { privateFeedFollowerService } = await import('@/lib/services')
        const canDecryptPost = await privateFeedFollowerService.canDecrypt(feedOwnerId)
        setCanDecrypt(canDecryptPost)
      } catch (error) {
        console.error('Error checking private post access:', error)
        setCanDecrypt(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [post, isPrivate, user, isOwner, feedOwnerId])

  // Determine reason
  let reason: string | null = null
  if (isPrivate && !user) {
    reason = 'Log in to reply to private posts'
  } else if (isPrivate && canDecrypt === false) {
    reason = "Can't reply - no access to this private feed"
  }

  return {
    canReply: !isPrivate || (canDecrypt === true),
    isPrivate,
    isLoading,
    reason
  }
}
