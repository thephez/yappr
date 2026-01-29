'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ProfileImageUpload } from '@/components/ui/profile-image-upload'
import { isIpfsProtocol, ipfsToGatewayUrl } from '@/lib/utils/ipfs-gateway'
import { Button } from '@/components/ui/button'
import { invalidateBannerCache } from '@/components/ui/banner-image'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface BannerCustomizationProps {
  /** Callback when banner is saved */
  onSave?: () => void
  /** Initial banner URL (ipfs:// or https://) */
  initialBannerUrl?: string | null
}

/**
 * Banner customization component for profile editing.
 * Allows uploading custom banner images via IPFS.
 */
export function BannerCustomization({ onSave, initialBannerUrl }: BannerCustomizationProps) {
  const { user } = useAuth()
  const [bannerUrl, setBannerUrl] = useState<string | null>(initialBannerUrl || null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(initialBannerUrl || null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!initialBannerUrl)

  // Load current banner from profile if not provided
  useEffect(() => {
    if (initialBannerUrl !== undefined) {
      setBannerUrl(initialBannerUrl)
      setOriginalUrl(initialBannerUrl)
      setLoading(false)
      return
    }

    if (!user?.identityId) {
      setLoading(false)
      return
    }

    const loadBanner = async () => {
      try {
        const { unifiedProfileService } = await import('@/lib/services/unified-profile-service')
        const profile = await unifiedProfileService.getProfile(user.identityId)
        const url = profile?.bannerUri || null
        setBannerUrl(url)
        setOriginalUrl(url)
      } catch (error) {
        console.error('Failed to load banner:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBanner().catch(console.error)
  }, [user?.identityId, initialBannerUrl])

  const hasChanges = bannerUrl !== originalUrl

  const handleUpload = useCallback((ipfsUrl: string) => {
    setBannerUrl(ipfsUrl)
  }, [])

  const handleClear = useCallback(() => {
    setBannerUrl(null)
  }, [])

  const handleSave = async () => {
    if (!user?.identityId) return

    setSaving(true)
    try {
      const { unifiedProfileService } = await import('@/lib/services/unified-profile-service')

      await unifiedProfileService.updateProfile(user.identityId, {
        bannerUri: bannerUrl || undefined,
      })

      // Invalidate cache
      invalidateBannerCache(user.identityId)
      setOriginalUrl(bannerUrl)

      toast.success('Banner saved!')
      onSave?.()
    } catch (error) {
      console.error('Failed to save banner:', error)
      toast.error('Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setBannerUrl(originalUrl)
  }

  // Convert IPFS URL to gateway URL for display
  const displayUrl = bannerUrl && isIpfsProtocol(bannerUrl)
    ? ipfsToGatewayUrl(bannerUrl)
    : bannerUrl

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Banner</h3>
        <div className="animate-pulse">
          <div className="aspect-[3/1] rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Banner</h3>

      {/* Preview of current banner */}
      {displayUrl && (
        <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Current banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Upload component */}
      <ProfileImageUpload
        currentUrl={bannerUrl || undefined}
        onUpload={handleUpload}
        onClear={handleClear}
        aspectRatio="banner"
        maxSizeMB={5}
        label={displayUrl ? 'Change Banner' : 'Upload Banner'}
        placeholder="Click to upload banner image"
      />

      <p className="text-xs text-gray-500">
        Recommended: 1500x500 pixels (3:1 aspect ratio). Max 5MB.
      </p>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {hasChanges && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="flex-1"
          >
            Reset
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Banner'
          )}
        </Button>
      </div>
    </div>
  )
}
