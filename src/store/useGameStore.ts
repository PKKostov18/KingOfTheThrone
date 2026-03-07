import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// ─── Upgrade Definitions ───────────────────────────────────────────────
export interface UpgradeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'click' | 'passive';
  baseCost: number;
  growthRate: number;   // exponential cost scaling
  basePower: number;    // +clickPower or +passiveIncome per level
  maxLevel: number;     // cap
  unlockCost: number;   // total-earned threshold to show upgrade (0 = always)
}

// ─── Click upgrades ────────────────────────────────────────────────────
const CLICK_UPGRADES: UpgradeDef[] = [
  { id: 'wet_wipes',       name: 'Wet Wipes',        emoji: '🧻', description: '+1 per tap',    type: 'click', baseCost: 15,           growthRate: 1.15, basePower: 1,      maxLevel: 200, unlockCost: 0 },
  { id: 'bidet',           name: 'Bidet Attachment',  emoji: '🚿', description: '+5 per tap',    type: 'click', baseCost: 200,          growthRate: 1.18, basePower: 5,      maxLevel: 150, unlockCost: 100 },
  { id: 'golden_plunger',  name: 'Golden Plunger',    emoji: '🪠', description: '+25 per tap',   type: 'click', baseCost: 2_500,        growthRate: 1.20, basePower: 25,     maxLevel: 120, unlockCost: 1_000 },
  { id: 'diamond_scrub',   name: 'Diamond Scrub',     emoji: '💎', description: '+120 per tap',  type: 'click', baseCost: 25_000,       growthRate: 1.22, basePower: 120,    maxLevel: 100, unlockCost: 10_000 },
  { id: 'royal_scepter',   name: 'Royal Scepter',     emoji: '🏆', description: '+600 per tap',  type: 'click', baseCost: 250_000,      growthRate: 1.25, basePower: 600,    maxLevel: 80,  unlockCost: 100_000 },
  { id: 'enchanted_brush', name: 'Enchanted Brush',   emoji: '✨', description: '+3K per tap',   type: 'click', baseCost: 2_500_000,    growthRate: 1.28, basePower: 3_000,  maxLevel: 60,  unlockCost: 1_000_000 },
  { id: 'quantum_wipe',    name: 'Quantum Wipe',      emoji: '🌀', description: '+15K per tap',  type: 'click', baseCost: 30_000_000,   growthRate: 1.30, basePower: 15_000, maxLevel: 50,  unlockCost: 10_000_000 },
];

// ─── Passive upgrades ──────────────────────────────────────────────────
const PASSIVE_UPGRADES: UpgradeDef[] = [
  { id: 'attendant',       name: 'Bathroom Attendant', emoji: '🧑‍🍳', description: '+0.5/sec',  type: 'passive', baseCost: 50,           growthRate: 1.15, basePower: 0.5,    maxLevel: 200, unlockCost: 0 },
  { id: 'air_freshener',   name: 'Air Freshener AI',   emoji: '🤖', description: '+3/sec',     type: 'passive', baseCost: 500,          growthRate: 1.18, basePower: 3,      maxLevel: 150, unlockCost: 200 },
  { id: 'smart_throne',    name: 'Smart Throne V2',    emoji: '🚽', description: '+15/sec',    type: 'passive', baseCost: 5_000,        growthRate: 1.20, basePower: 15,     maxLevel: 120, unlockCost: 2_000 },
  { id: 'plumbing_corp',   name: 'Plumbing Corp',      emoji: '🏢', description: '+80/sec',    type: 'passive', baseCost: 50_000,       growthRate: 1.22, basePower: 80,     maxLevel: 100, unlockCost: 20_000 },
  { id: 'sewer_empire',    name: 'Sewer Empire',       emoji: '🌊', description: '+400/sec',   type: 'passive', baseCost: 500_000,      growthRate: 1.25, basePower: 400,    maxLevel: 80,  unlockCost: 200_000 },
  { id: 'toilet_factory',  name: 'Toilet Factory',     emoji: '🏭', description: '+2K/sec',    type: 'passive', baseCost: 5_000_000,    growthRate: 1.28, basePower: 2_000,  maxLevel: 60,  unlockCost: 2_000_000 },
  { id: 'orbital_bidet',   name: 'Orbital Bidet',      emoji: '🛸', description: '+10K/sec',   type: 'passive', baseCost: 50_000_000,   growthRate: 1.30, basePower: 10_000, maxLevel: 50,  unlockCost: 20_000_000 },
  { id: 'quantum_toilet',  name: 'Quantum Toilet',     emoji: '⚛️',  description: '+60K/sec',   type: 'passive', baseCost: 500_000_000,  growthRate: 1.32, basePower: 60_000, maxLevel: 40,  unlockCost: 200_000_000 },
];

export const UPGRADES: UpgradeDef[] = [...CLICK_UPGRADES, ...PASSIVE_UPGRADES];

