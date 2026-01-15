// POC: Reddit-style profile page. Safe to delete.
'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { postService } from '@/lib/services/post-service'
import { dpnsService } from '@/lib/services/dpns-service'
import { useSdk } from '@/contexts/sdk-context'
import { Post } from '@/lib/types'

type Tab = 'posts' | 'comments'

function getTitle(content: string): string {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
  const first = (lines[0] ?? '').replace(/\s+/g, ' ')
  if (!first) return '(untitled)'
  return first.length <= 80 ? first : first.slice(0, 77) + '...'
}

function getSnippet(content: string, maxLen = 120): string {
  const text = content.replace(/\s+/g, ' ').trim()
  if (!text) return '(empty)'
  return text.length <= maxLen ? text : text.slice(0, maxLen - 3) + '...'
}

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('id')
  const { isReady } = useSdk()

  const [tab, setTab] = useState<Tab>('posts')
  const [username, setUsername] = useState<string | null>(null)
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !isReady) return

    async function fetchData() {
      if (!userId) return
      setLoading(true)
      try {
        // Resolve username via DPNS
        const resolvedUsername = await dpnsService.resolveUsername(userId)
        setUsername(resolvedUsername)

        // Fetch user's posts (includes both root posts and replies)
        const result = await postService.getUserPosts(userId, { limit: 100 })
        const enriched = await postService.enrichPostsBatch(result.documents)
        setAllPosts(enriched)
      } catch (err) {
        console.error('Failed to fetch profile data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, isReady])

  const rootPosts = allPosts.filter(p => !p.replyToId)
  const replies = allPosts.filter(p => p.replyToId)

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <button
          onClick={() => router.push('/poc/posts')}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          &larr; Back to Posts
        </button>
        <div className="text-gray-500">No user ID provided</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={() => router.push('/poc/posts')}
        className="text-sm text-blue-600 hover:underline mb-4"
      >
        &larr; Back to Posts
      </button>

      {/* Profile header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          {username || 'Anonymous'}
        </h1>
        <div className="text-xs text-gray-500 font-mono mt-1">
          {userId.slice(0, 16)}...
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'posts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Posts ({rootPosts.length})
        </button>
        <button
          onClick={() => setTab('comments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'comments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Comments ({replies.length})
        </button>
      </div>

      {/* Content */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-black">
        {tab === 'posts' ? (
          rootPosts.length === 0 ? (
            <div className="px-4 py-8 text-sm text-gray-500">No posts yet.</div>
          ) : (
            rootPosts.map((post) => (
              <div
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/poc/posts/detail?id=${post.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    router.push(`/poc/posts/detail?id=${post.id}`)
                  }
                }}
                className="flex gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
              >
                {/* Score gutter */}
                <div className="w-8 shrink-0 text-center text-sm text-gray-500 font-medium">
                  {post.likes}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Title */}
                  <div className="text-gray-900 dark:text-gray-100 font-medium">
                    {getTitle(post.content)}
                  </div>

                  {/* Metadata line */}
                  <div className="mt-1 text-xs text-gray-500">
                    <span title="Replies">💬 {post.replies}</span>
                    <span className="mx-2">•</span>
                    <span title="Reposts">🔁 {post.reposts}</span>
                    <span className="mx-2">•</span>
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          replies.length === 0 ? (
            <div className="px-4 py-8 text-sm text-gray-500">No comments yet.</div>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/poc/posts/detail?id=${reply.replyToId}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    router.push(`/poc/posts/detail?id=${reply.replyToId}`)
                  }
                }}
                className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
              >
                {/* Comment snippet */}
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {getSnippet(reply.content)}
                </div>

                {/* Metadata */}
                <div className="mt-1 text-xs text-gray-500">
                  <span className="text-blue-600 hover:underline">View parent post</span>
                  <span className="mx-2">•</span>
                  <span>{formatRelativeTime(reply.createdAt)}</span>
                  {reply.likes > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <span>👍 {reply.likes}</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}

export default function PocUserPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
