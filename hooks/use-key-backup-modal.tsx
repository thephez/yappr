import { create } from 'zustand'

interface KeyBackupModalStore {
  isOpen: boolean
  identityId?: string
  username?: string
  privateKey?: string
  redirectOnClose: boolean
  open: (identityId: string, username: string, privateKey: string, redirectOnClose?: boolean) => void
  close: () => void
}

export const useKeyBackupModal = create<KeyBackupModalStore>((set) => ({
  isOpen: false,
  identityId: undefined,
  username: undefined,
  privateKey: undefined,
  redirectOnClose: true,
  open: (identityId, username, privateKey, redirectOnClose = true) => set({
    isOpen: true,
    identityId,
    username,
    privateKey,
    redirectOnClose
  }),
  close: () => set({
    isOpen: false,
    identityId: undefined,
    username: undefined,
    privateKey: undefined,
    redirectOnClose: true
  }),
}))
