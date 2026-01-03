'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { PostCard } from '@/components/post/post-card'
import { Sidebar } from '@/components/layout/sidebar'
import { RightSidebar } from '@/components/layout/right-sidebar'
import { ComposeModal } from '@/components/compose/compose-modal'
import { useAppStore } from '@/lib/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { withAuth, useAuth } from '@/contexts/auth-context'
import { AvatarCanvas } from '@/components/ui/avatar-canvas'
import { generateAvatarV2 } from '@/lib/avatar-generator-v2'
import { LoadingState, useAsyncState } from '@/components/ui/loading-state'
import ErrorBoundary from '@/components/error-boundary'
import { getDashPlatformClient } from '@/lib/dash-platform-client'
import { cacheManager } from '@/lib/cache-manager'
import { dpnsService } from '@/lib/services/dpns-service'
import { profileService } from '@/lib/services/profile-service'
import { postService } from '@/lib/services/post-service'

function FeedPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const { setComposeOpen } = useAppStore()
  const { user } = useAuth()
  const postsState = useAsyncState<any[]>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [lastPostId, setLastPostId] = useState<string | null>(null)

  // Track enrichment to prevent duplicate requests
  // Uses a batch ID (hash of post IDs) to detect new loads vs updates to existing posts
  const lastEnrichedBatchId = useRef<string | null>(null)
  const enrichmentInProgress = useRef(false)
  
  // Prevent hydration mismatches
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // Generate avatar based on identity ID (only after hydration)
  const avatarFeatures = user && isHydrated ? generateAvatarV2(user.identityId) : null
  
  // Load posts function - using real WASM SDK with updated version
  const loadPosts = useCallback(async (forceRefresh: boolean = false, startAfter?: string) => {
    // Use the setter functions directly, not the whole postsState object
    const { setLoading, setError, setData } = postsState

    // Only show main loading state for initial load
    if (!startAfter) {
      setLoading(true)
    }
    setError(null)

    try {
      console.log('Feed: Loading posts from Dash Platform...', startAfter ? `(after ${startAfter})` : '')

      const dashClient = getDashPlatformClient()

      const cacheKey = 'feed_for_you'

      // Check cache first unless force refresh or paginating
      if (!forceRefresh && !startAfter) {
        const cached = cacheManager.get<any[]>('feed', cacheKey)
        if (cached) {
          console.log('Feed: Using cached data')
          setData(cached)
          setLoading(false)
          // Set lastPostId from cached data
          if (cached.length > 0) {
            setLastPostId(cached[cached.length - 1].id)
            setHasMore(cached.length >= 20)
          }
          return
        }
      }

      // Query posts from the platform
      const queryOptions: any = {
        limit: 20,
        forceRefresh: false,
        startAfter: startAfter
      }

      console.log('Feed: Loading all posts', startAfter ? `starting after ${startAfter}` : '')
      
      const posts = await dashClient.queryPosts(queryOptions)

      // Transform posts to match our UI format (sync - no async work needed here)
      const transformedPosts = posts.map((doc: any) => {
        const data = doc.data || doc
        const authorIdStr = doc.ownerId || 'unknown'

        return {
          id: doc.id || Math.random().toString(36).substr(2, 9),
          content: data.content || 'No content',
          author: {
            id: authorIdStr,
            username: `user_${authorIdStr.slice(-6)}`,
            handle: `user_${authorIdStr.slice(-6)}`,
            displayName: `User ${authorIdStr.slice(-6)}`,
            verified: false
          },
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          likes: 0,
          replies: 0,
          reposts: 0,
          liked: false,
          reposted: false,
          bookmarked: false
        }
      })

      // Sort posts by createdAt to ensure newest first
      const sortedPosts = transformedPosts.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })

      // If no posts found, show empty state
      if (sortedPosts.length === 0) {
        console.log('Feed: No posts found on platform')
        if (!startAfter) {
          setData([])
        }
        setHasMore(false)
        return
      }

      // Update pagination state
      setLastPostId(sortedPosts[sortedPosts.length - 1].id)
      setHasMore(sortedPosts.length >= 20)

      // IMMEDIATELY show posts with placeholder usernames
      if (startAfter) {
        // Use functional update to get current posts (avoids stale closure)
        setData((currentPosts: any[] | null) => {
          const allPosts = [...(currentPosts || []), ...sortedPosts]
          console.log(`Feed: Appended ${sortedPosts.length} posts to ${currentPosts?.length || 0} existing`)
          return allPosts
        })
      } else {
        setData(sortedPosts)
        console.log(`Feed: Showing ${sortedPosts.length} posts (resolving usernames in background)`)
      }

      // Resolve DPNS usernames and profiles in background (non-blocking)
      const uniqueAuthorIds = Array.from(new Set(sortedPosts.map((p: any) => p.author.id)))
      console.log(`Feed: Resolving ${uniqueAuthorIds.length} unique usernames and profiles in background`)

      // Batch resolve all usernames in a single query (much more efficient)
      dpnsService.resolveUsernamesBatch(uniqueAuthorIds as string[]).then(usernameMap => {
        console.log(`Feed: Batch DPNS resolution complete, found ${Array.from(usernameMap.values()).filter(Boolean).length} usernames`)
        setData((currentPosts: any[] | null) => {
          if (!currentPosts) return currentPosts
          return currentPosts.map(post => {
            const username = usernameMap.get(post.author.id)
            if (username) {
              return {
                ...post,
                author: {
                  ...post.author,
                  username,
                  handle: username,
                  hasDpns: true
                }
              }
            }
            return post
          })
        })
      }).catch(err => {
        console.warn('Feed: Failed to batch resolve usernames:', err)
      })

      // Fetch profiles to get actual display names (separate from DPNS)
      profileService.getProfilesByIdentityIds(uniqueAuthorIds as string[]).then(profiles => {
        console.log(`Feed: Fetched ${profiles.length} profiles for display names`)
        profiles.forEach((profile: any) => {
          const ownerId = profile.$ownerId || profile.ownerId
          const data = profile.data || profile
          const displayName = data.displayName

          if (displayName) {
            setData((currentPosts: any[] | null) => {
              if (!currentPosts) return currentPosts
              return currentPosts.map(post => {
                if (post.author.id === ownerId) {
                  return {
                    ...post,
                    author: {
                      ...post.author,
                      displayName
                    }
                  }
                }
                return post
              })
            })
          }
        })
      }).catch(err => {
        console.warn('Feed: Failed to fetch profiles:', err)
      })

      // Note: Stats/interactions enrichment moved to separate effect to prevent duplicate requests

      // Cache results after usernames have had time to resolve
      setTimeout(() => {
        setData((currentPosts: any[] | null) => {
          if (currentPosts && currentPosts.length > 0 && !startAfter) {
            cacheManager.set('feed', cacheKey, currentPosts)
          }
          return currentPosts
        })
      }, 5000)
      
    } catch (error) {
      console.error('Feed: Failed to load posts from platform:', error)
      
      // Show specific error message but fall back gracefully
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.log('Feed: Falling back to empty state due to error:', errorMessage)
      
      // Set empty data instead of showing error to user
      setData([])
      
      // Only show error to user if it's a critical issue
      if (errorMessage.includes('Contract ID not configured') || 
          errorMessage.includes('Not logged in')) {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [postsState.setLoading, postsState.setError, postsState.setData])

  // Load more posts (pagination)
  const loadMore = useCallback(async () => {
    if (!lastPostId || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      await loadPosts(false, lastPostId)
    } finally {
      setIsLoadingMore(false)
    }
  }, [lastPostId, isLoadingMore, hasMore, loadPosts])

  // Load posts on mount and listen for new posts
  useEffect(() => {
    loadPosts()

    // Listen for new posts created
    const handlePostCreated = () => {
      // Clear enrichment tracking on refresh so new data gets fetched
      lastEnrichedBatchId.current = null
      enrichmentInProgress.current = false
      loadPosts(true) // Force refresh when new post is created
    }

    window.addEventListener('post-created', handlePostCreated)

    return () => {
      window.removeEventListener('post-created', handlePostCreated)
    }
  }, [loadPosts])

  // Separate effect for enriching posts with stats/interactions
  // Uses batch ID to ensure we only enrich once per unique set of posts
  useEffect(() => {
    const posts = postsState.data
    if (!posts || posts.length === 0) return

    // Create a batch ID from the post IDs to detect if this is a new load
    const batchId = posts.map(p => p.id).sort().join(',')

    // Skip if we've already enriched this batch or enrichment is in progress
    if (lastEnrichedBatchId.current === batchId || enrichmentInProgress.current) {
      return
    }

    // Mark enrichment as in progress
    enrichmentInProgress.current = true
    lastEnrichedBatchId.current = batchId

    // Enrich all posts using batch queries (much more efficient)
    const enrichAll = async () => {
      const postIds = posts.map(p => p.id)

      try {
        // Batch queries: 3 for interactions (total) + 3 per post for stats
        // Much better than 6 queries per post
        const [statsMap, interactionsMap] = await Promise.all([
          postService.getBatchPostStats(postIds),
          postService.getBatchUserInteractions(postIds)
        ])

        const enrichedData = posts.map(post => {
          const stats = statsMap.get(post.id)
          const interactions = interactionsMap.get(post.id)
          return {
            id: post.id,
            likes: stats?.likes ?? 0,
            reposts: stats?.reposts ?? 0,
            replies: stats?.replies ?? 0,
            liked: interactions?.liked ?? false,
            reposted: interactions?.reposted ?? false,
            bookmarked: interactions?.bookmarked ?? false
          }
        })

        // Create a map for quick lookup
        const enrichmentMap = new Map(
          enrichedData.map(e => [e.id, e])
        )

        // Update all posts in a single setData call
        postsState.setData((currentPosts: any[] | null) => {
          if (!currentPosts) return currentPosts
          const updated = currentPosts.map(p => {
            const enrichment = enrichmentMap.get(p.id)
            if (enrichment) {
              return {
                ...p,
                likes: enrichment.likes,
                reposts: enrichment.reposts,
                replies: enrichment.replies,
                liked: enrichment.liked,
                reposted: enrichment.reposted,
                bookmarked: enrichment.bookmarked
              }
            }
            return p
          })
          return updated
        })
      } catch (err) {
        console.error('Feed: Failed to enrich posts:', err)
      } finally {
        enrichmentInProgress.current = false
      }
    }

    enrichAll()
  }, [postsState.data, postsState.setData])

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 min-w-0 max-w-[700px] border-x border-gray-200 dark:border-gray-800">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">Home</h1>
            <button
              onClick={() => {
                // Clear enrichment tracking on manual refresh
                lastEnrichedBatchId.current = null
                enrichmentInProgress.current = false
                loadPosts(true)
              }}
              disabled={postsState.loading}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <ArrowPathIcon className={`h-5 w-5 text-gray-500 ${postsState.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          {user ? (
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                {isHydrated ? (
                  avatarFeatures ? (
                    <AvatarCanvas features={avatarFeatures} size={48} />
                  ) : (
                    <Avatar>
                      <AvatarFallback>{user.identityId.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )
                ) : (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-700 animate-pulse rounded-full" />
                )}
              </div>
              <button
                onClick={() => setComposeOpen(true)}
                className="flex-1 text-left px-4 py-3 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                What&apos;s happening?
              </button>
              <button className="p-3 rounded-full hover:bg-yappr-50 dark:hover:bg-yappr-950 text-yappr-500">
                <SparklesIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2">
              <Link
                href="/login"
                className="text-yappr-500 hover:text-yappr-600 font-medium"
              >
                Login to share your thoughts
              </Link>
            </div>
          )}
        </div>

        <ErrorBoundary level="component">
          <LoadingState
            loading={postsState.loading || postsState.data === null}
            error={postsState.error}
            isEmpty={!postsState.loading && postsState.data !== null && postsState.data.length === 0}
            onRetry={loadPosts}
            loadingText="Connecting to Dash Platform..."
            emptyText="No posts yet"
            emptyDescription="Be the first to share something!"
          >
            <div>
              {postsState.data?.map((post) => (
                <ErrorBoundary key={post.id} level="component">
                  <PostCard
                    post={post}
                    isOwnPost={user?.identityId === post.author.id}
                  />
                </ErrorBoundary>
              ))}
              {hasMore && postsState.data && postsState.data.length > 0 && (
                <div className="p-4 flex justify-center border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2 rounded-full bg-yappr-500 text-white hover:bg-yappr-600 disabled:opacity-50 transition-colors"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          </LoadingState>
        </ErrorBoundary>
      </main>

      <RightSidebar />
      <ComposeModal />
    </div>
  )
}

export default withAuth(FeedPage, { optional: true })