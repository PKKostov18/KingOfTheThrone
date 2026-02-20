// 👑💩 Avatar Picker — Emoji avatars for profile

export interface AvatarOption {
  id: string;
  emoji: string;
  name: string;
  requiredLevel: number; // 0 = free
}

export const AVATARS: AvatarOption[] = [
  // Free (Level 0+)
  { id: 'poop', emoji: '💩', name: 'Classic Poop', requiredLevel: 0 },
  { id: 'toilet', emoji: '🚽', name: 'The Porcelain', requiredLevel: 0 },
  { id: 'roll', emoji: '🧻', name: 'TP Roll', requiredLevel: 0 },
  { id: 'newspaper', emoji: '📰', name: 'The Reader', requiredLevel: 0 },

  // Level 2+
  { id: 'shield', emoji: '🛡️', name: 'Squire Shield', requiredLevel: 2 },
  { id: 'plunger', emoji: '🪠', name: 'Plunger Hero', requiredLevel: 2 },

  // Level 3+
  { id: 'sword', emoji: '⚔️', name: 'Knight\'s Blade', requiredLevel: 3 },
  { id: 'castle', emoji: '🏰', name: 'The Castle', requiredLevel: 3 },

  // Level 4+
  { id: 'diamond', emoji: '💎', name: 'Diamond Dump', requiredLevel: 4 },
  { id: 'fire', emoji: '🔥', name: 'Spicy Result', requiredLevel: 4 },

  // Level 5+
  { id: 'star', emoji: '🌟', name: 'Star Sitter', requiredLevel: 5 },
  { id: 'rocket', emoji: '🚀', name: 'Blast Off', requiredLevel: 5 },

  // Level 6+
  { id: 'trident', emoji: '🔱', name: 'Trident King', requiredLevel: 6 },
  { id: 'dragon', emoji: '🐉', name: 'Throne Dragon', requiredLevel: 6 },

  // Level 7+
  { id: 'lightning', emoji: '⚡', name: 'Electric Flush', requiredLevel: 7 },
  { id: 'trophy', emoji: '🏆', name: 'Championship', requiredLevel: 7 },

  // Level 8+
  { id: 'demon', emoji: '😈', name: 'Throne Demon', requiredLevel: 8 },
  { id: 'alien', emoji: '👽', name: 'Space Pooper', requiredLevel: 8 },

  // Level 9+
  { id: 'skull', emoji: '💀', name: 'Death Dump', requiredLevel: 9 },

  // Level 10 — King only
  { id: 'crown', emoji: '👑', name: 'The Crown', requiredLevel: 10 },
];

export function getAvatarById(id: string): AvatarOption {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export function getAvailableAvatars(level: number): AvatarOption[] {
  return AVATARS.filter((a) => a.requiredLevel <= level);
}

export function getLockedAvatars(level: number): AvatarOption[] {
  return AVATARS.filter((a) => a.requiredLevel > level);
}
