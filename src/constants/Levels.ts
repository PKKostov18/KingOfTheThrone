// 👑💩 Leveling System — King of the Throne
// XP = total_poops. Each level requires more deposits to reach.

export interface LevelConfig {
  level: number;
  title: string;
  emoji: string;
  requiredPoops: number;  // total poops needed to reach this level
  reward: string;         // what you unlock
  rewardEmoji: string;
}

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    title: 'Toilet Peasant',
    emoji: '🧑‍🌾',
    requiredPoops: 0,
    reward: 'Welcome to the kingdom!',
    rewardEmoji: '🚽',
  },
  {
    level: 2,
    title: 'Bathroom Squire',
    emoji: '🛡️',
    requiredPoops: 3,
    reward: 'Squire Badge unlocked!',
    rewardEmoji: '🛡️',
  },
  {
    level: 3,
    title: 'Porcelain Knight',
    emoji: '⚔️',
    requiredPoops: 7,
    reward: 'Knight\'s Plunger unlocked!',
    rewardEmoji: '🪠',
  },
  {
    level: 4,
    title: 'Throne Baron',
    emoji: '🏰',
    requiredPoops: 15,
    reward: 'Baron\'s Golden Toilet Paper!',
    rewardEmoji: '🧻✨',
  },
  {
    level: 5,
    title: 'Royal Flusher',
    emoji: '💎',
    requiredPoops: 25,
    reward: 'Diamond Flush Handle!',
    rewardEmoji: '💎',
  },
  {
    level: 6,
    title: 'Grand Dumper',
    emoji: '🌟',
    requiredPoops: 40,
    reward: 'Star-Studded Toilet Seat!',
    rewardEmoji: '🌟',
  },
  {
    level: 7,
    title: 'Emperor of the Bowl',
    emoji: '🔱',
    requiredPoops: 60,
    reward: 'Emperor\'s Trident Scepter!',
    rewardEmoji: '🔱',
  },
  {
    level: 8,
    title: 'Legendary Pooper',
    emoji: '🏆',
    requiredPoops: 85,
    reward: 'Legendary Golden Throne!',
    rewardEmoji: '🏆',
  },
  {
    level: 9,
    title: 'Toilet God',
    emoji: '⚡',
    requiredPoops: 120,
    reward: 'Lightning Flush Power!',
    rewardEmoji: '⚡',
  },
  {
    level: 10,
    title: 'King of the Throne',
    emoji: '👑',
    requiredPoops: 169,
    reward: 'THE ULTIMATE CROWN! You are the King!',
    rewardEmoji: '👑💩',
  },
];

/**
 * Compute the level for a given poop count.
 */
export function getLevelForPoops(totalPoops: number): LevelConfig {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalPoops >= lvl.requiredPoops) {
      current = lvl;
    } else {
      break;
    }
  }
  return current;
}

/**
 * Get the next level config, or null if max level.
 */
export function getNextLevel(currentLevel: number): LevelConfig | null {
  const idx = LEVELS.findIndex((l) => l.level === currentLevel);
  if (idx === -1 || idx >= LEVELS.length - 1) return null;
  return LEVELS[idx + 1];
}

/**
 * Get progress towards the next level as a 0-1 ratio.
 */
export function getLevelProgress(totalPoops: number): number {
  const current = getLevelForPoops(totalPoops);
  const next = getNextLevel(current.level);
  if (!next) return 1; // max level

  const poopsIntoLevel = totalPoops - current.requiredPoops;
  const poopsNeeded = next.requiredPoops - current.requiredPoops;
  return Math.min(poopsIntoLevel / poopsNeeded, 1);
}

/**
 * Get how many poops until next level.
 */
export function getPoopsToNextLevel(totalPoops: number): number | null {
  const current = getLevelForPoops(totalPoops);
  const next = getNextLevel(current.level);
  if (!next) return null; // max level
  return next.requiredPoops - totalPoops;
}
