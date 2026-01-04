/**
 * Avatar utilities for DiceBear "thumbs" style avatars
 * Generated deterministically from user IDs
 *
 * Note: When using these URLs in <img> tags, add crossOrigin="anonymous"
 * to work with COEP headers.
 */

export function getDefaultAvatarUrl(userId: string): string {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(userId)}`
}
