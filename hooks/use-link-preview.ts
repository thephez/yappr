'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LinkPreviewData } from '@/components/post/link-preview'

// Client-side cache for link previews
const previewCache = new Map<string, LinkPreviewData>()
const pendingRequests = new Map<string, Promise<LinkPreviewData>>()

// URLs that commonly don't have good previews or should be skipped
const SKIP_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
]

function shouldSkipUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return SKIP_DOMAINS.some(domain => parsed.hostname.includes(domain))
  } catch {
    return true
  }
}

async function fetchPreview(url: string): Promise<LinkPreviewData> {
  // Check cache first
  const cached = previewCache.get(url)
  if (cached) {
    return cached
  }

  // Check for pending request (deduplication)
  const pending = pendingRequests.get(url)
  if (pending) {
    return pending
  }

  // Create new request
  const request = (async () => {
    try {
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch preview')
      }
      const data: LinkPreviewData = await response.json()
      previewCache.set(url, data)
      return data
    } catch {
      // Return minimal data on error
      const fallback: LinkPreviewData = { url }
      previewCache.set(url, fallback)
      return fallback
    } finally {
      pendingRequests.delete(url)
    }
  })()

  pendingRequests.set(url, request)
  return request
}

interface UseLinkPreviewOptions {
  /** Disable fetching */
  disabled?: boolean
}

interface UseLinkPreviewResult {
  data: LinkPreviewData | null
  loading: boolean
  error: boolean
}

/**
 * Hook to fetch link preview data for a URL
 */
export function useLinkPreview(
  url: string | null,
  options: UseLinkPreviewOptions = {}
): UseLinkPreviewResult {
  const { disabled = false } = options
  const [data, setData] = useState<LinkPreviewData | null>(() => {
    if (!url || disabled) return null
    return previewCache.get(url) || null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!url || disabled || shouldSkipUrl(url)) {
      setData(null)
      setLoading(false)
      setError(false)
      return
    }

    // Check cache first
    const cached = previewCache.get(url)
    if (cached) {
      setData(cached)
      setLoading(false)
      setError(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    fetchPreview(url)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [url, disabled])

  return { data, loading, error }
}

/**
 * Extract the first URL from content text
 */
export function extractFirstUrl(content: string): string | null {
  const urlPattern = /(https?:\/\/[^\s<>\"\']+|www\.[^\s<>\"\']+)/gi
  const match = content.match(urlPattern)
  if (!match?.[0]) return null

  let url = match[0]
  // Add protocol if missing
  if (url.startsWith('www.')) {
    url = `https://${url}`
  }
  // Clean trailing punctuation
  url = url.replace(/[.,;:!?)]+$/, '')

  return url
}

/**
 * Extract all URLs from content text
 */
export function extractAllUrls(content: string): string[] {
  const urlPattern = /(https?:\/\/[^\s<>\"\']+|www\.[^\s<>\"\']+)/gi
  const matches = content.match(urlPattern)
  if (!matches) return []

  return matches.map(url => {
    // Add protocol if missing
    if (url.startsWith('www.')) {
      url = `https://${url}`
    }
    // Clean trailing punctuation
    return url.replace(/[.,;:!?)]+$/, '')
  })
}

/**
 * Prefetch link previews for multiple URLs (useful for feed)
 */
export function prefetchLinkPreviews(urls: string[]): void {
  urls.forEach(url => {
    if (!shouldSkipUrl(url) && !previewCache.has(url)) {
      fetchPreview(url).catch(() => {
        // Ignore errors during prefetch
      })
    }
  })
}

/**
 * Clear the preview cache (useful for testing)
 */
export function clearPreviewCache(): void {
  previewCache.clear()
}
