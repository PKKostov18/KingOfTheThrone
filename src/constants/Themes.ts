// 👑💩 Theme System — King of the Throne

export interface AppTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requiredLevel: number;  // 0 = free

  // Backgrounds
  darkBg: string;
  cardBg: string;
  cardBgLight: string;
  modalBg: string;

  // Primary accent
  accent: string;
  accentLight: string;
  accentDark: string;
  accentMuted: string;

  // Action
  activeRed: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDark: string;

  // Borders
  border: string;
  borderLight: string;
}

export const THEMES: AppTheme[] = [
  {
    id: 'royal_brown',
    name: 'Royal Brown',
    emoji: '💩',
    description: 'The classic throne experience',
    requiredLevel: 0,
    darkBg: '#1B0E07',
    cardBg: '#2A1A10',
    cardBgLight: '#3D2517',
    modalBg: '#241208',
    accent: '#FFD700',
    accentLight: '#FFE44D',
    accentDark: '#CC9900',
    accentMuted: 'rgba(255, 215, 0, 0.15)',
    activeRed: '#FF3D3D',
    textPrimary: '#FFFFFF',
    textSecondary: '#C4A882',
    textMuted: '#8B7355',
    textDark: '#1B0E07',
    border: '#3D2517',
    borderLight: '#5C3A1E',
  },
  {
    id: 'ocean_flush',
    name: 'Ocean Flush',
    emoji: '🌊',
    description: 'Cool toilet water vibes',
    requiredLevel: 2,
    darkBg: '#0A1628',
    cardBg: '#112240',
    cardBgLight: '#1A3358',
    modalBg: '#0D1B30',
    accent: '#4FC3F7',
    accentLight: '#81D4FA',
    accentDark: '#0288D1',
    accentMuted: 'rgba(79, 195, 247, 0.15)',
    activeRed: '#FF5252',
    textPrimary: '#FFFFFF',
    textSecondary: '#8EACC4',
    textMuted: '#5B7A99',
    textDark: '#0A1628',
    border: '#1A3358',
    borderLight: '#254A72',
  },
  {
    id: 'royal_purple',
    name: 'Royal Purple',
    emoji: '👾',
    description: 'For true toilet royalty',
    requiredLevel: 3,
    darkBg: '#1A0A2E',
    cardBg: '#2D1B4E',
    cardBgLight: '#3E2668',
    modalBg: '#1F0F38',
    accent: '#BB86FC',
    accentLight: '#D4AAFF',
    accentDark: '#7C4DFF',
    accentMuted: 'rgba(187, 134, 252, 0.15)',
    activeRed: '#FF5252',
    textPrimary: '#FFFFFF',
    textSecondary: '#B39DDB',
    textMuted: '#7E57C2',
    textDark: '#1A0A2E',
    border: '#3E2668',
    borderLight: '#512DA8',
  },
  {
    id: 'emerald_throne',
    name: 'Emerald Throne',
    emoji: '🌿',
    description: 'Eco-friendly pooping',
    requiredLevel: 4,
    darkBg: '#0A1F0A',
    cardBg: '#153015',
    cardBgLight: '#1E4D1E',
    modalBg: '#0D250D',
    accent: '#66BB6A',
    accentLight: '#81C784',
    accentDark: '#388E3C',
    accentMuted: 'rgba(102, 187, 106, 0.15)',
    activeRed: '#FF5252',
    textPrimary: '#FFFFFF',
    textSecondary: '#A5D6A7',
    textMuted: '#6B9E6B',
    textDark: '#0A1F0A',
    border: '#1E4D1E',
    borderLight: '#2E7D32',
  },
  {
    id: 'midnight_gold',
    name: 'Midnight Gold',
    emoji: '🌙',
    description: 'Luxurious late-night sessions',
    requiredLevel: 5,
    darkBg: '#0D0D0D',
    cardBg: '#1A1A1A',
    cardBgLight: '#2A2A2A',
    modalBg: '#111111',
    accent: '#FFB300',
    accentLight: '#FFCA28',
    accentDark: '#FF8F00',
    accentMuted: 'rgba(255, 179, 0, 0.15)',
    activeRed: '#FF3D3D',
    textPrimary: '#FFFFFF',
    textSecondary: '#BDBDBD',
    textMuted: '#757575',
    textDark: '#0D0D0D',
    border: '#2A2A2A',
    borderLight: '#424242',
  },
  {
    id: 'blood_throne',
    name: 'Blood Throne',
    emoji: '🩸',
    description: 'The fiery aftermath of spicy food',
    requiredLevel: 6,
    darkBg: '#1A0505',
    cardBg: '#2E0A0A',
    cardBgLight: '#451212',
    modalBg: '#200808',
    accent: '#FF5252',
    accentLight: '#FF8A80',
    accentDark: '#D32F2F',
    accentMuted: 'rgba(255, 82, 82, 0.15)',
    activeRed: '#FFAB00',
    textPrimary: '#FFFFFF',
    textSecondary: '#EF9A9A',
    textMuted: '#B05555',
    textDark: '#1A0505',
    border: '#451212',
    borderLight: '#6B1E1E',
  },
  {
    id: 'kings_gold',
    name: "King's Gold",
    emoji: '👑',
    description: "The ultimate throne — pure gold!",
    requiredLevel: 8,
    darkBg: '#1A1400',
    cardBg: '#2E2400',
    cardBgLight: '#453600',
    modalBg: '#201800',
    accent: '#FFD700',
    accentLight: '#FFE44D',
    accentDark: '#CC9900',
    accentMuted: 'rgba(255, 215, 0, 0.2)',
    activeRed: '#FF5252',
    textPrimary: '#FFFFFF',
    textSecondary: '#FFE082',
    textMuted: '#BFA730',
    textDark: '#1A1400',
    border: '#453600',
    borderLight: '#6B5200',
  },
];

export function getThemeById(id: string): AppTheme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function getAvailableThemes(level: number): AppTheme[] {
  return THEMES.filter((t) => t.requiredLevel <= level);
}

export function getLockedThemes(level: number): AppTheme[] {
  return THEMES.filter((t) => t.requiredLevel > level);
}
