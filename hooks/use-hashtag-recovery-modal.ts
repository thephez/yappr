import { create } from 'zustand'
import { Post } from '@/lib/types'

interface HashtagRecoveryModalStore {
  isOpen: boolean
  post: Post | null
  hashtag: string | null // The specific failed hashtag (normalized, no #)
  isRegistering: boolean
  error: string | null

  open: (post: Post, hashtag: string) => void
  close: () => void
  setRegistering: (value: boolean) => void
  setError: (error: string | null) => void
}

export const useHashtagRecoveryModal = create<HashtagRecoveryModalStore>((set) => ({
  isOpen: false,
  post: null,
  hashtag: null,
  isRegistering: false,
  error: null,

  open: (post, hashtag) =>
    set({
      isOpen: true,
      post,
      hashtag,
      isRegistering: false,
      error: null
    }),

  close: () =>
    set({
      isOpen: false,
      post: null,
      hashtag: null,
      isRegistering: false,
      error: null
    }),

  setRegistering: (value) => set({ isRegistering: value }),

  setError: (error) => set({ error })
}))
