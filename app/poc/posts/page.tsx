// POC: Minimal Reddit-style feed (titles only). Safe to delete.
'use client'

import { useState, useEffect } from 'react'
import { postService } from '@/lib/services/post-service'
import { Post } from '@/lib/types'

function getTitle(content: string): string {
  const firstLine = content.split('\n')[0]
  if (firstLine.length <= 80) return firstLine
  return firstLine.slice(0, 77) + '...'
}

export default function PocPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postService.getTimeline({ limit: 20 })
      .then(result => {
        const topLevel = result.documents.filter(p => !p.replyToId)
        setPosts(topLevel)
      })
      .catch(err => console.error('Failed to fetch posts:', err))
      .finally(() => setLoading(false))
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
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {posts.map((post) => (
          <div
            key={post.id}
            className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
          >
            <span className="text-gray-900 dark:text-gray-100">{getTitle(post.content)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
