import { UserProfile, defaultUserProfile } from '@/types/user';

const STORAGE_KEY = 'tennisCoach_userProfile';
const RAG_ENABLED_KEY = 'tennisCoach_ragEnabled';

export const storage = {
  getUserProfile(): UserProfile {
    if (typeof window === 'undefined') return defaultUserProfile;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultUserProfile;

      return JSON.parse(stored) as UserProfile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return defaultUserProfile;
    }
  },

  saveUserProfile(profile: UserProfile): void {
    if (typeof window === 'undefined') return;

    try {
      const updated = { ...profile, updatedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  },

  clearUserProfile(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing user profile:', error);
    }
  },

  hasCompletedOnboarding(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return !!stored;
    } catch {
      return false;
    }
  },

  // RAG settings
  isRAGEnabled(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const stored = localStorage.getItem(RAG_ENABLED_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  },

  setRAGEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(RAG_ENABLED_KEY, String(enabled));
    } catch (error) {
      console.error('Error saving RAG setting:', error);
    }
  },
};
