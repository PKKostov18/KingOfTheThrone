import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import { useColors } from '../../src/hooks/useColors';
import { useAuthStore } from '../../src/store/useAuthStore';
import { supabase } from '../../src/lib/supabase';
import { getLevelForPoops } from '../../src/constants/Levels';
import { getAvatarById } from '../../src/constants/Avatars';

// ─── Types ──────────────────────────────────────────────────────────────────

type Category = 'alltime' | 'weekly' | 'level';

interface RankedPlayer {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number;
  total_poops: number;
  score: number;
  levelTitle: string;
  levelEmoji: string;
  rank: number;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const CATEGORY_TABS: {
  key: Category;
  label: string;
  emoji: string;
  scoreLabel: (n: number) => string;
}[] = [
  { key: 'alltime', label: 'All‑Time',  emoji: '💩', scoreLabel: n => `${n} deposits` },
  { key: 'weekly',  label: 'This Week', emoji: '🔥', scoreLabel: n => `${n} this week` },
  { key: 'level',   label: 'Legends',   emoji: '👑', scoreLabel: n => `Level ${n}` },
];

const MEDALS = ['🥇', '🥈', '🥉'];
// Podium display order: left=2nd place, centre=1st place, right=3rd place
const PODIUM_DISPLAY_IDX = [1, 0, 2];
const PODIUM_HEIGHTS     = [85,  120, 65];
const PODIUM_AVATAR_SZ   = [52,  70,  44];
const PODIUM_COLORS      = ['#C0C0C0', '#FFD700', '#CD7F32'];

// ─── Avatar helper ───────────────────────────────────────────────────────────

function PlayerAvatar({
  player,
  size,
  bgColor,
}: {
  player: Pick<RankedPlayer, 'avatar_url'>;
  size: number;
  bgColor: string;
}) {
  const isPhoto = player.avatar_url?.startsWith('http');
  if (isPhoto) {
    return (
      <Image
        source={{ uri: player.avatar_url! }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }}
      />
    );
  }
  const emoji = getAvatarById(player.avatar_url ?? 'poop')?.emoji ?? '💩';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: Math.round(size * 0.52) }}>{emoji}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const C = useColors();
  const { user } = useAuthStore();

  const [category,   setCategory]   = useState<Category>('alltime');
  const [rankings,   setRankings]   = useState<RankedPlayer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Data fetchers ────────────────────────────────────────────

  const fetchAllTime = async (): Promise<RankedPlayer[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, level, total_poops')
      .order('total_poops', { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data.map((p, i) => {
      const lv = getLevelForPoops(p.total_poops ?? 0);
      return { ...p, score: p.total_poops ?? 0, levelTitle: lv.title, levelEmoji: lv.emoji, rank: i + 1 };
    });
  };

  const fetchWeekly = async (): Promise<RankedPlayer[]> => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: entries, error } = await supabase
      .from('entries')
      .select('user_id')
      .gte('created_at', sevenDaysAgo);
    if (error || !entries || entries.length === 0) return [];

    const counts: Record<string, number> = {};
    for (const e of entries) counts[e.user_id] = (counts[e.user_id] ?? 0) + 1;

    const topIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([id]) => id);

    const { data: profiles, error: pe } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, level, total_poops')
      .in('id', topIds);
    if (pe || !profiles) return [];

    return profiles
      .map(p => {
        const lv = getLevelForPoops(p.total_poops ?? 0);
        return { ...p, score: counts[p.id] ?? 0, levelTitle: lv.title, levelEmoji: lv.emoji, rank: 0 };
      })
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  };

  const fetchLegends = async (): Promise<RankedPlayer[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, level, total_poops')
      .order('level', { ascending: false })
      .order('total_poops', { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data.map((p, i) => {
      const lv = getLevelForPoops(p.total_poops ?? 0);
      return { ...p, score: p.level ?? 1, levelTitle: lv.title, levelEmoji: lv.emoji, rank: i + 1 };
    });
  };

  const load = useCallback(async () => {
    let data: RankedPlayer[] = [];
    if      (category === 'alltime') data = await fetchAllTime();
    else if (category === 'weekly')  data = await fetchWeekly();
    else                             data = await fetchLegends();
    setRankings(data);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [category]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ── Derived ──────────────────────────────────────────────────

  const top3       = rankings.slice(0, 3);
  const rest       = rankings.slice(3);
  const myProfile  = rankings.find(p => p.id === user?.id) ?? null;
  const currentTab = CATEGORY_TABS.find(t => t.key === category)!;

  const styles = useMemo(() => makeStyles(C), [C]);

  // ── Podium ───────────────────────────────────────────────────

  const PodiumSection = () => {
    if (top3.length === 0) return null;
    return (
      <View style={styles.podiumWrap}>
        <Text style={styles.sectionLabel}>ROYAL PODIUM</Text>
        <View style={styles.podiumRow}>
          {PODIUM_DISPLAY_IDX.map((srcIdx, dispIdx) => {
            const player   = top3[srcIdx] ?? null;
            const h        = PODIUM_HEIGHTS[dispIdx];
            const sz       = PODIUM_AVATAR_SZ[dispIdx];
            const col      = PODIUM_COLORS[dispIdx];
            const isCentre = dispIdx === 1;
            if (!player) return <View key={dispIdx} style={{ flex: 1 }} />;
            return (
              <View key={player.id} style={[styles.podiumSlot, isCentre && styles.podiumSlotCentre]}>
                <Text style={styles.podiumMedal}>{MEDALS[srcIdx]}</Text>
                <View
                  style={[
                    styles.podiumAvatarRing,
                    { width: sz + 6, height: sz + 6, borderRadius: (sz + 6) / 2, borderColor: col },
                  ]}
                >
                  <PlayerAvatar player={player} size={sz} bgColor={C.cardBgLight} />
                </View>
                <Text style={[styles.podiumName, { color: col }]} numberOfLines={1}>
                  {player.username ?? 'Unknown'}
                </Text>
                <Text style={[styles.podiumScore, { color: col }]}>
                  {currentTab.scoreLabel(player.score)}
                </Text>
                <View style={[styles.podiumPillar, { height: h, backgroundColor: col }]} />
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ── Rank row ─────────────────────────────────────────────────

  const renderItem = ({ item }: { item: RankedPlayer }) => {
    const isMe = item.id === user?.id;
    return (
      <View style={[styles.rankRow, isMe && styles.rankRowMe]}>
        <View style={[styles.rankBadge, isMe && styles.rankBadgeMe]}>
          <Text style={[styles.rankNum, isMe && styles.rankNumMe]}>{item.rank}</Text>
        </View>
        <PlayerAvatar player={item} size={44} bgColor={C.cardBgLight} />
        <View style={styles.rankInfo}>
          <Text style={[styles.rankName, isMe && styles.rankNameMe]} numberOfLines={1}>
            {item.username ?? 'Unknown'}{isMe ? '  (You)' : ''}
          </Text>
          <Text style={styles.rankTitle} numberOfLines={1}>
            {item.levelEmoji}  {item.levelTitle}
          </Text>
        </View>
        <View style={styles.rankScoreCol}>
          <Text style={[styles.rankScore, isMe && styles.rankScoreMe]}>{item.score}</Text>
          <Text style={styles.rankUnit}>
            {category === 'level' ? 'lvl' : category === 'weekly' ? '/wk' : 'total'}
          </Text>
        </View>
      </View>
    );
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👑 Royal Rankings</Text>
        <Text style={styles.headerSub}>Who rules the throne?</Text>
      </View>

      {/* ── Category tabs ── */}
      <View style={styles.tabBar}>
        {CATEGORY_TABS.map(tab => {
          const active = category === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setCategory(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={styles.loadingText}>Consulting the royal records…</Text>
        </View>
      ) : rankings.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 56 }}>💩</Text>
          <Text style={styles.emptyTitle}>No rankings yet</Text>
          <Text style={styles.emptySub}>Be the first to claim the throne!</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={rest}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListHeaderComponent={<PodiumSection />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.gold}
                colors={[C.gold]}
              />
            }
          />
        </Animated.View>
      )}

      {/* ── My rank bar ── */}
      {!loading && user && (
        <View style={styles.myBar}>
          {myProfile ? (
            <>
              <Text style={styles.myBarRank}>
                {myProfile.rank <= 3 ? MEDALS[myProfile.rank - 1] : `#${myProfile.rank}`}
              </Text>
              <View style={{ marginRight: 10 }}>
                <PlayerAvatar player={myProfile} size={36} bgColor={C.cardBgLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.myBarName} numberOfLines={1}>
                  {myProfile.username ?? 'You'}
                </Text>
                <Text style={styles.myBarTitle} numberOfLines={1}>
                  {myProfile.levelEmoji}  {myProfile.levelTitle}
                </Text>
              </View>
              <Text style={styles.myBarScore}>
                {currentTab.scoreLabel(myProfile.score)}
              </Text>
            </>
          ) : (
            <Text style={styles.myBarNotRanked}>
              Not in the top 100 yet — keep going! 💪
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.darkBg,
    },

    // Header
    header: {
      paddingTop: 54,
      paddingBottom: 14,
      paddingHorizontal: 20,
      backgroundColor: C.cardBg,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    headerTitle: {
      color: C.gold,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    headerSub: {
      color: C.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },

    // Tabs
    tabBar: {
      flexDirection: 'row',
      backgroundColor: C.cardBg,
      paddingHorizontal: 12,
      paddingBottom: 12,
      gap: 8,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: C.darkBg,
      borderWidth: 1,
      borderColor: C.border,
    },
    tabBtnActive: {
      backgroundColor: C.cardBgLight,
      borderColor: C.gold,
    },
    tabEmoji: {
      fontSize: 14,
    },
    tabLabel: {
      color: C.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    tabLabelActive: {
      color: C.gold,
    },

    // Loading / empty
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      color: C.textSecondary,
      fontSize: 14,
      marginTop: 8,
    },
    emptyTitle: {
      color: C.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    emptySub: {
      color: C.textSecondary,
      fontSize: 14,
    },

    // Podium
    podiumWrap: {
      paddingTop: 20,
      paddingBottom: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    sectionLabel: {
      color: C.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: 16,
    },
    podiumRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      width: '100%',
      justifyContent: 'center',
      gap: 8,
    },
    podiumSlot: {
      flex: 1,
      alignItems: 'center',
    },
    podiumSlotCentre: {
      flex: 1.15,
    },
    podiumMedal: {
      fontSize: 22,
      marginBottom: 6,
    },
    podiumAvatarRing: {
      borderWidth: 2.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    podiumName: {
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 2,
    },
    podiumScore: {
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 6,
    },
    podiumPillar: {
      width: '100%',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      opacity: 0.35,
    },

    // Rank rows
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 80,
    },
    rankRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBg,
      borderRadius: 12,
      marginBottom: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: C.border,
      gap: 12,
    },
    rankRowMe: {
      borderColor: C.gold,
      backgroundColor: C.cardBgLight,
    },
    rankBadge: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: C.cardBgLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankBadgeMe: {
      backgroundColor: C.gold,
    },
    rankNum: {
      color: C.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    rankNumMe: {
      color: C.darkBg,
    },
    rankInfo: {
      flex: 1,
      gap: 2,
    },
    rankName: {
      color: C.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    rankNameMe: {
      color: C.gold,
    },
    rankTitle: {
      color: C.textSecondary,
      fontSize: 12,
    },
    rankScoreCol: {
      alignItems: 'flex-end',
    },
    rankScore: {
      color: C.textPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    rankScoreMe: {
      color: C.gold,
    },
    rankUnit: {
      color: C.textMuted,
      fontSize: 10,
      fontWeight: '600',
    },

    // My rank bar
    myBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBg,
      borderTopWidth: 1.5,
      borderTopColor: C.gold,
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 10,
    },
    myBarRank: {
      fontSize: 22,
      minWidth: 36,
      textAlign: 'center',
    },
    myBarName: {
      color: C.gold,
      fontSize: 13,
      fontWeight: '700',
    },
    myBarTitle: {
      color: C.textSecondary,
      fontSize: 11,
    },
    myBarScore: {
      color: C.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    myBarNotRanked: {
      color: C.textSecondary,
      fontSize: 13,
      flex: 1,
      textAlign: 'center',
    },
  });
}
