import { create } from 'zustand';
import type { ConsumerProfile, ProProfile } from '@servivo/types';
import { onAuthProfileChange, signOut } from '@servivo/firebase';

interface AuthState {
  profile: ConsumerProfile | ProProfile | null;
  loading: boolean;
  initialized: boolean;
  setProfile: (profile: ConsumerProfile | ProProfile | null) => void;
  signOut: () => Promise<void>;
  init: () => () => void; // returns unsubscribe fn
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  initialized: false,

  setProfile: (profile) => set({ profile }),

  signOut: async () => {
    await signOut();
    set({ profile: null });
  },

  init: () => {
    const unsubscribe = onAuthProfileChange((profile) => {
      set({ profile, loading: false, initialized: true });
    });
    return unsubscribe;
  },
}));
