'use client'

import { useState, useEffect } from 'react'
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

// Extract meta tag content from HTML
function extractMetaContent(html: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      // Decode HTML entities
      return match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .trim()
    }
  }
  return undefined
}

// Make relative URLs absolute
function makeAbsoluteUrl(url: string | undefined, baseUrl: string): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http')) return url
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) {
    try {
      const base = new URL(baseUrl)
      return `${base.origin}${url}`
    } catch {
      return url
    }
  }
  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

// Extract favicon URL
function extractFavicon(html: string, baseUrl: string): string | undefined {
  const iconPatterns = [
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
  ]

  for (const pattern of iconPatterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return makeAbsoluteUrl(match[1], baseUrl)
    }
  }

  // Default to /favicon.ico
  try {
    const url = new URL(baseUrl)
    return `${url.origin}/favicon.ico`
  } catch {
    return undefined
  }
}

function parseHtmlForPreview(html: string, url: string): LinkPreviewData {
  const title = extractMetaContent(html, [
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
    /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ])

  const description = extractMetaContent(html, [
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
    /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:description["']/i,
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
  ])

  const imageRaw = extractMetaContent(html, [
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
  ])

  const siteName = extractMetaContent(html, [
    /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i,
  ])

  const image = makeAbsoluteUrl(imageRaw, url)
  const favicon = extractFavicon(html, url)

  return {
    url,
    title,
    description,
    image,
    siteName,
    favicon,
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

  // Create new request using CORS proxy
  const request = (async () => {
    try {
      // Use allorigins.win as CORS proxy
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error('Failed to fetch')
      }

      const html = await response.text()
      const data = parseHtmlForPreview(html, url)
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
 * Uses a CORS proxy to fetch page metadata client-side
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
