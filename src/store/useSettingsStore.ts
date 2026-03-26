import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY_PREFIX = '@kott_settings';

function getSettingsKey(userId: string | null): string {
  return `${SETTINGS_KEY_PREFIX}:${userId ?? 'guest'}`;
}

const DEFAULT_SETTINGS = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.4,
  muted: false,
  hapticsEnabled: true,
};

interface SettingsState {
  /** Master volume 0–1 */
  masterVolume: number;
  /** SFX volume 0–1 */
  sfxVolume: number;
  /** Music volume 0–1 */
  musicVolume: number;
  /** Whether sound is globally muted */
  muted: boolean;
  /** Whether haptics are enabled */
  hapticsEnabled: boolean;

  initialized: boolean;
  activeUserId: string | null;

  setMasterVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  toggleMute: () => void;
  toggleHaptics: () => void;
  initSettings: () => Promise<void>;
  setStorageUser: (userId: string | null) => Promise<void>;
  persistSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  initialized: false,
  activeUserId: null,

  setMasterVolume: (v) => {
    set({ masterVolume: v });
    get().persistSettings();
  },

  setSfxVolume: (v) => {
    set({ sfxVolume: v });
    get().persistSettings();
  },

  setMusicVolume: (v) => {
    set({ musicVolume: v });
    get().persistSettings();
  },

  toggleMute: () => {
    set((s) => ({ muted: !s.muted }));
    get().persistSettings();
  },

  toggleHaptics: () => {
    set((s) => ({ hapticsEnabled: !s.hapticsEnabled }));
    get().persistSettings();
  },

  initSettings: async () => {
    await get().setStorageUser(get().activeUserId);
  },

  setStorageUser: async (userId) => {
    try {
      set({ ...DEFAULT_SETTINGS, activeUserId: userId, initialized: false });

      const raw = await AsyncStorage.getItem(getSettingsKey(userId));
      if (raw) {
        const data = JSON.parse(raw);
        set({
          masterVolume: data.masterVolume ?? DEFAULT_SETTINGS.masterVolume,
          sfxVolume: data.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume,
          musicVolume: data.musicVolume ?? DEFAULT_SETTINGS.musicVolume,
          muted: data.muted ?? DEFAULT_SETTINGS.muted,
          hapticsEnabled: data.hapticsEnabled ?? DEFAULT_SETTINGS.hapticsEnabled,
          initialized: true,
        });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  persistSettings: async () => {
    try {
      const s = get();
      await AsyncStorage.setItem(
        getSettingsKey(s.activeUserId),
        JSON.stringify({
          masterVolume: s.masterVolume,
          sfxVolume: s.sfxVolume,
          musicVolume: s.musicVolume,
          muted: s.muted,
          hapticsEnabled: s.hapticsEnabled,
        }),
      );
    } catch {
      // silent
    }
  },
}));
