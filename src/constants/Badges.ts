// 👑💩 Badge / Achievement Definitions

export interface BadgeConfig {
  id: string;           // matches badge_name in achievements table
  name: string;
  emoji: string;
  description: string;
  unlockedAtLevel: number;  // 0 = special / non-level badge
}

// Badges earned by leveling up
export const LEVEL_BADGES: BadgeConfig[] = [
  {
    id: 'first_flush',
    name: 'First Flush',
    emoji: '🚽',
    description: 'Completed your very first session!',
    unlockedAtLevel: 1,
  },
  {
    id: 'squire_shield',
    name: 'Squire Shield',
    emoji: '🛡️',
    description: 'Reached Level 2 — Bathroom Squire',
    unlockedAtLevel: 2,
  },
  {
    id: 'knights_plunger',
    name: "Knight's Plunger",
    emoji: '🪠',
    description: 'Reached Level 3 — Porcelain Knight',
    unlockedAtLevel: 3,
  },
  {
    id: 'golden_roll',
    name: 'Golden Roll',
    emoji: '🧻',
    description: 'Reached Level 4 — Throne Baron',
    unlockedAtLevel: 4,
  },
  {
    id: 'diamond_handle',
    name: 'Diamond Handle',
    emoji: '💎',
    description: 'Reached Level 5 — Royal Flusher',
    unlockedAtLevel: 5,
  },
  {
    id: 'star_seat',
    name: 'Star Seat',
    emoji: '🌟',
    description: 'Reached Level 6 — Grand Dumper',
    unlockedAtLevel: 6,
  },
  {
    id: 'emperor_trident',
    name: "Emperor's Trident",
    emoji: '🔱',
    description: 'Reached Level 7 — Emperor of the Bowl',
    unlockedAtLevel: 7,
  },
  {
    id: 'golden_throne',
    name: 'Golden Throne',
    emoji: '🏆',
    description: 'Reached Level 8 — Legendary Pooper',
    unlockedAtLevel: 8,
  },
  {
    id: 'lightning_flush',
    name: 'Lightning Flush',
    emoji: '⚡',
    description: 'Reached Level 9 — Toilet God',
    unlockedAtLevel: 9,
  },
  {
    id: 'ultimate_crown',
    name: 'Ultimate Crown',
    emoji: '👑',
    description: 'Reached Level 10 — King of the Throne!',
    unlockedAtLevel: 10,
  },
];

// Special milestone badges (non-level)
export const MILESTONE_BADGES: BadgeConfig[] = [
  {
    id: 'perfect_form',
    name: 'Perfect Form',
    emoji: '🐍',
    description: 'Achieved a Bristol Type 4 (the perfect poop)',
    unlockedAtLevel: 0,
  },
  {
    id: 'five_star_royal',
    name: 'Five Star Royal',
    emoji: '🤩',
    description: 'Rated a session as "Royal!" (5 stars)',
    unlockedAtLevel: 0,
  },
  {
    id: 'ten_deposits',
    name: 'Ten Timer',
    emoji: '🔟',
    description: 'Completed 10 royal deposits',
    unlockedAtLevel: 0,
  },
  {
    id: 'fifty_deposits',
    name: 'Half Century',
    emoji: '5️⃣0️⃣',
    description: 'Completed 50 royal deposits',
    unlockedAtLevel: 0,
  },
  {
    id: 'hundred_deposits',
    name: 'Century Club',
    emoji: '💯',
    description: 'Completed 100 royal deposits!',
    unlockedAtLevel: 0,
  },
  {
    id: 'first_prestige',
    name: 'First Flush',
    emoji: '🪠',
    description: 'Prestiged for the first time!',
    unlockedAtLevel: 0,
  },
  {
    id: 'poop_booster',
    name: 'Poop Booster',
    emoji: '🚀',
    description: 'Activated your first poop boost',
    unlockedAtLevel: 0,
  },
];

export const ALL_BADGES: BadgeConfig[] = [...LEVEL_BADGES, ...MILESTONE_BADGES];

/**
 * Get badge config by id
 */
export function getBadgeById(id: string): BadgeConfig | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

/**
 * Get badges that should be awarded when reaching a specific level.
 */
export function getBadgesForLevel(level: number): BadgeConfig[] {
  return LEVEL_BADGES.filter((b) => b.unlockedAtLevel === level);
}

/**
 * Check milestone badges after a session.
 */
export function checkMilestoneBadges(
  bristolScale: number,
  funRating: number,
  totalPoops: number,
  timesPrestiged: number,
  hasPoopBoosted: boolean,
): string[] {
  const earned: string[] = [];

  if (bristolScale === 4) earned.push('perfect_form');
  if (funRating === 5) earned.push('five_star_royal');
  if (totalPoops >= 10) earned.push('ten_deposits');
  if (totalPoops >= 50) earned.push('fifty_deposits');
  if (totalPoops >= 100) earned.push('hundred_deposits');
  if (timesPrestiged >= 1) earned.push('first_prestige');
  if (hasPoopBoosted) earned.push('poop_booster');

  return earned;
}
