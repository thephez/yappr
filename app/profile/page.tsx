'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CameraIcon,
  LinkIcon,
  MapPinIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { Sidebar } from '@/components/layout/sidebar'
import { RightSidebar } from '@/components/layout/right-sidebar'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { formatNumber, cn } from '@/lib/utils'
import { getDefaultAvatarUrl } from '@/lib/avatar-utils'
import toast from 'react-hot-toast'
import { withAuth, useAuth } from '@/contexts/auth-context'

function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })

  // Profile edit states
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  
  const joinDate = new Date() // TODO: Get from identity registration
  
  // Load user posts
  useEffect(() => {
    if (!user) return
    
    const loadUserPosts = async () => {
      try {
        setIsLoadingPosts(true)
        const { getDashPlatformClient } = await import('@/lib/dash-platform-client')
        const dashClient = getDashPlatformClient()
        
        // Query posts by author
        const posts = await dashClient.queryPosts({ 
          authorId: user.identityId,
          limit: 50 
        })
        
        // Transform posts to match our UI format
        const transformedPosts = posts.map((post: any) => ({
          id: post.$id,
          content: post.content,
          author: {
            id: post.authorId,
            username: user.identityId.slice(0, 8) + '...',
            handle: user.identityId.slice(0, 8).toLowerCase()
          },
          timestamp: new Date(post.$createdAt).toISOString(),
          likes: 0,
          replies: 0,
          reposts: 0,
          views: 0
        }))
        
        setUserPosts(transformedPosts)
      } catch (error) {
        console.error('Failed to load user posts:', error)
      } finally {
        setIsLoadingPosts(false)
      }
    }
    
    loadUserPosts()
  }, [user])

  // Load follow counts
  useEffect(() => {
    if (!user?.identityId) return

    const loadFollowCounts = async () => {
      try {
        const { followService } = await import('@/lib/services')
        const [followers, following] = await Promise.all([
          followService.countFollowers(user.identityId),
          followService.countFollowing(user.identityId)
        ])
        setFollowCounts({ followers, following })
      } catch (error) {
        console.error('Failed to load follow counts:', error)
      }
    }

    loadFollowCounts()
  }, [user?.identityId])

  const handleSaveProfile = () => {
    // Save profile changes
    toast.success('Profile updated successfully')
    setIsEditingProfile(false)
  }

  return (
    <div className="min-h-[calc(100vh-40px)] flex">
      <Sidebar />

      <div className="flex-1 flex justify-center min-w-0">
        <main className="w-full max-w-[700px] md:border-x border-gray-200 dark:border-gray-800">
        {/* Header */}
        <header className="sticky top-[40px] z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-4 py-3">
            <button className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{displayName || 'Profile'}</h1>
              <p className="text-sm text-gray-500">{userPosts.length} posts</p>
            </div>
          </div>
        </header>

        {/* Banner */}
        <div className="relative h-48 bg-gradient-yappr">
          <button className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
            <CameraIcon className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4">
          <div className="relative flex justify-between items-start -mt-16 mb-4">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-white dark:bg-neutral-900 p-1">
                <img
                  src={getDefaultAvatarUrl(user?.identityId || 'default')}
                  alt="Your avatar"
                  className="h-full w-full rounded-full"
                />
              </div>
            </div>
            
            <div className="mt-20">
              {isEditingProfile ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingProfile(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile}>
                    Save
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit profile
                </Button>
              )}
            </div>
          </div>

          {isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-yappr-500"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-yappr-500 resize-none"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{bio.length}/160</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-yappr-500"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-yappr-500"
                  maxLength={100}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <h2 className="text-xl font-bold">{displayName || user?.identityId.slice(0, 8) + '...'}</h2>
                <p className="text-gray-500">@{user?.identityId.slice(0, 8).toLowerCase() || 'loading...'}</p>
              </div>
              
              {bio && <p className="mb-3">{bio}</p>}
              
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {location}
                  </span>
                )}
                {website && (
                  <a href={website} className="flex items-center gap-1 text-yappr-500 hover:underline">
                    <LinkIcon className="h-4 w-4" />
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Joined {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              
              <div className="flex gap-4 text-sm">
                <Link href="/following" className="hover:underline">
                  <span className="font-bold">{formatNumber(followCounts.following)}</span>
                  <span className="text-gray-500"> Following</span>
                </Link>
                <Link href="/followers" className="hover:underline">
                  <span className="font-bold">{formatNumber(followCounts.followers)}</span>
                  <span className="text-gray-500"> Followers</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Additional Profile Actions */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-950">
              <h3 className="font-semibold text-lg mb-1">{formatNumber(userPosts.length)}</h3>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-950">
              <h3 className="font-semibold text-lg mb-1">{formatNumber(followCounts.followers)}</h3>
              <p className="text-sm text-gray-500">Followers</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Actions</h3>
            <button
              onClick={() => {
                const profileUrl = `${window.location.origin}/user?id=${user?.identityId}`
                navigator.clipboard.writeText(profileUrl)
                toast.success('Profile link copied to clipboard!')
              }}
              className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-yappr-100 dark:bg-yappr-950 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-yappr-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Share Profile</p>
                <p className="text-sm text-gray-500">Get your profile link</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/settings')}
              className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Account Settings</p>
                <p className="text-sm text-gray-500">Manage your account</p>
              </div>
            </button>
          </div>
        </div>
        </main>
      </div>

      <RightSidebar />
    </div>
  )
}

export default withAuth(ProfilePage)