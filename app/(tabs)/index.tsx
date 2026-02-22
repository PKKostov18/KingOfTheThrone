import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Vibration,
  Alert,
  AppState,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '../../src/hooks/useColors';
import { useGameStore, UPGRADES, type UpgradeDef } from '../../src/store/useGameStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { getAvatarById } from '../../src/constants/Avatars';

// ─── Number formatter ──────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1) + 'T';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 10_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}

function fmtTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Floating Text Component ───────────────────────────────────
function FloatingText({ value, color }: { value: string; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: 24,
        fontWeight: '900',
        color,
        opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] }),
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -90] }) },
          { scale: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 1.3, 0.8] }) },
        ],
      }}
    >
      {value}
    </Animated.Text>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function EmpireScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const game = useGameStore();
  const { profile } = useAuthStore();

  // Get avatar
  const avatarUrl = profile?.avatar_url;
  const isPhotoAvatar = avatarUrl?.startsWith('http') ?? false;
  const avatarEmoji = useMemo(() => {
    if (isPhotoAvatar) return '💩';
    const id = avatarUrl ?? 'poop';
    return getAvatarById(id)?.emoji ?? '💩';
  }, [avatarUrl, isPhotoAvatar]);

  // Floating +X texts
  const [floaters, setFloaters] = useState<{ id: number; value: string }[]>([]);
  const floatId = useRef(0);

  // Boost timer display
  const [boostSec, setBoostSec] = useState(game.getBoostRemaining());

  // Hydrate game state from disk on mount
  useEffect(() => {
    game.hydrate();
  }, []);

  // Process offline progress after hydration
  useEffect(() => {
    if (!game.hydrated) return;
    const { earned, seconds } = game.processOfflineProgress();
    if (earned > 0 && seconds > 60) {
      Alert.alert(
        '💰 Welcome Back!',
        `Your empire earned $${fmt(earned)} while you were away (${fmtTime(seconds)})`,
      );
    }
  }, [game.hydrated]);

  // Passive income tick every second + persist every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      game.tick();
      setBoostSec(game.getBoostRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const persistInterval = setInterval(() => game.persist(), 30_000);
    return () => clearInterval(persistInterval);
  }, []);

  // Save on background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        game.persist();
      }
    });
    return () => sub.remove();
  }, []);

  // Toilet tap animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleTap = useCallback(() => {
    game.tap();
    Vibration.vibrate(15);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
    ]).start();

    const id = ++floatId.current;
    const cp = game.getClickPower();
    setFloaters((prev) => [...prev.slice(-4), { id, value: `+${fmt(cp)}` }]);
    setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 850);
  }, [game, scaleAnim]);

  const handlePrestige = () => {
    const reward = game.getPrestigeReward();
    if (reward <= 0) {
      Alert.alert('Not Yet!', 'You need at least $1M lifetime coins to prestige.');
      return;
    }
    Alert.alert(
      '🪠 Flush the Empire?',
      `Reset all upgrades & coins.\nGain ${reward} Golden Plunger${reward > 1 ? 's' : ''} (+${reward * 2}% permanent bonus).\n\nThis cannot be undone!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'FLUSH IT!',
          style: 'destructive',
          onPress: () => {
            game.prestige();
            game.persist();
          },
        },
      ],
    );
  };

  const visibleUpgrades = game.getVisibleUpgrades();
  const clickUpgrades = visibleUpgrades.filter((u) => u.type === 'click');
  const passiveUpgrades = visibleUpgrades.filter((u) => u.type === 'passive');
  const multiplier = game.getGlobalMultiplier();
  const prestigeReward = game.getPrestigeReward();
  const isBoosted = game.isPoopBoosted();

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/profile' as any)}
          activeOpacity={0.7}
        >
          {isPhotoAvatar ? (
            <Image source={{ uri: avatarUrl! }} style={styles.profilePhoto} />
          ) : (
            <Text style={styles.profileEmoji}>{avatarEmoji}</Text>
          )}
          <Text style={styles.profileCrown}>👑</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🏰 Bathroom Empire</Text>
        </View>

        <TouchableOpacity onPress={handlePrestige} activeOpacity={0.7} style={styles.prestigeBtn}>
          <Text style={styles.prestigeIcon}>🪠</Text>
          <Text style={styles.prestigeCount}>{game.goldenPlungers}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Multiplier / Boost Bar ── */}
      <View style={styles.boostBar}>
        <Text style={styles.multiplierText}>
          ×{multiplier.toFixed(2)} multiplier
        </Text>
        {game.goldenPlungers > 0 && (
          <Text style={styles.plungerInfo}>🪠 {game.goldenPlungers} (+{game.goldenPlungers * 2}%)</Text>
        )}
        {isBoosted && (
          <View style={styles.boostChip}>
            <Text style={styles.boostChipText}>💩 2× POOP BOOST — {fmtTime(boostSec)}</Text>
          </View>
        )}
      </View>

      {/* ── Coin Display ── */}
      <View style={styles.coinBar}>
        <Text style={styles.coinAmount}>$ {fmt(game.coins)}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statChip}>👆 {fmt(game.getClickPower())}/tap</Text>
          <Text style={styles.statChip}>⏱️ {fmt(game.getPassiveIncome())}/sec</Text>
        </View>
      </View>

      {/* ── Golden Toilet ── */}
      <View style={styles.toiletArea}>
        <View style={styles.floaterContainer}>
          {floaters.map((f) => (
            <FloatingText key={f.id} value={f.value} color={C.gold} />
          ))}
        </View>

        <TouchableOpacity onPress={handleTap} activeOpacity={0.85}>
          <Animated.View style={[styles.toiletOuter, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.toiletInner}>
              <Text style={styles.toiletEmoji}>🚽</Text>
              <Text style={styles.toiletCrown}>👑</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.tapHint}>TAP THE THRONE!</Text>
      </View>

      {/* ── Prestige banner ── */}
      {prestigeReward > 0 && (
        <TouchableOpacity style={styles.prestigeBanner} onPress={handlePrestige} activeOpacity={0.8}>
          <Text style={styles.prestigeBannerText}>
            🪠 FLUSH FOR {prestigeReward} GOLDEN PLUNGER{prestigeReward > 1 ? 'S' : ''}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Upgrades ── */}
      <View style={styles.upgradesContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.upgradesList}>
          {clickUpgrades.length > 0 && (
            <Text style={styles.upgradeSection}>👆 TAP POWER</Text>
          )}
          {clickUpgrades.map((u) => {
            const owned = game.upgradeLevels[u.id] ?? 0;
            const cost = game.getUpgradeCost(u.id);
            return (
              <UpgradeCard
                key={u.id}
                def={u}
                owned={owned}
                cost={cost}
                canAfford={game.coins >= cost && owned < u.maxLevel}
                maxed={owned >= u.maxLevel}
                onBuy={() => game.buyUpgrade(u.id)}
                C={C}
                styles={styles}
              />
            );
          })}

          {passiveUpgrades.length > 0 && (
            <Text style={[styles.upgradeSection, { marginTop: 16 }]}>⏱️ PASSIVE INCOME</Text>
          )}
          {passiveUpgrades.map((u) => {
            const owned = game.upgradeLevels[u.id] ?? 0;
            const cost = game.getUpgradeCost(u.id);
            return (
              <UpgradeCard
                key={u.id}
                def={u}
                owned={owned}
                cost={cost}
                canAfford={game.coins >= cost && owned < u.maxLevel}
                maxed={owned >= u.maxLevel}
                onBuy={() => game.buyUpgrade(u.id)}
                C={C}
                styles={styles}
              />
            );
          })}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Upgrade Card ──────────────────────────────────────────────
function UpgradeCard({
  def,
  owned,
  cost,
  canAfford,
  maxed,
  onBuy,
  C,
  styles,
}: {
  def: UpgradeDef;
  owned: number;
  cost: number;
  canAfford: boolean;
  maxed: boolean;
  onBuy: () => void;
  C: any;
  styles: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.upgradeCard, !canAfford && !maxed && styles.upgradeCardLocked, maxed && styles.upgradeCardMaxed]}
      onPress={maxed ? undefined : onBuy}
      activeOpacity={canAfford ? 0.7 : 1}
    >
      <Text style={styles.upgradeEmoji}>{def.emoji}</Text>
      <View style={styles.upgradeInfo}>
        <Text style={[styles.upgradeName, !canAfford && !maxed && styles.upgradeTextLocked]}>
          {def.name}
        </Text>
        <Text style={[styles.upgradeDesc, !canAfford && !maxed && styles.upgradeTextLocked]}>
          {def.description}
        </Text>
      </View>
      <View style={styles.upgradeRight}>
        {maxed ? (
          <Text style={[styles.upgradeCost, { color: C.successGreen }]}>MAX</Text>
        ) : (
          <Text style={[styles.upgradeCost, canAfford ? { color: C.gold } : { color: C.textMuted }]}>
            $ {fmt(cost)}
          </Text>
        )}
        {owned > 0 && (
          <View style={[styles.ownedBadge, maxed && { backgroundColor: 'rgba(76,175,80,0.15)' }]}>
            <Text style={[styles.ownedText, maxed && { color: C.successGreen }]}>
              Lv.{owned}{maxed ? '' : `/${def.maxLevel}`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────
function makeStyles(C: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: C.darkBg,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 54,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    profileButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.cardBg,
      borderWidth: 2,
      borderColor: C.gold,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileEmoji: { fontSize: 20 },
    profilePhoto: { width: 40, height: 40, borderRadius: 20 },
    profileCrown: { fontSize: 10, position: 'absolute', top: -2 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: C.gold, letterSpacing: 1 },
    prestigeBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.cardBg,
      borderWidth: 2,
      borderColor: C.goldDark,
      justifyContent: 'center',
      alignItems: 'center',
    },
    prestigeIcon: { fontSize: 18 },
    prestigeCount: { fontSize: 9, fontWeight: '900', color: C.gold, position: 'absolute', bottom: 2 },

    // Boost bar
    boostBar: {
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    multiplierText: {
      color: C.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    plungerInfo: {
      color: C.goldDark,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 1,
    },
    boostChip: {
      backgroundColor: 'rgba(76,175,80,0.2)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginTop: 4,
    },
    boostChipText: {
      color: '#4CAF50',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    // Coin bar
    coinBar: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    coinAmount: {
      fontSize: 34,
      fontWeight: '900',
      color: C.gold,
      letterSpacing: 2,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 2,
    },
    statChip: {
      color: C.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },

    // Golden toilet
    toiletArea: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    floaterContainer: {
      position: 'absolute',
      top: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    toiletOuter: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: C.goldMuted,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: C.gold,
      elevation: 20,
      shadowColor: C.gold,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
    },
    toiletInner: {
      width: 124,
      height: 124,
      borderRadius: 62,
      backgroundColor: C.cardBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: C.goldDark,
    },
    toiletEmoji: { fontSize: 52 },
    toiletCrown: { fontSize: 26, position: 'absolute', top: 6 },
    tapHint: {
      color: C.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 3,
      marginTop: 6,
    },

    // Prestige banner
    prestigeBanner: {
      marginHorizontal: 16,
      marginBottom: 6,
      backgroundColor: 'rgba(255, 215, 0, 0.12)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.gold,
      paddingVertical: 10,
      alignItems: 'center',
    },
    prestigeBannerText: {
      color: C.gold,
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 1,
    },

    // Upgrades container
    upgradesContainer: {
      flex: 1,
      backgroundColor: C.cardBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderTopWidth: 2,
      borderColor: C.border,
      marginTop: 4,
    },
    upgradesList: {
      padding: 16,
    },
    upgradeSection: {
      color: C.textSecondary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 2,
      marginBottom: 10,
      marginTop: 4,
    },

    // Upgrade card
    upgradeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBgLight,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    upgradeCardLocked: {
      opacity: 0.5,
    },
    upgradeCardMaxed: {
      opacity: 0.7,
      borderColor: C.successGreen,
      borderWidth: 1,
    },
    upgradeEmoji: {
      fontSize: 32,
      width: 46,
      textAlign: 'center',
    },
    upgradeInfo: {
      flex: 1,
      marginLeft: 10,
    },
    upgradeName: {
      color: C.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    upgradeDesc: {
      color: C.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    upgradeTextLocked: {
      color: C.textMuted,
    },
    upgradeRight: {
      alignItems: 'flex-end',
      marginLeft: 8,
    },
    upgradeCost: {
      fontSize: 15,
      fontWeight: '800',
    },
    ownedBadge: {
      backgroundColor: C.goldMuted,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 4,
    },
    ownedText: {
      color: C.gold,
      fontSize: 11,
      fontWeight: '800',
    },
  });
}
