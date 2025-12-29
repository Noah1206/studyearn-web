/**
 * User Store - Manages user state including type, profile, and creator status
 * Uses Zustand with localStorage persistence for web
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserType = 'runner' | 'creator' | null;

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  school?: string;
}

export interface CreatorProfile {
  display_name: string;
  handle?: string;
  bio?: string;
  school?: string;
  profile_image_url?: string;
  banner_image_url?: string;
  intro_video_url?: string;
  is_verified: boolean;
  total_subscribers: number;
}

interface UserState {
  // User type: 'runner' | 'creator' | null
  userType: UserType;

  // Basic profile information
  profile: UserProfile | null;

  // Creator-specific state
  isCreatorOnboarded: boolean;
  creatorOnboardedAt: string | null;
  creatorProfile: CreatorProfile | null;

  // Track if user has ever been a creator (for showing switch button)
  hasBeenCreator: boolean;

  // Loading state for initial hydration
  isHydrated: boolean;

  // Actions - Basic
  setUserType: (type: UserType) => void;
  setProfile: (profile: UserProfile | null) => void;
  setHydrated: (hydrated: boolean) => void;

  // Combined action for after signup
  initializeUser: (type: UserType, profile: UserProfile) => void;

  // Clear user data (on logout)
  clearUser: () => void;

  // Check if user setup is complete
  isSetupComplete: () => boolean;

  // Actions - Creator
  convertToCreator: () => void;
  completeCreatorOnboarding: (creatorProfile: CreatorProfile) => void;
  setCreatorProfile: (profile: CreatorProfile | null) => void;
  revertToRunner: () => void;
  switchToCreator: () => void;

  // Computed - Creator
  canAccessCreatorFeatures: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      userType: null,
      profile: null,
      isCreatorOnboarded: false,
      creatorOnboardedAt: null,
      creatorProfile: null,
      hasBeenCreator: false,
      isHydrated: false,

      // Basic actions
      setUserType: (type) =>
        set({
          userType: type,
        }),

      setProfile: (profile) =>
        set({
          profile,
        }),

      setHydrated: (hydrated) =>
        set({
          isHydrated: hydrated,
        }),

      initializeUser: (type, profile) =>
        set({
          userType: type,
          profile,
        }),

      clearUser: () =>
        set({
          userType: null,
          profile: null,
          isCreatorOnboarded: false,
          creatorOnboardedAt: null,
          creatorProfile: null,
          hasBeenCreator: false,
        }),

      isSetupComplete: () => {
        const state = get();
        return state.userType !== null && state.profile !== null;
      },

      // Creator actions
      /**
       * Convert user type to creator (first step before onboarding)
       * User still needs to complete onboarding to access creator features
       */
      convertToCreator: () =>
        set({
          userType: 'creator',
          hasBeenCreator: true,
        }),

      /**
       * Complete creator onboarding with profile data
       * This enables full creator feature access
       */
      completeCreatorOnboarding: (creatorProfile) =>
        set({
          userType: 'creator',
          isCreatorOnboarded: true,
          creatorOnboardedAt: new Date().toISOString(),
          creatorProfile,
          hasBeenCreator: true,
        }),

      setCreatorProfile: (profile) =>
        set({
          creatorProfile: profile,
        }),

      /**
       * Revert creator back to runner status
       * Preserves hasBeenCreator flag and creator profile for quick switching back
       */
      revertToRunner: () =>
        set({
          userType: 'runner',
        }),

      /**
       * Switch back to creator from runner (for users who have been creators before)
       * Restores creator status without requiring re-onboarding
       */
      switchToCreator: () =>
        set({
          userType: 'creator',
        }),

      // Computed values
      canAccessCreatorFeatures: () => {
        const state = get();
        return state.userType === 'creator' && state.isCreatorOnboarded;
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        userType: state.userType,
        profile: state.profile,
        isCreatorOnboarded: state.isCreatorOnboarded,
        creatorOnboardedAt: state.creatorOnboardedAt,
        creatorProfile: state.creatorProfile,
        hasBeenCreator: state.hasBeenCreator,
      }),
    }
  )
);
