// POC: Users discovery page with card grid and badges. Safe to delete.
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

interface ActiveUser extends User {
  recentPosts: number
  recentReplies: number
}

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

        // Count posts and replies per author
        const postCounts = new Map<string, number>()
        const replyCounts = new Map<string, number>()
        for (const post of postsResult.documents) {
          const authorId = post.author.id
          postCounts.set(authorId, (postCounts.get(authorId) || 0) + 1)
          if (post.replyToId) {
            replyCounts.set(authorId, (replyCounts.get(authorId) || 0) + 1)
          }
        }

        // Get unique author IDs
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
            recentPosts: postCounts.get(id) || 0,
            recentReplies: replyCounts.get(id) || 0
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
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Split out the top poster from the rest
  const topPoster = users[0]
  const otherUsers = users.slice(1)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold mb-1">Active Users</h1>
      <p className="text-sm text-gray-500 mb-6">Users with recent posts, sorted by activity</p>

      {users.length === 0 ? (
        <div className="text-sm text-gray-500">No users yet.</div>
      ) : (
        <>
          {/* Hero: Top Poster */}
          {topPoster && (() => {
            const { name, username } = getUserDisplay(topPoster)
            const rootPosts = topPoster.recentPosts - topPoster.recentReplies

            return (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Most Active Recently
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500 text-white">
                    🏆 Top Poster
                  </span>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/poc/user?id=${topPoster.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/poc/user?id=${topPoster.id}`)
                    }
                  }}
                  className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-6 cursor-pointer hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/20 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Large avatar */}
                    <div className="shrink-0 flex justify-center sm:justify-start">
                      <UserAvatar
                        userId={topPoster.id}
                        size="xl"
                        preloadedUrl={topPoster.avatar}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {name}
                        </h2>
                        {username && (
                          <span className="text-gray-500">@{username}</span>
                        )}
                      </div>

                      {topPoster.bio && (
                        <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
                          {topPoster.bio}
                        </p>
                      )}

                      {/* Hero-specific stats - grouped semantically */}
                      <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-1 text-sm text-gray-500">
                        <span>
                          🔥 <strong className="text-gray-700 dark:text-gray-300">{topPoster.recentPosts}</strong> total posts
                          <span className="mx-1">·</span>
                          ✍️ <strong className="text-gray-700 dark:text-gray-300">{rootPosts}</strong> original
                          {topPoster.recentReplies > 0 && (
                            <> / 💬 <strong className="text-gray-700 dark:text-gray-300">{topPoster.recentReplies}</strong> replies</>
                          )}
                        </span>
                        <span>👥 <strong className="text-gray-700 dark:text-gray-300">{topPoster.followers}</strong> followers</span>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex justify-center sm:justify-start gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Implement follow functionality
                          }}
                          className="px-4 py-1.5 text-sm font-medium rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                          Follow
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/poc/user?id=${topPoster.id}`)
                          }}
                          className="px-4 py-1.5 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          })()}

          {/* Other Active Users */}
          {otherUsers.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 mb-4">Other Active Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherUsers.map((user, index) => {
                  const { name, username } = getUserDisplay(user)
                  const rank = index + 2 // +2 because top poster is #1
                  const isTopThree = rank <= 3

                  return (
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
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        isTopThree
                          ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                    >
                      {/* Header: Avatar + Name + Follow */}
                      <div className="flex items-start gap-3">
                        {/* Avatar with rank badge for #2 and #3 */}
                        <div className="relative shrink-0">
                          <UserAvatar
                            userId={user.id}
                            size="lg"
                            preloadedUrl={user.avatar}
                          />
                          {isTopThree && (
                            <span className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full bg-amber-500 text-white shadow-sm">
                              {rank}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                            {name}
                          </div>
                          {username && (
                            <div className="text-sm text-gray-400 truncate">@{username}</div>
                          )}
                        </div>
                        {/* Compact follow button - reduced visual weight */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Implement follow functionality
                          }}
                          className="shrink-0 px-3 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                        >
                          + Follow
                        </button>
                      </div>

                      {/* Bio row - fixed height for alignment */}
                      <div className="mt-3 h-10">
                        <p className={`text-sm line-clamp-2 ${user.bio ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                          {user.bio || 'Active in recent conversations'}
                        </p>
                      </div>

                      {/* Stats row - consistent format */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        <span title="Recent posts">🔥 {user.recentPosts} posts</span>
                        <span title="Followers">👥 {user.followers} followers</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
