/**
 * Identity store - reactive identity state for components
 */
import { create } from 'zustand';
import { cliIdentityService, type CliIdentity } from '../services/cli-identity.js';

interface IdentityState {
  identity: CliIdentity | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadIdentity: () => void;
  setIdentity: (identityId: string) => Promise<void>;
  clearIdentity: () => void;
  refreshIdentity: () => Promise<void>;
}

export const useIdentity = create<IdentityState>((set, get) => ({
  identity: null,
  loading: false,
  error: null,

  loadIdentity: () => {
    const identity = cliIdentityService.loadFromDisk();
    set({ identity, loading: false, error: null });
  },

  setIdentity: async (identityId: string) => {
    set({ loading: true, error: null });
    try {
      const identity = await cliIdentityService.setIdentity(identityId);
      set({ identity, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to set identity',
        loading: false,
      });
      throw e;
    }
  },

  clearIdentity: () => {
    cliIdentityService.clearIdentity();
    set({ identity: null, error: null });
  },

  refreshIdentity: async () => {
    const { identity } = get();
    if (!identity) return;

    set({ loading: true });
    try {
      const refreshed = await cliIdentityService.refreshIdentity();
      set({ identity: refreshed, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
}));
