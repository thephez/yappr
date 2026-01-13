'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LinkIcon } from '@heroicons/react/24/outline'

export interface LinkPreviewData {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  favicon?: string
}

interface LinkPreviewProps {
  data: LinkPreviewData
  className?: string
}

export function LinkPreview({ data, className = '' }: LinkPreviewProps) {
  const [imageError, setImageError] = useState(false)

  // Don't render if no meaningful data
  if (!data.title && !data.description && !data.image) {
    return null
  }

  const hostname = (() => {
    try {
      return new URL(data.url).hostname.replace(/^www\./, '')
    } catch {
      return data.url
    }
  })()

  const imageUrl = data.image && !imageError ? data.image : null

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`block mt-3 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${className}`}
    >
      {imageUrl && (
        <div className="relative w-full aspect-[1.91/1] bg-neutral-100 dark:bg-neutral-800">
          <Image
            src={imageUrl}
            alt={data.title || 'Link preview'}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized // External images
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
          {data.favicon && !imageError ? (
            <Image
              src={data.favicon}
              alt=""
              width={14}
              height={14}
              className="rounded-sm"
              onError={(e) => {
                // Hide broken favicon
                (e.target as HTMLImageElement).style.display = 'none'
              }}
              unoptimized
            />
          ) : (
            <LinkIcon className="h-3.5 w-3.5" />
          )}
          <span className="truncate">{data.siteName || hostname}</span>
        </div>
        {data.title && (
          <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-0.5">
            {data.title}
          </h4>
        )}
        {data.description && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {data.description}
          </p>
        )}
      </div>
    </a>
  )
}

interface LinkPreviewSkeletonProps {
  className?: string
}

export function LinkPreviewSkeleton({ className = '' }: LinkPreviewSkeletonProps) {
  return (
    <div
      className={`mt-3 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden ${className}`}
    >
      <div className="w-full aspect-[1.91/1] bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
    </div>
  )
}

// Compact version for when there's no image
interface LinkPreviewCompactProps {
  data: LinkPreviewData
  className?: string
}

export function LinkPreviewCompact({ data, className = '' }: LinkPreviewCompactProps) {
  if (!data.title && !data.description) {
    return null
  }

  const hostname = (() => {
    try {
      return new URL(data.url).hostname.replace(/^www\./, '')
    } catch {
      return data.url
    }
  })()

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`block mt-3 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors p-3 ${className}`}
    >
      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
        <LinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">{data.siteName || hostname}</span>
      </div>
      {data.title && (
        <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-0.5">
          {data.title}
        </h4>
      )}
      {data.description && (
        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
          {data.description}
        </p>
      )}
    </a>
  )
}
