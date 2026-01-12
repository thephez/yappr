// POC: Reddit-style feed with lightweight metadata. Safe to delete.
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { postService } from '@/lib/services/post-service'
import { Post } from '@/lib/types'

function getTitle(content: string): string {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
  const first = (lines[0] ?? '').replace(/\s+/g, ' ')
  if (!first) return '(untitled)'
  return first.length <= 80 ? first : first.slice(0, 77) + '...'
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

export default function PocPostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const result = await postService.getTimeline({ limit: 100 })
        const topLevel = result.documents.filter(p => !p.replyToId)
        const enriched = await postService.enrichPostsBatch(topLevel)
        setPosts(enriched)
      } catch (err) {
        console.error('Failed to fetch posts:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold mb-6">Posts</h1>
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-black">
        {posts.length === 0 ? (
          <div className="px-4 py-8 text-sm text-gray-500">No posts yet.</div>
        ) : (
          posts.map((post) => (
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
                  <span>by </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/poc/user?id=${post.author.id}`)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        e.preventDefault()
                        router.push(`/poc/user?id=${post.author.id}`)
                      }
                    }}
                    className="hover:underline cursor-pointer"
                  >
                    {post.author.username}
                  </span>
                  <span className="mx-2">•</span>
                  <span title="Replies">💬 {post.replies}</span>
                  <span className="mx-2">•</span>
                  <span title="Reposts">🔁 {post.reposts}</span>
                  <span className="mx-2">•</span>
                  <span>{formatRelativeTime(post.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