// ─── Persist key ───────────────────────────────────────────────────────
const STORAGE_KEY = '@kott_game_state';

// ─── Helpers ───────────────────────────────────────────────────────────
function calcCost(def: UpgradeDef, owned: number): number {
  return Math.floor(def.baseCost * Math.pow(def.growthRate, owned));
}

/** Prestige formula: golden plungers = cbrt(lifetimeCoins / 1 000 000) */
function calcPrestigeReward(lifetimeCoins: number): number {
  if (lifetimeCoins < 1_000_000) return 0;
  return Math.floor(Math.cbrt(lifetimeCoins / 1_000_000));
}

/** Each golden plunger gives +2% global multiplier. */
function prestigeMultiplier(goldenPlungers: number): number {
  return 1 + goldenPlungers * 0.02;
}

// ─── Store ─────────────────────────────────────────────────────────────
interface GameState {
  // Resources
  coins: number;
  totalEarned: number;      // resets on prestige
  lifetimeCoins: number;    // cumulative across prestiges

  // Power
  baseClickPower: number;
  basePassiveIncome: number;

  // Prestige
  goldenPlungers: number;
  timesPrestiged: number;

  // Poop boost
  poopBoostUntil: number;   // timestamp (ms) — 0 = no boost
  lastBoostDate: string;    // ISO date string e.g. '2026-03-07' — tracks once-per-day boost

  // Upgrades
  upgradeLevels: Record<string, number>;

  // Offline tracking
  lastTickTimestamp: number;

  // Whether state has been loaded from disk
  hydrated: boolean;

  // Whether offline progress was already processed this session
  offlineProcessed: boolean;

  // ── Computed getters ──
  getClickPower: () => number;
  getPassiveIncome: () => number;
  getGlobalMultiplier: () => number;
  isPoopBoosted: () => boolean;
  getBoostRemaining: () => number;
  getPrestigeReward: () => number;
  getUpgradeCost: (id: string) => number;
  getVisibleUpgrades: () => UpgradeDef[];

  // ── Actions ──
  tap: () => void;
  tick: () => void;
  buyUpgrade: (id: string) => boolean;
  prestige: () => void;
  triggerRealLifePoopBoost: () => boolean;  // returns true if boost was activated, false if already used today
  processOfflineProgress: () => { earned: number; seconds: number };
  reset: () => void;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
}

