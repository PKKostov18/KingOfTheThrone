import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, getThemeById, THEMES } from '../constants/Themes';

interface ThemeState {
  themeId: string;
  theme: AppTheme;
  initialized: boolean;
  setTheme: (id: string) => Promise<void>;
  initTheme: () => Promise<void>;
}

const THEME_KEY = 'kott_theme_id';

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: 'royal_brown',
  theme: THEMES[0],
  initialized: false,

  initTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) {
        const theme = getThemeById(saved);
        set({ themeId: saved, theme, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  setTheme: async (id: string) => {
    const theme = getThemeById(id);
    set({ themeId: id, theme });
    await AsyncStorage.setItem(THEME_KEY, id);
  },
}));
