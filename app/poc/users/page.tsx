// POC: Users discovery page with follower counts. Safe to delete.
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSdk } from '@/contexts/sdk-context'
import { UserAvatar } from '@/components/ui/avatar-image'
import { unifiedProfileService } from '@/lib/services/unified-profile-service'
import { followService } from '@/lib/services/follow-service'
import { dpnsService } from '@/lib/services/dpns-service'
import { postService } from '@/lib/services/post-service'
import { User } from '@/lib/types'

function getUserDisplay(user: User): { name: string; username: string | null } {
  const hasUsername = user.username?.trim()
  const hasRealDisplayName = user.displayName &&
    user.displayName !== 'Unknown User' &&
    !user.displayName.startsWith('User ')

  if (hasUsername && hasRealDisplayName) {
    return { name: user.displayName, username: user.username }
  }
  if (hasUsername) {
    return { name: user.username, username: null }
  }
  if (hasRealDisplayName) {
    return { name: user.displayName, username: null }
  }
  return { name: `${user.id.slice(0, 8)}...${user.id.slice(-6)}`, username: null }
}

interface ActiveUser extends User {
  recentPosts: number
}

export default function PocUsersPage() {
  const router = useRouter()
  const { isReady } = useSdk()
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isReady) return

    async function fetchUsers() {
      try {
        // Profile contract only has index on $ownerId, so we can't query all profiles.
        // Instead, discover users through recent posts (most active users).
        const postsResult = await postService.getTimeline({ limit: 100 })

        // Count posts per author
        const postCounts = new Map<string, number>()
        for (const post of postsResult.documents) {
          const count = postCounts.get(post.author.id) || 0
          postCounts.set(post.author.id, count + 1)
        }

        // Get unique author IDs sorted by post count
        const authorIds = Array.from(postCounts.keys())

        console.log('Discovered', authorIds.length, 'unique users from posts')

        if (authorIds.length === 0) {
          setUsers([])
          setLoading(false)
          return
        }

        // Fetch profiles for these users
        const profiles = await unifiedProfileService.getProfilesByIdentityIds(authorIds)

        // Batch enrich (parallel) - usernames and follower counts
        const [usernames, avatars, followerCounts, followingCounts] = await Promise.all([
          dpnsService.resolveUsernamesBatch(authorIds),
          unifiedProfileService.getAvatarUrlsBatch(authorIds),
          Promise.all(authorIds.map(id => followService.countFollowers(id))),
          Promise.all(authorIds.map(id => followService.countFollowing(id)))
        ])

        // Build user objects, using profile data where available
        const profileMap = new Map(profiles.map(p => [p.$ownerId, p]))

        const enrichedUsers: ActiveUser[] = authorIds.map((id, i) => {
          const profile = profileMap.get(id)
          return {
            id,
            documentId: profile?.$id,
            username: usernames.get(id) || id.slice(0, 8) + '...',
            displayName: profile?.displayName || 'Unknown User',
            avatar: avatars.get(id) || '',
            bio: profile?.bio,
            followers: followerCounts[i],
            following: followingCounts[i],
            verified: false,
            joinedAt: profile?.$createdAt ? new Date(profile.$createdAt) : new Date(),
            recentPosts: postCounts.get(id) || 0
          }
        })

        // Sort by recent post activity (most active first)
        enrichedUsers.sort((a, b) => b.recentPosts - a.recentPosts)

        setUsers(enrichedUsers)
      } catch (err) {
        console.error('Failed to fetch users:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [isReady])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold mb-1">Active Users</h1>
      <p className="text-sm text-gray-500 mb-6">Users with recent posts, sorted by activity</p>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-black">
        {users.length === 0 ? (
          <div className="px-4 py-8 text-sm text-gray-500">No users yet.</div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/poc/user?id=${user.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  router.push(`/poc/user?id=${user.id}`)
                }
              }}
              className="flex gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
            >
              {/* Avatar */}
              <div className="shrink-0">
                <UserAvatar
                  userId={user.id}
                  size="md"
                  preloadedUrl={user.avatar}
                />
              </div>

              <div className="min-w-0 flex-1">
                {/* Name and username */}
                <div className="text-gray-900 dark:text-gray-100 font-medium">
                  {(() => {
                    const { name, username } = getUserDisplay(user)
                    return (
                      <>
                        <span>{name}</span>
                        {username && <span className="text-gray-400 ml-1 font-normal">@{username}</span>}
                      </>
                    )
                  })()}
                </div>

                {/* Bio */}
                {user.bio && (
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {user.bio}
                  </div>
                )}

                {/* Stats line */}
                <div className="mt-1 text-xs text-gray-500">
                  <span title="Recent posts">{user.recentPosts} recent {user.recentPosts === 1 ? 'post' : 'posts'}</span>
                  <span className="mx-2">•</span>
                  <span title="Followers">{user.followers} followers</span>
                  <span className="mx-2">•</span>
                  <span title="Following">{user.following} following</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
