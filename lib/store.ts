import { create } from 'zustand'
import { User, Post, Comment } from './types'
import { getDefaultAvatarUrl } from './avatar-utils'

interface AppState {
  currentUser: User | null
  isComposeOpen: boolean
  replyingTo: Post | null

  setCurrentUser: (user: User | null) => void
  setComposeOpen: (open: boolean) => void
  setReplyingTo: (post: Post | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: '1',
    username: 'alexchen',
    displayName: 'Alex Chen',
    avatar: getDefaultAvatarUrl('1'),
    bio: 'Building the future of social media',
    followers: 1234,
    following: 567,
    verified: true,
    joinedAt: new Date('2024-01-01'),
  },
  isComposeOpen: false,
  replyingTo: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setComposeOpen: (open) => set({ isComposeOpen: open }),
  setReplyingTo: (post) => set({ replyingTo: post }),
}))
