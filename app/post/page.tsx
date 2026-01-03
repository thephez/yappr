'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Sidebar } from '@/components/layout/sidebar'
import { RightSidebar } from '@/components/layout/right-sidebar'
import { PostCard } from '@/components/post/post-card'
import { withAuth, useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Post } from '@/lib/types'
import { getDashPlatformClient } from '@/lib/dash-platform-client'
import { postService } from '@/lib/services/post-service'
import { dpnsService } from '@/lib/services/dpns-service'
import { profileService } from '@/lib/services/profile-service'
import toast from 'react-hot-toast'

interface Reply extends Post {
  replyToId: string
}

function PostDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = searchParams.get('id')
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  // Track enrichment to prevent duplicate requests
  const lastEnrichedBatchId = useRef<string | null>(null)
  const enrichmentInProgress = useRef(false)
  // Track loading to prevent React Strict Mode double-invocation
  const loadingInProgress = useRef(false)
  const lastLoadedPostId = useRef<string | null>(null)

  useEffect(() => {
    if (!postId || !user) return

    // Prevent duplicate loads from React Strict Mode
    if (loadingInProgress.current && lastLoadedPostId.current === postId) {
      return
    }

    const loadPost = async () => {
      loadingInProgress.current = true
      lastLoadedPostId.current = postId

      try {
        setIsLoading(true)

        // Skip background enrichment - we'll handle it via batch queries
        postService.setSkipEnrichment(true)

        const loadedPost = await postService.getPostById(postId)

        if (!loadedPost) {
          setPost(null)
          setReplies([])
          return
        }

        // If this is a reply, fetch the parent post for the "Replying to:" section
        // We fetch this explicitly rather than relying on background enrichment
        // to ensure the parent is available before we render
        if (loadedPost.replyToId) {
          const parentPost = await postService.getPostById(loadedPost.replyToId)
          if (parentPost) {
            loadedPost.replyTo = parentPost
          }
        }

        setPost(loadedPost)

        try {
          const repliesResult = await postService.getReplies(postId)
          const repliesWithReplyTo: Reply[] = repliesResult.documents.map(reply => ({
            ...reply,
            replyToId: postId
          }))
          setReplies(repliesWithReplyTo)
        } catch (repliesError) {
          console.error('Failed to load replies:', repliesError)
          setReplies([])
        }

      } catch (error) {
        console.error('Failed to load post:', error)
        toast.error('Failed to load post')
        setPost(null)
        setReplies([])
      } finally {
        // Re-enable enrichment for other callers
        postService.setSkipEnrichment(false)
        setIsLoading(false)
        loadingInProgress.current = false
      }
    }

    loadPost()
  }, [postId, user])

  // Separate effect for batch enrichment of all posts
  useEffect(() => {
    if (!post || isLoading) return

    // Collect all posts: main post, parent (if exists), and replies
    const allPosts: Post[] = [post]
    if (post.replyTo) allPosts.push(post.replyTo)
    replies.forEach(r => allPosts.push(r))

    if (allPosts.length === 0) return

    // Create batch ID to detect if this is a new set of posts
    const batchId = allPosts.map(p => p.id).sort().join(',')

    // Skip if already enriched or enrichment in progress
    if (lastEnrichedBatchId.current === batchId || enrichmentInProgress.current) {
      return
    }

    enrichmentInProgress.current = true
    lastEnrichedBatchId.current = batchId

    const enrichAll = async () => {
      const postIds = allPosts.map(p => p.id)
      const uniqueAuthorIds = Array.from(new Set(allPosts.map(p => p.author.id)))

      try {
        // Batch queries for stats and interactions
        const [statsMap, interactionsMap] = await Promise.all([
          postService.getBatchPostStats(postIds),
          postService.getBatchUserInteractions(postIds)
        ])

        // Update main post with enriched data
        setPost(currentPost => {
          if (!currentPost) return currentPost

          const stats = statsMap.get(currentPost.id)
          const interactions = interactionsMap.get(currentPost.id)

          let updatedPost = { ...currentPost }
          if (stats) {
            updatedPost.likes = stats.likes
            updatedPost.reposts = stats.reposts
            updatedPost.replies = stats.replies
          }
          if (interactions) {
            updatedPost.liked = interactions.liked
            updatedPost.reposted = interactions.reposted
            updatedPost.bookmarked = interactions.bookmarked
          }

          // Also update parent post if it exists
          if (currentPost.replyTo) {
            const parentStats = statsMap.get(currentPost.replyTo.id)
            const parentInteractions = interactionsMap.get(currentPost.replyTo.id)
            updatedPost.replyTo = { ...currentPost.replyTo }
            if (parentStats) {
              updatedPost.replyTo.likes = parentStats.likes
              updatedPost.replyTo.reposts = parentStats.reposts
              updatedPost.replyTo.replies = parentStats.replies
            }
            if (parentInteractions) {
              updatedPost.replyTo.liked = parentInteractions.liked
              updatedPost.replyTo.reposted = parentInteractions.reposted
              updatedPost.replyTo.bookmarked = parentInteractions.bookmarked
            }
          }

          return updatedPost
        })

        // Update replies with enriched data
        setReplies(currentReplies => {
          return currentReplies.map(reply => {
            const stats = statsMap.get(reply.id)
            const interactions = interactionsMap.get(reply.id)
            return {
              ...reply,
              likes: stats?.likes ?? reply.likes,
              reposts: stats?.reposts ?? reply.reposts,
              replies: stats?.replies ?? reply.replies,
              liked: interactions?.liked ?? reply.liked,
              reposted: interactions?.reposted ?? reply.reposted,
              bookmarked: interactions?.bookmarked ?? reply.bookmarked
            }
          })
        })

        // Batch resolve DPNS usernames
        dpnsService.resolveUsernamesBatch(uniqueAuthorIds).then(usernameMap => {
          // Update main post author
          setPost(currentPost => {
            if (!currentPost) return currentPost
            const username = usernameMap.get(currentPost.author.id)
            let updatedPost = { ...currentPost }
            if (username) {
              updatedPost.author = {
                ...currentPost.author,
                username,
                handle: username,
                hasDpns: true
              } as any
            }
            // Update parent author if exists
            if (currentPost.replyTo) {
              const parentUsername = usernameMap.get(currentPost.replyTo.author.id)
              if (parentUsername) {
                updatedPost.replyTo = {
                  ...currentPost.replyTo,
                  author: {
                    ...currentPost.replyTo.author,
                    username: parentUsername,
                    handle: parentUsername,
                    hasDpns: true
                  } as any
                }
              }
            }
            return updatedPost
          })

          // Update replies authors
          setReplies(currentReplies => {
            return currentReplies.map(reply => {
              const username = usernameMap.get(reply.author.id)
              if (username) {
                return {
                  ...reply,
                  author: {
                    ...reply.author,
                    username,
                    handle: username,
                    hasDpns: true
                  } as any
                }
              }
              return reply
            })
          })
        }).catch(err => {
          console.warn('Post: Failed to batch resolve usernames:', err)
        })

        // Batch fetch profiles for display names
        profileService.getProfilesByIdentityIds(uniqueAuthorIds).then(profiles => {
          const profileMap = new Map<string, any>()
          profiles.forEach((profile: any) => {
            const ownerId = profile.$ownerId || profile.ownerId
            profileMap.set(ownerId, profile)
          })

          // Update main post author display name
          setPost(currentPost => {
            if (!currentPost) return currentPost
            const profile = profileMap.get(currentPost.author.id)
            let updatedPost = { ...currentPost }
            if (profile) {
              const data = profile.data || profile
              if (data.displayName) {
                updatedPost.author = {
                  ...currentPost.author,
                  displayName: data.displayName
                }
              }
            }
            // Update parent author if exists
            if (currentPost.replyTo) {
              const parentProfile = profileMap.get(currentPost.replyTo.author.id)
              if (parentProfile) {
                const parentData = parentProfile.data || parentProfile
                if (parentData.displayName) {
                  updatedPost.replyTo = {
                    ...currentPost.replyTo,
                    author: {
                      ...currentPost.replyTo.author,
                      displayName: parentData.displayName
                    }
                  }
                }
              }
            }
            return updatedPost
          })

          // Update replies authors
          setReplies(currentReplies => {
            return currentReplies.map(reply => {
              const profile = profileMap.get(reply.author.id)
              if (profile) {
                const data = profile.data || profile
                if (data.displayName) {
                  return {
                    ...reply,
                    author: {
                      ...reply.author,
                      displayName: data.displayName
                    }
                  }
                }
              }
              return reply
            })
          })
        }).catch(err => {
          console.warn('Post: Failed to fetch profiles:', err)
        })

      } catch (err) {
        console.error('Post: Failed to enrich posts:', err)
      } finally {
        enrichmentInProgress.current = false
      }
    }

    enrichAll()
  }, [post, replies, isLoading])

  const handleReply = async () => {
    if (!replyContent.trim() || !post || !user) return

    setIsReplying(true)
    try {
      const dashClient = getDashPlatformClient()
      await dashClient.createPost(replyContent, { replyToPostId: post.id })

      const newReply: Reply = {
        id: `reply_${Date.now()}`,
        content: replyContent,
        author: {
          id: user.identityId,
          username: user.identityId.slice(0, 8) + '...',
          displayName: user.identityId.slice(0, 8) + '...',
          avatar: '',
          followers: 0,
          following: 0,
          joinedAt: new Date()
        },
        createdAt: new Date(),
        likes: 0,
        replies: 0,
        reposts: 0,
        views: 0,
        replyToId: post.id
      }

      setReplies(prev => [newReply, ...prev])
      setReplyContent('')
      toast.success('Reply posted!')

      setPost(prev => prev ? { ...prev, replies: prev.replies + 1 } : null)
    } catch (error) {
      console.error('Failed to post reply:', error)
      toast.error('Failed to post reply')
    } finally {
      setIsReplying(false)
    }
  }

  if (!postId) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 min-w-0 max-w-[700px] border-x border-gray-200 dark:border-gray-800">
          <div className="p-8 text-center text-gray-500">
            <p>Post not found</p>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1 min-w-0 max-w-[700px] border-x border-gray-200 dark:border-gray-800">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
        </header>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading post...</p>
          </div>
        ) : post ? (
          <>
            {post.replyTo && (
              <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <div className="px-4 pt-3 pb-1">
                  <span className="text-sm text-gray-500">Replying to:</span>
                </div>
                <PostCard post={post.replyTo} />
              </div>
            )}

            <div className="border-b border-gray-200 dark:border-gray-800">
              <PostCard post={post} />
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleReply()
                }}
                className="space-y-3"
              >
                <Input
                  type="text"
                  placeholder="Post your reply"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full"
                  maxLength={280}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {replyContent.length}/280
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!replyContent.trim() || isReplying}
                  >
                    {isReplying ? 'Posting...' : 'Reply'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {replies.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No replies yet. Be the first to reply!</p>
                </div>
              ) : (
                replies.map((reply) => (
                  <PostCard key={reply.id} post={reply} />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Post not found</p>
          </div>
        )}
      </main>

      <RightSidebar />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 max-w-[700px] border-x border-gray-200 dark:border-gray-800">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading post...</p>
        </div>
      </main>
      <RightSidebar />
    </div>
  )
}

function PostDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PostDetailContent />
    </Suspense>
  )
}

export default withAuth(PostDetailPage)
