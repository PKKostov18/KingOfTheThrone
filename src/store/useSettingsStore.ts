import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@kott_settings';

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

  setMasterVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  toggleMute: () => void;
  toggleHaptics: () => void;
  initSettings: () => Promise<void>;
  persistSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.4,
  muted: false,
  hapticsEnabled: true,
  initialized: false,

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
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          masterVolume: data.masterVolume ?? 0.7,
          sfxVolume: data.sfxVolume ?? 0.8,
          musicVolume: data.musicVolume ?? 0.4,
          muted: data.muted ?? false,
          hapticsEnabled: data.hapticsEnabled ?? true,
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
        SETTINGS_KEY,
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
