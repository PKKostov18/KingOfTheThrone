import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@kott_consent';

interface ConsentState {
  hasAcceptedConsent: boolean;
  initialized: boolean;
  acceptConsent: () => Promise<void>;
  initConsent: () => Promise<void>;
}

export const useConsentStore = create<ConsentState>((set) => ({
  hasAcceptedConsent: false,
  initialized: false,

  initConsent: async () => {
    try {
      const value = await AsyncStorage.getItem(CONSENT_KEY);
      set({
        hasAcceptedConsent: value === 'true',
        initialized: true,
      });
    } catch {
      set({ initialized: true });
    }
  },

  acceptConsent: async () => {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, 'true');
      set({ hasAcceptedConsent: true });
    } catch {
      // Still set in memory even if persist fails
      set({ hasAcceptedConsent: true });
    }
  },
}));