const INITIAL_STATE = {
  coins: 0,
  totalEarned: 0,
  lifetimeCoins: 0,
  baseClickPower: 1,
  basePassiveIncome: 0,
  goldenPlungers: 0,
  timesPrestiged: 0,
  poopBoostUntil: 0,
  lastBoostDate: '',
  upgradeLevels: {} as Record<string, number>,
  lastTickTimestamp: Date.now(),
  hydrated: false,
  offlineProcessed: false,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  // ── Computed ──────────────────────────────────────────────

  getGlobalMultiplier: () => {
    const s = get();
    const pMul = prestigeMultiplier(s.goldenPlungers);
    const boostMul = s.poopBoostUntil > Date.now() ? 2 : 1;
    return pMul * boostMul;
  },

  getClickPower: () => {
    const s = get();
    return Math.floor(s.baseClickPower * s.getGlobalMultiplier());
  },

  getPassiveIncome: () => {
    const s = get();
    return s.basePassiveIncome * s.getGlobalMultiplier();
  },

  isPoopBoosted: () => {
    return get().poopBoostUntil > Date.now();
  },

  getBoostRemaining: () => {
    const until = get().poopBoostUntil;
    if (until <= Date.now()) return 0;
    return Math.ceil((until - Date.now()) / 1000);
  },

  getPrestigeReward: () => {
    return calcPrestigeReward(get().lifetimeCoins);
  },

  getUpgradeCost: (id: string) => {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return Infinity;
    return calcCost(def, get().upgradeLevels[id] ?? 0);
  },

  getVisibleUpgrades: () => {
    const earned = get().totalEarned;
    return UPGRADES.filter((u) => earned >= u.unlockCost);
  },

  // ── Actions ───────────────────────────────────────────────

  tap: () => {
    const clickPower = get().getClickPower();
    set((s) => ({
      coins: s.coins + clickPower,
      totalEarned: s.totalEarned + clickPower,
      lifetimeCoins: s.lifetimeCoins + clickPower,
    }));
  },

  tick: () => {
    const passiveIncome = get().getPassiveIncome();
    if (passiveIncome <= 0) return;
    set((s) => ({
      coins: s.coins + passiveIncome,
      totalEarned: s.totalEarned + passiveIncome,
      lifetimeCoins: s.lifetimeCoins + passiveIncome,
      lastTickTimestamp: Date.now(),
    }));
  },

  buyUpgrade: (id: string) => {
    const state = get();
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return false;

    const owned = state.upgradeLevels[id] ?? 0;
    if (owned >= def.maxLevel) return false;

    const cost = calcCost(def, owned);
    if (state.coins < cost) return false;

    set((s) => ({
      coins: s.coins - cost,
      upgradeLevels: { ...s.upgradeLevels, [id]: owned + 1 },
      baseClickPower:
        def.type === 'click' ? s.baseClickPower + def.basePower : s.baseClickPower,
      basePassiveIncome:
        def.type === 'passive' ? s.basePassiveIncome + def.basePower : s.basePassiveIncome,
    }));

    return true;
  },

  prestige: () => {
    const state = get();
    const reward = calcPrestigeReward(state.lifetimeCoins);
    if (reward <= 0) return;

    set({
      coins: 0,
      totalEarned: 0,
      baseClickPower: 1,
      basePassiveIncome: 0,
      upgradeLevels: {},
      goldenPlungers: state.goldenPlungers + reward,
      timesPrestiged: state.timesPrestiged + 1,
      lastTickTimestamp: Date.now(),
      // lifetimeCoins persists across prestiges
    });
  },

  triggerRealLifePoopBoost: () => {
    const todayStr = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    if (get().lastBoostDate === todayStr) return false; // already boosted today

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const current = get().poopBoostUntil;
    const base = current > now ? current : now;
    set({ poopBoostUntil: base + oneHour, lastBoostDate: todayStr });
    return true;
  },

  processOfflineProgress: () => {
    const state = get();
    // Only process once per app session
    if (state.offlineProcessed) return { earned: 0, seconds: 0 };
    set({ offlineProcessed: true });
    const now = Date.now();
    const elapsed = now - state.lastTickTimestamp;
    const seconds = Math.min(Math.floor(elapsed / 1000), 8 * 3600); // max 8h
    if (seconds <= 0) return { earned: 0, seconds: 0 };

    // Offline earns at 50% passive rate (no poop boost offline)
    const offlineRate = state.basePassiveIncome * prestigeMultiplier(state.goldenPlungers) * 0.5;
    const earned = Math.floor(offlineRate * seconds);

    if (earned > 0) {
      set((s) => ({
        coins: s.coins + earned,
        totalEarned: s.totalEarned + earned,
        lifetimeCoins: s.lifetimeCoins + earned,
        lastTickTimestamp: now,
      }));
    } else {
      set({ lastTickTimestamp: now });
    }

    return { earned, seconds };
  },

  reset: () => set({ ...INITIAL_STATE, hydrated: true, offlineProcessed: true, lastTickTimestamp: Date.now() }),

  // ── Persistence ───────────────────────────────────────────

  hydrate: async () => {
    // Only hydrate once per app session
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          coins: data.coins ?? 0,
          totalEarned: data.totalEarned ?? 0,
          lifetimeCoins: data.lifetimeCoins ?? 0,
          baseClickPower: data.baseClickPower ?? 1,
          basePassiveIncome: data.basePassiveIncome ?? 0,
          goldenPlungers: data.goldenPlungers ?? 0,
          timesPrestiged: data.timesPrestiged ?? 0,
          poopBoostUntil: data.poopBoostUntil ?? 0,
          lastBoostDate: data.lastBoostDate ?? '',
          upgradeLevels: data.upgradeLevels ?? {},
          lastTickTimestamp: data.lastTickTimestamp ?? Date.now(),
          hydrated: true,
        });
      } else {
        set({ hydrated: true, lastTickTimestamp: Date.now() });
      }
    } catch {
      set({ hydrated: true, lastTickTimestamp: Date.now() });
    }
  },

  persist: async () => {
    try {
      const s = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          coins: s.coins,
          totalEarned: s.totalEarned,
          lifetimeCoins: s.lifetimeCoins,
          baseClickPower: s.baseClickPower,
          basePassiveIncome: s.basePassiveIncome,
          goldenPlungers: s.goldenPlungers,
          timesPrestiged: s.timesPrestiged,
          poopBoostUntil: s.poopBoostUntil,
          lastBoostDate: s.lastBoostDate,
          upgradeLevels: s.upgradeLevels,
          lastTickTimestamp: Date.now(),
        }),
      );
    } catch {
      // Silently fail — not critical
    }
  },
}));

// ── Global tick & persist (runs regardless of which tab is visible) ──

// Tick every second for passive income
setInterval(() => {
  const state = useGameStore.getState();
  if (state.hydrated) {
    state.tick();
  }
}, 1000);

// Persist every 30 seconds
setInterval(() => {
  const state = useGameStore.getState();
  if (state.hydrated) {
    state.persist();
  }
}, 30_000);

// Persist when app goes to background
AppState.addEventListener('change', (status) => {
  if (status === 'background' || status === 'inactive') {
    const state = useGameStore.getState();
    if (state.hydrated) {
      state.persist();
    }
  }
});