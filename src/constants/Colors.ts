// 👑💩 King of the Throne — Color Palette
// Default theme colors (Royal Brown) + dynamic theme support

import type { AppTheme } from './Themes';

export const Colors = {
  // Backgrounds
  darkBg: '#1B0E07',         // Deep dark chocolate
  cardBg: '#2A1A10',         // Dark card brown
  cardBgLight: '#3D2517',    // Lighter card brown
  modalBg: '#241208',        // Modal background

  // Primary (Gold — "The Crown")
  gold: '#FFD700',
  goldLight: '#FFE44D',
  goldDark: '#CC9900',
  goldMuted: 'rgba(255, 215, 0, 0.15)',

  // Poop Browns
  poopBrown: '#8B5A2B',
  poopDark: '#5C3A1E',
  poopLight: '#C68642',
  poopMuted: 'rgba(139, 90, 43, 0.3)',

  // Accent — Toilet Blue (water)
  toiletBlue: '#4FC3F7',
  toiletBlueDark: '#0288D1',
  toiletBlueMuted: 'rgba(79, 195, 247, 0.15)',

  // Action Colors
  activeRed: '#FF3D3D',
  activeRedDark: '#CC0000',
  successGreen: '#4CAF50',
  warningOrange: '#FF9800',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#C4A882',
  textMuted: '#8B7355',
  textDark: '#1B0E07',

  // Borders / Dividers
  border: '#3D2517',
  borderLight: '#5C3A1E',
  divider: 'rgba(255, 215, 0, 0.1)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
};

export type ColorsType = typeof Colors;

/**
 * Map an AppTheme to the Colors shape used throughout the app.
 * This lets every screen use themed colors without changing prop names.
 */

export function getThemedColors(theme: AppTheme): ColorsType {
  return {
    darkBg: theme.darkBg,
    cardBg: theme.cardBg,
    cardBgLight: theme.cardBgLight,
    modalBg: theme.modalBg,

    gold: theme.accent,
    goldLight: theme.accentLight,
    goldDark: theme.accentDark,
    goldMuted: theme.accentMuted,

    poopBrown: '#8B5A2B',
    poopDark: '#5C3A1E',
    poopLight: '#C68642',
    poopMuted: 'rgba(139, 90, 43, 0.3)',

    toiletBlue: '#4FC3F7',
    toiletBlueDark: '#0288D1',
    toiletBlueMuted: 'rgba(79, 195, 247, 0.15)',

    activeRed: theme.activeRed,
    activeRedDark: '#CC0000',
    successGreen: '#4CAF50',
    warningOrange: '#FF9800',

    textPrimary: theme.textPrimary,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    textDark: theme.textDark,

    border: theme.border,
    borderLight: theme.borderLight,
    divider: 'rgba(255, 215, 0, 0.1)',

    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
  };
}
