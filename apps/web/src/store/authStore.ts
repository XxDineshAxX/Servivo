import { create } from 'zustand';
import type { ConsumerProfile, ProProfile } from '@servivo/types';
import {
  onAuthProfileChange,
  signOut,
  updateUserProfile,
  type ProfileUpdateFields,
} from '@servivo/firebase';

interface AuthState {
  profile: ConsumerProfile | ProProfile | null;
  loading: boolean;
  initialized: boolean;
  setProfile: (profile: ConsumerProfile | ProProfile | null) => void;
  updateProfile: (fields: ProfileUpdateFields) => Promise<void>;
  signOut: () => Promise<void>;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,
  initialized: false,

  setProfile: (profile) => set({ profile }),

  updateProfile: async (fields) => {
    const { profile } = get();
    if (!profile) return;
    await updateUserProfile(profile.uid, fields);
    set({ profile: { ...profile, ...fields } as ConsumerProfile | ProProfile });
  },

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
