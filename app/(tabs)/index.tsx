import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../src/store/useSessionStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import BigRedButton from '../../src/components/BigRedButton';
import { supabase } from '../../src/lib/supabase';
import { BRISTOL_SCALE, FUN_RATINGS } from '../../src/constants/BristolScale';
import { useColors } from '../../src/hooks/useColors';
import { getLevelForPoops, getNextLevel, getLevelProgress, getPoopsToNextLevel } from '../../src/constants/Levels';
import { getBadgesForLevel, checkMilestoneBadges, getBadgeById } from '../../src/constants/Badges';

export default function HomeScreen() {
  const router = useRouter();
  const { isActive, startTime, startSession, endSession } = useSessionStore();
  const { user, profile, fetchProfile } = useAuthStore();
  const [elapsed, setElapsed] = useState(0);
  const C = useColors();

  // Modal for Bristol Scale + Fun Rating after stop
  const [showModal, setShowModal] = useState(false);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [selectedBristol, setSelectedBristol] = useState(4);
  const [selectedFun, setSelectedFun] = useState(3);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor(
          (now.getTime() - new Date(startTime).getTime()) / 1000
        );
        setElapsed(diffInSeconds);
      }, 1000);
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Button press handler
  const handlePress = () => {
    if (!isActive) {
      startSession();
    } else {
      if (!startTime) return;

      const endTime = new Date();
      const durationSeconds = Math.floor(
        (endTime.getTime() - new Date(startTime).getTime()) / 1000
      );

      setPendingDuration(durationSeconds);
      setSelectedBristol(4);
      setSelectedFun(3);
      setDescription('');
      setShowModal(true);
    }
  };

  // Award badges helper
  const awardBadges = async (badgeIds: string[], userId: string) => {
    if (badgeIds.length === 0) return [];

    // Fetch already-earned badges
    const { data: existing } = await supabase
      .from('achievements')
      .select('badge_name')
      .eq('user_id', userId)
      .in('badge_name', badgeIds);

    const alreadyEarned = new Set((existing ?? []).map((a: any) => a.badge_name));
    const newBadgeIds = badgeIds.filter((id) => !alreadyEarned.has(id));

    if (newBadgeIds.length === 0) return [];

    const rows = newBadgeIds.map((badge_name) => ({
      user_id: userId,
      badge_name,
      unlocked_at: new Date().toISOString(),
    }));

    await supabase.from('achievements').insert(rows);
    return newBadgeIds;
  };

  // Save entry to Supabase
  const handleSaveEntry = async () => {
    if (!user) {
      Alert.alert('Error', 'No user logged in!');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('entries').insert({
        user_id: user.id,
        duration_seconds: pendingDuration,
        bristol_scale: selectedBristol,
        fun_rating: selectedFun,
        description: description.trim() || null,
      });

      if (error) throw error;

      // Update total_poops in profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_poops, level')
        .eq('id', user.id)
        .single();

      const oldPoops = profileData?.total_poops || 0;
      const newPoops = oldPoops + 1;
      const oldLevel = profileData?.level || 1;
      const newLevelConfig = getLevelForPoops(newPoops);
      const newLevel = newLevelConfig.level;
      const didLevelUp = newLevel > oldLevel;

      await supabase
        .from('profiles')
        .update({ total_poops: newPoops, level: newLevel })
        .eq('id', user.id);

      // --- Badge awarding ---
      const badgesToCheck: string[] = [];

      // Level badges
      if (didLevelUp) {
        for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
          const levelBadges = getBadgesForLevel(lvl);
          badgesToCheck.push(...levelBadges.map((b) => b.id));
        }
      }

      // First poop badge
      if (newPoops === 1) {
        badgesToCheck.push('first_flush');
      }

      // Milestone badges
      const milestones = checkMilestoneBadges(
        pendingDuration,
        selectedBristol,
        selectedFun,
        newPoops,
      );
      badgesToCheck.push(...milestones);

      const newlyEarned = await awardBadges(badgesToCheck, user.id);
      const badgeText = newlyEarned.length > 0
        ? `\n\n🏅 New badge${newlyEarned.length > 1 ? 's' : ''}: ${newlyEarned.map((id) => {
            const b = getBadgeById(id);
            return b ? `${b.emoji} ${b.name}` : id;
          }).join(', ')}`
        : '';

      // Reload profile for updated stats
      await fetchProfile();

      if (didLevelUp) {
        Alert.alert(
          `🎉 LEVEL UP! Level ${newLevel}! 🎉`,
          `You are now: ${newLevelConfig.emoji} ${newLevelConfig.title}!\n\n🎁 Reward: ${newLevelConfig.rewardEmoji} ${newLevelConfig.reward}\n\nSession: ${formatTime(pendingDuration)} ${BRISTOL_SCALE[selectedBristol - 1].emoji}${badgeText}`,
        );
      } else {
        const remaining = getPoopsToNextLevel(newPoops);
        Alert.alert(
          'Royal Deposit! 💩👑',
          `Session recorded: ${formatTime(pendingDuration)}\n${BRISTOL_SCALE[selectedBristol - 1].emoji} ${BRISTOL_SCALE[selectedBristol - 1].name}\nRating: ${FUN_RATINGS[selectedFun - 1].emoji}${remaining !== null ? `\n\n${remaining} more to next level!` : ''}${badgeText}`,
        );
      }
    } catch (error: any) {
      Alert.alert('Save Error', error.message);
    } finally {
      setSaving(false);
      setShowModal(false);
      endSession();
    }
  };

  const handleCancelEntry = () => {
    setShowModal(false);
    endSession();
  };

  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={styles.screen}>
      {/* Profile Button */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => router.push('/profile' as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.profileEmoji}>💩</Text>
        <Text style={styles.profileCrown}>👑</Text>
      </TouchableOpacity>

      {/* Floating deco emojis */}
      <Text style={[styles.decoEmoji, { top: 60, left: 20 }]}>💩</Text>
      <Text style={[styles.decoEmoji, { top: 90, right: 30 }]}>🚽</Text>
      <Text style={[styles.decoEmoji, { bottom: 120, left: 40 }]}>📰</Text>
      <Text style={[styles.decoEmoji, { bottom: 140, right: 25 }]}>🧻</Text>
      <Text style={[styles.decoEmoji, { top: 160, left: 60 }]}>👑</Text>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.crownEmoji}>👑</Text>
        <Text style={styles.titleText}>King of the Throne</Text>
        <Text style={styles.subtitleText}>
          {isActive ? '🚽 Royal session in progress...' : 'Ready to claim your throne?'}
        </Text>
        {profile && (() => {
          const totalPoops = profile.total_poops ?? 0;
          const levelConfig = getLevelForPoops(totalPoops);
          const progress = getLevelProgress(totalPoops);
          const remaining = getPoopsToNextLevel(totalPoops);
          const nextLevel = getNextLevel(levelConfig.level);
          return (
            <>
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>
                  {levelConfig.emoji} {levelConfig.title}  •  Level {levelConfig.level}
                </Text>
              </View>
              <View style={styles.xpBarContainer}>
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, { width: `${Math.round(progress * 100)}%` as any }]} />
                </View>
                <Text style={styles.xpText}>
                  {remaining !== null
                    ? `💩 ${totalPoops} / ${nextLevel?.requiredPoops} (${remaining} to go)`
                    : `💩 ${totalPoops} — MAX LEVEL! 👑`}
                </Text>
              </View>
            </>
          );
        })()}
      </View>

      {/* Button */}
      <BigRedButton isActive={isActive} onPress={handlePress} />

      {/* Timer */}
      {isActive && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>⏱️ TIME ON THRONE</Text>
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      )}

      {/* ======= MODAL: Bristol + Rating + Note ======= */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>💩 Rate Your Royal Deposit</Text>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                  🕐 {formatTime(pendingDuration)}
                </Text>
              </View>

              {/* Bristol Scale */}
              <Text style={styles.sectionLabel}>🔬 Type (Bristol Scale)</Text>
              <View style={styles.optionRow}>
                {BRISTOL_SCALE.map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    onPress={() => setSelectedBristol(item.type)}
                    style={[
                      styles.bristolOption,
                      selectedBristol === item.type && styles.bristolSelected,
                    ]}
                  >
                    <Text style={styles.bristolEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.bristolLabel,
                        selectedBristol === item.type && styles.bristolLabelSelected,
                      ]}
                    >
                      {item.type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.bristolDesc}>
                {BRISTOL_SCALE[selectedBristol - 1].description}
              </Text>

              {/* Fun Rating */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
                ⭐ Experience Rating
              </Text>
              <View style={styles.optionRow}>
                {FUN_RATINGS.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => setSelectedFun(item.value)}
                    style={[
                      styles.funOption,
                      selectedFun === item.value && styles.funSelected,
                    ]}
                  >
                    <Text style={styles.funEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.funLabel,
                        selectedFun === item.value && styles.funLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Note */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
                📝 Royal Notes (optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="E.g. 'That spicy food was a mistake...'"
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={3}
                style={styles.noteInput}
              />

              {/* Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={handleSaveEntry}
                  disabled={saving}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveText}>
                    {saving ? '⏳ Flushing...' : '👑 Log Royal Deposit'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancelEntry}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Discard</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: C.darkBg,
    },
    profileButton: {
      position: 'absolute',
      top: 52,
      right: 20,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: C.cardBg,
      borderWidth: 2,
      borderColor: C.gold,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      elevation: 8,
      shadowColor: C.gold,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    profileEmoji: { fontSize: 22 },
    profileCrown: { fontSize: 12, position: 'absolute', top: -2 },
    decoEmoji: { position: 'absolute', fontSize: 28, opacity: 0.15 },
    titleContainer: { position: 'absolute', top: 64, alignItems: 'center' },
    crownEmoji: { fontSize: 40, marginBottom: 4 },
    titleText: { fontSize: 28, fontWeight: '900', color: C.gold, letterSpacing: 1 },
    subtitleText: { color: C.textSecondary, marginTop: 6, fontSize: 14 },
    streakBadge: {
      marginTop: 12,
      backgroundColor: C.goldMuted,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    streakText: { color: C.textSecondary, fontSize: 12, fontWeight: '600' },
    xpBarContainer: { marginTop: 10, alignItems: 'center', width: 220 },
    xpBarBg: { width: '100%', height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
    xpBarFill: { height: '100%', borderRadius: 4, backgroundColor: C.gold },
    xpText: { color: C.textMuted, fontSize: 10, fontWeight: '600', marginTop: 4 },
    timerContainer: { marginTop: 28, alignItems: 'center' },
    timerLabel: { color: C.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
    timerText: { fontSize: 52, fontWeight: '900', color: C.gold, letterSpacing: 4 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: C.cardBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      maxHeight: '85%',
      borderTopWidth: 2,
      borderColor: C.gold,
    },
    modalTitle: { fontSize: 22, fontWeight: '800', color: C.gold, textAlign: 'center' },
    durationBadge: {
      alignSelf: 'center',
      backgroundColor: C.goldMuted,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      marginTop: 8,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.goldDark,
    },
    durationText: { fontSize: 16, color: C.gold, fontWeight: '700' },
    sectionLabel: { fontSize: 15, fontWeight: '700', color: C.textSecondary, marginBottom: 10 },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    bristolOption: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: C.border,
      backgroundColor: C.cardBgLight,
      minWidth: 44,
    },
    bristolSelected: { borderColor: C.gold, backgroundColor: C.goldMuted },
    bristolEmoji: { fontSize: 22 },
    bristolLabel: { fontSize: 12, color: C.textMuted, marginTop: 2, fontWeight: '600' },
    bristolLabelSelected: { color: C.gold },
    bristolDesc: { fontSize: 14, color: C.textMuted, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
    funOption: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: C.border,
      backgroundColor: C.cardBgLight,
      flex: 1,
      minWidth: 56,
    },
    funSelected: { borderColor: C.gold, backgroundColor: C.goldMuted },
    funEmoji: { fontSize: 26 },
    funLabel: { fontSize: 10, color: C.textMuted, marginTop: 2 },
    funLabelSelected: { color: C.gold, fontWeight: '700' },
    noteInput: {
      backgroundColor: C.cardBgLight,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 14,
      padding: 14,
      color: C.textPrimary,
      fontSize: 15,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    modalActions: { marginTop: 24, gap: 12 },
    saveButton: {
      backgroundColor: C.gold,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      elevation: 6,
      shadowColor: C.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    saveText: { color: C.darkBg, fontWeight: '800', fontSize: 17, letterSpacing: 0.5 },
    cancelButton: { paddingVertical: 12, alignItems: 'center' },
    cancelText: { color: C.textMuted, fontWeight: '600', fontSize: 15 },
  });
}
