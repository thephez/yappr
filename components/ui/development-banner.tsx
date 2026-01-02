'use client'

import packageJson from '@/package.json'
import { cacheManager } from '@/lib/cache-manager'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export function DevelopmentBanner() {
  const handleClearCache = () => {
    // Clear application cache
    cacheManager.clearAll()
    
    // Clear browser storage
    if (typeof window !== 'undefined') {
      // Clear localStorage (except auth and biometric data)
      const keysToKeep = [
        'dash_identity_id',
        'dash_public_address',
        'yappr_session',
        'yappr_bio_credential'
      ]
      // Also preserve any biometric-encrypted private keys
      const prefixesToKeep = ['yappr_bio_pk_']
      const savedData: Record<string, string> = {}
      
      // Save auth data by exact key
      keysToKeep.forEach(key => {
        const value = localStorage.getItem(key)
        if (value) savedData[key] = value
      })

      // Save data by prefix (biometric encrypted keys)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && prefixesToKeep.some(prefix => key.startsWith(prefix))) {
          const value = localStorage.getItem(key)
          if (value) savedData[key] = value
        }
      }
      
      // Clear all localStorage
      localStorage.clear()
      
      // Restore auth data
      Object.entries(savedData).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })
      
      // Clear sessionStorage (except biometric encryption keys)
      const sessionKeysToKeep: Record<string, string> = {}
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith('yappr_bio_')) {
          const value = sessionStorage.getItem(key)
          if (value) sessionKeysToKeep[key] = value
        }
      }
      sessionStorage.clear()
      Object.entries(sessionKeysToKeep).forEach(([key, value]) => {
        sessionStorage.setItem(key, value)
      })
      
      // Reload the page
      window.location.reload()
    }
  }

  return (
    <div className="bg-yappr-500 text-white px-4 py-2 text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-center flex-1">
          <span className="font-medium">Yappr is in an early development phase.</span>
          {' '}
          <span className="opacity-90">This dapp is on version {packageJson.version}.</span>
          {' '}
          <span className="opacity-90">No need to report issues yet.</span>
        </p>
        
        <button
          onClick={handleClearCache}
          className="ml-4 flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
          title="Clear cache and reload"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Clear Cache</span>
        </button>
      </div>
    </div>
  )
}