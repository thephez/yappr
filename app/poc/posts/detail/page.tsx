// POC: Post detail with threaded replies. Safe to delete.
'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePostDetail } from '@/hooks/use-post-detail'
import { ReplyThread } from '@/lib/types'

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

function ReplyThreadItem({ thread, depth = 0, onAuthorClick }: { thread: ReplyThread; depth?: number; onAuthorClick: (authorId: string) => void }) {
  const { post, isAuthorThread, nestedReplies } = thread

  return (
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-800 pl-4' : ''}>
      <div className={`py-3 ${isAuthorThread ? 'bg-blue-50 dark:bg-blue-950/20 -mx-4 px-4 rounded' : ''}`}>
        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
          {post.content}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <span
            role="button"
            tabIndex={0}
            onClick={() => onAuthorClick(post.author.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onAuthorClick(post.author.id)
              }
            }}
            className={`hover:underline cursor-pointer ${isAuthorThread ? 'text-blue-600 dark:text-blue-400' : ''}`}
          >
            {post.author.username}
          </span>
          <span className="mx-2">•</span>
          <span>{formatRelativeTime(post.createdAt)}</span>
          {post.likes > 0 && (
            <>
              <span className="mx-2">•</span>
              <span>👍 {post.likes}</span>
            </>
          )}
        </div>
      </div>
      {nestedReplies.length > 0 && (
        <div className="mt-2">
          {nestedReplies.map((nested) => (
            <ReplyThreadItem key={nested.post.id} thread={nested} depth={depth + 1} onAuthorClick={onAuthorClick} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = searchParams.get('id')

  const { post, replyThreads, isLoading, error } = usePostDetail({
    postId,
    enabled: !!postId
  })

  if (!postId) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <button
          onClick={() => router.push('/poc/posts')}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          ← Back to Posts
        </button>
        <div className="text-gray-500">No post ID provided</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <button
          onClick={() => router.push('/poc/posts')}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          ← Back to Posts
        </button>
        <div className="text-red-500">{error || 'Post not found'}</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={() => router.push('/poc/posts')}
        className="text-sm text-blue-600 hover:underline mb-4"
      >
        ← Back to Posts
      </button>

      {/* Main post */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black p-4 mb-6 overflow-hidden">
        <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
          {post.content}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
          <span>by </span>
          <span
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/poc/user?id=${post.author.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push(`/poc/user?id=${post.author.id}`)
              }
            }}
            className="hover:underline cursor-pointer"
          >
            {post.author.username}
          </span>
          <span className="mx-2">•</span>
          <span>{formatRelativeTime(post.createdAt)}</span>
          <span className="mx-2">•</span>
          <span title="Likes">👍 {post.likes}</span>
          <span className="mx-2">•</span>
          <span title="Replies">💬 {post.replies}</span>
          <span className="mx-2">•</span>
          <span title="Reposts">🔁 {post.reposts}</span>
        </div>
      </div>

      {/* Replies section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Replies ({replyThreads.length})
        </h2>
        {replyThreads.length === 0 ? (
          <div className="text-sm text-gray-500">No replies yet.</div>
        ) : (
          <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-900">
            {replyThreads.map((thread) => (
              <ReplyThreadItem
                key={thread.post.id}
                thread={thread}
                onAuthorClick={(authorId) => router.push(`/poc/user?id=${authorId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PocPostDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <PostDetailContent />
    </Suspense>
  )
}
