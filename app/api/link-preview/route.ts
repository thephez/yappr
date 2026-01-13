import { NextRequest, NextResponse } from 'next/server'

export interface LinkPreviewData {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  favicon?: string
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: LinkPreviewData; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

function getCachedData(url: string): LinkPreviewData | null {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  if (cached) {
    cache.delete(url)
  }
  return null
}

function setCachedData(url: string, data: LinkPreviewData): void {
  // Limit cache size
  if (cache.size > 1000) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(url, { data, timestamp: Date.now() })
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

// Extract favicon URL
function extractFavicon(html: string, baseUrl: string): string | undefined {
  // Try various favicon patterns
  const iconPatterns = [
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
  ]

  for (const pattern of iconPatterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      const iconUrl = match[1]
      // Make absolute URL
      if (iconUrl.startsWith('http')) return iconUrl
      if (iconUrl.startsWith('//')) return `https:${iconUrl}`
      if (iconUrl.startsWith('/')) {
        const url = new URL(baseUrl)
        return `${url.origin}${iconUrl}`
      }
      return new URL(iconUrl, baseUrl).href
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

async function fetchLinkPreview(url: string): Promise<LinkPreviewData> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YapprBot/1.0; +https://yappr.app)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return { url }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      // Not HTML, just return the URL
      return { url }
    }

    // Only read first 50KB to avoid large payloads
    const reader = response.body?.getReader()
    if (!reader) return { url }

    let html = ''
    const decoder = new TextDecoder()
    let bytesRead = 0
    const maxBytes = 50 * 1024

    while (bytesRead < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
      bytesRead += value?.length || 0
      // Stop once we have </head> - we don't need the body
      if (html.includes('</head>')) break
    }

    void reader.cancel()

    // Extract Open Graph / Twitter Card / standard meta tags
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
  } catch (error) {
    clearTimeout(timeout)
    // Return basic data on error
    return { url }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  // Validate URL
  try {
    const parsedUrl = new URL(url)
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Check cache first
  const cached = getCachedData(url)
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // Fetch preview data
  const data = await fetchLinkPreview(url)

  // Cache the result
  setCachedData(url, data)

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
