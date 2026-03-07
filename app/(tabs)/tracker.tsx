import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useColors } from '../../src/hooks/useColors';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useGameStore } from '../../src/store/useGameStore';
import { supabase } from '../../src/lib/supabase';
import { playSfx } from '../../src/lib/sounds';

interface EntryRow {
  id: string;
  created_at: string;
  description: string | null;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function TrackerScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user, profile, fetchProfile } = useAuthStore();
  const { triggerRealLifePoopBoost, isPoopBoosted, getBoostRemaining, persist } = useGameStore();

  const [logging, setLogging] = useState(false);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('entries')
        .select('id, created_at, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setEntries((data as EntryRow[]) ?? []);
    } catch {
      // silent
    } finally {
      setLoadingEntries(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
  };

  const todayEntries = entries.filter((e) => isToday(e.created_at));
  const pastEntries = entries.filter((e) => !isToday(e.created_at));

  // Group past entries by date
  const groupedPast = useMemo(() => {
    const groups: Record<string, EntryRow[]> = {};
    for (const e of pastEntries) {
      const key = formatDate(e.created_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }
    return Object.entries(groups);
  }, [pastEntries]);

  const handleLog = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to log a deposit.');
      return;
    }

    setLogging(true);

    try {
      const { error } = await supabase.from('entries').insert({
        user_id: user.id,
        duration_seconds: 0,
        bristol_scale: 4,
        fun_rating: 3,
        description: 'Quick log',
      });

      if (error) throw error;

      // Bump total_poops
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_poops')
        .eq('id', user.id)
        .single();

      const newPoops = (profileData?.total_poops ?? 0) + 1;

      await supabase
        .from('profiles')
        .update({ total_poops: newPoops })
        .eq('id', user.id);

      await fetchProfile();

      // Trigger game boost (once per day)
      const boosted = triggerRealLifePoopBoost();
      persist();

      playSfx('poop');

      // Refresh entries
      await fetchEntries();

      if (boosted) {
        Alert.alert(
          '💩 Royal Deposit + 🚀 BOOST!',
          `Deposit #${newPoops} recorded.\n2× coin boost activated for 1 hour!\nKeep building your empire!`,
        );
      } else {
        Alert.alert(
          '💩 Royal Deposit Logged!',
          `Deposit #${newPoops} recorded.\nYou already used your daily boost today — come back tomorrow for another!`,
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to log deposit.');
    } finally {
      setLogging(false);
    }
  };

  const boosted = isPoopBoosted();
  const boostSec = getBoostRemaining();
  const boostMin = Math.ceil(boostSec / 60);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />
        }
      >
        <Text style={styles.title}>💩 Quick Log</Text>
        <Text style={styles.subtitle}>Log a deposit to get a 2× coin boost!</Text>

        {/* Boost status */}
        {boosted && (
          <View style={styles.boostCard}>
            <Text style={styles.boostEmoji}>🚀</Text>
            <View style={styles.boostInfo}>
              <Text style={styles.boostTitle}>2× POOP BOOST ACTIVE</Text>
              <Text style={styles.boostTime}>{boostMin} min remaining</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>💩</Text>
            <Text style={styles.statNum}>{profile?.total_poops ?? 0}</Text>
            <Text style={styles.statLabel}>Total Deposits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.statNum}>{todayEntries.length}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* BIG BUTTON */}
        <TouchableOpacity
          style={styles.bigButton}
          onPress={handleLog}
          disabled={logging}
          activeOpacity={0.8}
        >
          <View style={styles.bigButtonInner}>
            {logging ? (
              <ActivityIndicator size="large" color="#1B0E07" />
            ) : (
              <>
                <Text style={styles.bigButtonEmoji}>💩</Text>
                <Text style={styles.bigButtonText}>I POOPED!</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {boosted ? '🚀 Boost active! Log again to extend it' : '⚡ Tap to log + activate 2× boost'}
        </Text>

        {/* ── Today's Entries ── */}
        {todayEntries.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>📅 Today</Text>
            {todayEntries.map((e) => (
              <View key={e.id} style={styles.historyRow}>
                <Text style={styles.historyEmoji}>💩</Text>
                <Text style={styles.historyTime}>{formatTime(e.created_at)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Past Entries ── */}
        {groupedPast.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>📜 History</Text>
            {groupedPast.map(([date, items]) => (
              <View key={date} style={styles.historyGroup}>
                <Text style={styles.historyDate}>{date} — {items.length} deposit{items.length !== 1 ? 's' : ''}</Text>
                {items.map((e) => (
                  <View key={e.id} style={styles.historyRow}>
                    <Text style={styles.historyEmoji}>💩</Text>
                    <Text style={styles.historyTime}>{formatTime(e.created_at)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {loadingEntries && (
          <ActivityIndicator size="small" color={C.gold} style={{ marginTop: 20 }} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: C.darkBg,
    },
    scrollContent: {
      alignItems: 'center',
      padding: 24,
      paddingTop: 64,
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: C.gold,
      letterSpacing: 1,
      marginBottom: 6,
    },
    subtitle: {
      color: C.textSecondary,
      fontSize: 14,
      marginBottom: 16,
      textAlign: 'center',
    },

    // Boost card
    boostCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(76,175,80,0.15)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
      width: '100%',
      borderWidth: 1,
      borderColor: '#4CAF50',
    },
    boostEmoji: { fontSize: 28, marginRight: 12 },
    boostInfo: { flex: 1 },
    boostTitle: { color: '#4CAF50', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    boostTime: { color: '#81C784', fontSize: 12, fontWeight: '700', marginTop: 2 },

    // Stats
    statsCard: {
      flexDirection: 'row',
      backgroundColor: C.cardBg,
      borderRadius: 18,
      padding: 20,
      marginBottom: 24,
      gap: 32,
      borderWidth: 1,
      borderColor: C.border,
    },
    statItem: { alignItems: 'center' },
    statEmoji: { fontSize: 24, marginBottom: 4 },
    statNum: { fontSize: 26, fontWeight: '900', color: C.gold },
    statLabel: { fontSize: 11, color: C.textMuted, marginTop: 2, fontWeight: '600' },

    // Button
    bigButton: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: C.goldMuted,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 20,
      shadowColor: C.gold,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    },
    bigButtonInner: {
      width: 156,
      height: 156,
      borderRadius: 78,
      backgroundColor: C.gold,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: C.goldDark,
    },
    bigButtonEmoji: { fontSize: 48 },
    bigButtonText: {
      fontSize: 16,
      fontWeight: '900',
      color: C.darkBg,
      letterSpacing: 2,
      marginTop: 4,
    },
    hint: {
      color: C.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 24,
      letterSpacing: 0.5,
      textAlign: 'center',
    },

    // History
    historySection: {
      width: '100%',
      marginTop: 8,
    },
    historySectionTitle: {
      color: C.textSecondary,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 10,
    },
    historyGroup: {
      marginBottom: 12,
    },
    historyDate: {
      color: C.textMuted,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 6,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBg,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: C.border,
    },
    historyEmoji: { fontSize: 18, marginRight: 12 },
    historyTime: { color: C.textSecondary, fontSize: 14, fontWeight: '700' },
  });
}
