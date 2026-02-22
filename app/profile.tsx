import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';
import { useColors } from '../src/hooks/useColors';
import { useThemeStore } from '../src/store/useThemeStore';
import { supabase } from '../src/lib/supabase';
import { getLevelForPoops, getNextLevel, getLevelProgress, getPoopsToNextLevel } from '../src/constants/Levels';
import { ALL_BADGES, getBadgeById, type BadgeConfig } from '../src/constants/Badges';
import { THEMES, getAvailableThemes, type AppTheme } from '../src/constants/Themes';
import { AVATARS, getAvailableAvatars, getLockedAvatars, getAvatarById, type AvatarOption } from '../src/constants/Avatars';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, updateProfile, uploadAvatar, signOut, loading, fetchProfile } = useAuthStore();
  const [username, setUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);
  const C = useColors();
  const { themeId, setTheme } = useThemeStore();

  // Badges state
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [loadingBadges, setLoadingBadges] = useState(true);

  // Avatar picker
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(profile?.avatar_url || 'poop');

  // Theme picker
  const [showThemePicker, setShowThemePicker] = useState(false);

  const userLevel = profile?.level ?? 1;

  // Load earned badges
  useEffect(() => {
    loadBadges();
  }, [user]);

  // Sync avatar from profile
  useEffect(() => {
    if (profile?.avatar_url) {
      setCurrentAvatar(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  const loadBadges = async () => {
    if (!user) return;
    setLoadingBadges(true);
    try {
      const { data } = await supabase
        .from('achievements')
        .select('badge_name')
        .eq('user_id', user.id);

      const ids = new Set((data ?? []).map((a: any) => a.badge_name));
      setEarnedBadgeIds(ids);
    } catch (e) {
      console.error('Failed to load badges:', e);
    } finally {
      setLoadingBadges(false);
    }
  };

  async function handleSave() {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ username: username.trim() });
      Alert.alert('Saved! 👑', 'Your royal profile has been updated.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectAvatar(avatar: AvatarOption) {
    setCurrentAvatar(avatar.id);
    setShowAvatarPicker(false);
    try {
      await updateProfile({ avatar_url: avatar.id });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update avatar.');
    }
  }

  async function handleSelectTheme(theme: AppTheme) {
    if (theme.requiredLevel > userLevel) {
      Alert.alert('Locked! 🔒', `Reach Level ${theme.requiredLevel} to unlock ${theme.name}`);
      return;
    }
    await setTheme(theme.id);
    setShowThemePicker(false);
  }

  async function handleSignOut() {
    Alert.alert(
      'Leaving the Throne? 😢',
      'Are you sure you want to sign out?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  }

  const isPhotoAvatar = currentAvatar.startsWith('http');
  const avatarEmoji = isPhotoAvatar ? '💩' : (getAvatarById(currentAvatar)?.emoji ?? '💩');
  const styles = useMemo(() => makeStyles(C), [C]);

  const [uploading, setUploading] = useState(false);

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploading(true);
    try {
      await uploadAvatar(result.assets[0].uri);
      setCurrentAvatar(profile?.avatar_url ?? currentAvatar);
      // Re-fetch profile to get updated URL
      await fetchProfile();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message ?? 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Avatar — tap to change */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarOuter}
          onPress={() => setShowAvatarPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            {isPhotoAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatarPhoto} />
            ) : (
              <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
            )}
            <Text style={styles.crownOverlay}>👑</Text>
          </View>
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✏️</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.usernameDisplay}>{profile?.username ?? 'Anonymous'}</Text>
        {(() => {
          const totalPoops = profile?.total_poops ?? 0;
          const levelConfig = getLevelForPoops(totalPoops);
          return (
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{levelConfig.emoji} {levelConfig.title}</Text>
            </View>
          );
        })()}
      </View>

      {/* Level Progress */}
      {(() => {
        const totalPoops = profile?.total_poops ?? 0;
        const levelConfig = getLevelForPoops(totalPoops);
        const progress = getLevelProgress(totalPoops);
        const remaining = getPoopsToNextLevel(totalPoops);
        const nextLevel = getNextLevel(levelConfig.level);
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 Throne Progress</Text>
            <View style={styles.levelRow}>
              <Text style={styles.levelNum}>Lvl {levelConfig.level}</Text>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${Math.round(progress * 100)}%` as any }]} />
              </View>
              <Text style={styles.levelNum}>{nextLevel ? `Lvl ${nextLevel.level}` : '👑'}</Text>
            </View>
            <Text style={styles.xpSubText}>
              {remaining !== null
                ? `${remaining} more royal deposit${remaining === 1 ? '' : 's'} to become ${nextLevel?.emoji} ${nextLevel?.title}`
                : '👑 You are the King of the Throne!'}
            </Text>
            {nextLevel && (
              <Text style={styles.rewardPreview}>
                🎁 Next reward: {nextLevel.rewardEmoji} {nextLevel.reward}
              </Text>
            )}
          </View>
        );
      })()}

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>💩</Text>
          <Text style={styles.statNumber}>{profile?.total_poops ?? 0}</Text>
          <Text style={styles.statLabel}>Royal Deposits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>👑</Text>
          <Text style={styles.statNumber}>{profile?.level ?? 1}</Text>
          <Text style={styles.statLabel}>Throne Level</Text>
        </View>
      </View>

      {/* ====== BADGES SECTION ====== */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏅 Badges & Achievements</Text>
        {loadingBadges ? (
          <ActivityIndicator color={C.gold} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.badgeGrid}>
            {ALL_BADGES.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <TouchableOpacity
                  key={badge.id}
                  style={[styles.badgeItem, earned ? styles.badgeEarned : styles.badgeLocked]}
                  onPress={() => {
                    Alert.alert(
                      `${badge.emoji} ${badge.name}`,
                      `${badge.description}\n\n${earned ? '✅ Unlocked!' : '🔒 Not yet earned'}`,
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>
                    {badge.emoji}
                  </Text>
                  <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={1}>
                    {badge.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <Text style={styles.badgeCount}>
          {earnedBadgeIds.size} / {ALL_BADGES.length} earned
        </Text>
      </View>

      {/* ====== THEME PICKER SECTION ====== */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎨 Theme</Text>
        <TouchableOpacity
          style={styles.themePreviewButton}
          onPress={() => setShowThemePicker(true)}
          activeOpacity={0.7}
        >
          {(() => {
            const currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
            return (
              <>
                <View style={[styles.themePreviewSwatch, { backgroundColor: currentTheme.accent }]} />
                <Text style={styles.themePreviewText}>
                  {currentTheme.emoji} {currentTheme.name}
                </Text>
                <Text style={styles.themeChangeText}>Change →</Text>
              </>
            );
          })()}
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>📋 Royal Info</Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyIcon}>📧</Text>
          <Text style={styles.readOnlyText}>{user?.email ?? '—'}</Text>
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Royal Name</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your royal name..."
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || loading}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator color={C.darkBg} />
          ) : (
            <Text style={styles.saveText}>👑 Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>🚪 Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footerEmoji}>🧻🚽💩👑</Text>

      {/* ====== AVATAR PICKER MODAL ====== */}
      <Modal visible={showAvatarPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Your Avatar</Text>
            <Text style={styles.modalSubtitle}>
              Pick an emoji or upload from your gallery!
            </Text>

            {/* Upload from gallery button */}
            <TouchableOpacity
              style={styles.photoUploadButton}
              onPress={() => {
                setShowAvatarPicker(false);
                setTimeout(() => handlePickPhoto(), 400);
              }}
              activeOpacity={0.7}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={C.darkBg} />
              ) : (
                <>
                  <Text style={styles.photoUploadIcon}>📷</Text>
                  <Text style={styles.photoUploadText}>Upload from Gallery</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.modalSubtitle, { marginBottom: 12 }]}>— or pick an emoji —</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.avatarGrid}>
                {AVATARS.map((av) => {
                  const unlocked = av.requiredLevel <= userLevel;
                  const selected = av.id === currentAvatar;
                  return (
                    <TouchableOpacity
                      key={av.id}
                      style={[
                        styles.avatarPickerItem,
                        selected && styles.avatarPickerSelected,
                        !unlocked && styles.avatarPickerLocked,
                      ]}
                      onPress={() => unlocked && handleSelectAvatar(av)}
                      activeOpacity={unlocked ? 0.7 : 1}
                    >
                      <Text style={[styles.avatarPickerEmoji, !unlocked && { opacity: 0.3 }]}>
                        {av.emoji}
                      </Text>
                      {!unlocked && (
                        <Text style={styles.avatarLockLevel}>Lv{av.requiredLevel}</Text>
                      )}
                      <Text style={[styles.avatarPickerName, !unlocked && { opacity: 0.3 }]} numberOfLines={1}>
                        {av.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowAvatarPicker(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ====== THEME PICKER MODAL ====== */}
      <Modal visible={showThemePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎨 Choose Theme</Text>
            <Text style={styles.modalSubtitle}>
              Unlock more themes as you level up!
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {THEMES.map((theme) => {
                const unlocked = theme.requiredLevel <= userLevel;
                const selected = theme.id === themeId;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeItem,
                      selected && styles.themeItemSelected,
                      !unlocked && styles.themeItemLocked,
                    ]}
                    onPress={() => handleSelectTheme(theme)}
                    activeOpacity={unlocked ? 0.7 : 0.9}
                  >
                    <View style={styles.themeItemLeft}>
                      <View style={[styles.themeSwatch, { backgroundColor: theme.accent }]} />
                      <View style={styles.themeInfo}>
                        <Text style={[styles.themeItemName, !unlocked && { opacity: 0.4 }]}>
                          {theme.emoji} {theme.name}
                        </Text>
                        <Text style={[styles.themeItemDesc, !unlocked && { opacity: 0.3 }]}>
                          {theme.description}
                        </Text>
                      </View>
                    </View>
                    {!unlocked ? (
                      <Text style={styles.themeLockText}>🔒 Lv{theme.requiredLevel}</Text>
                    ) : selected ? (
                      <Text style={styles.themeActiveText}>✅</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowThemePicker(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: C.darkBg },
    container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    backButton: { marginBottom: 16 },
    backText: { color: C.gold, fontSize: 16, fontWeight: '700' },

    // Avatar
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    avatarOuter: {
      width: 116,
      height: 116,
      borderRadius: 58,
      backgroundColor: C.goldMuted,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: C.gold,
      marginBottom: 12,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: C.cardBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarEmoji: { fontSize: 48 },
    avatarPhoto: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    crownOverlay: { fontSize: 28, position: 'absolute', top: -10 },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: C.gold,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: C.darkBg,
    },
    editBadgeText: { fontSize: 14 },
    usernameDisplay: { color: C.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
    levelBadge: {
      marginTop: 8,
      backgroundColor: C.goldMuted,
      paddingHorizontal: 16,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.goldDark,
    },
    levelText: { color: C.gold, fontSize: 13, fontWeight: '700' },

    // Cards
    card: {
      backgroundColor: C.cardBg,
      borderRadius: 18,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: C.border,
    },
    cardTitle: { fontSize: 16, fontWeight: '800', color: C.textSecondary, marginBottom: 14 },
    levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    levelNum: { color: C.gold, fontSize: 12, fontWeight: '800' },
    xpBarBg: { flex: 1, height: 10, borderRadius: 5, backgroundColor: C.border, overflow: 'hidden' },
    xpBarFill: { height: '100%', borderRadius: 5, backgroundColor: C.gold },
    xpSubText: { color: C.textMuted, fontSize: 12, marginTop: 10, textAlign: 'center' },
    rewardPreview: { color: C.goldLight, fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },

    // Stats
    statsCard: {
      flexDirection: 'row',
      backgroundColor: C.cardBg,
      borderRadius: 18,
      padding: 20,
      marginBottom: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.border,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statEmoji: { fontSize: 28, marginBottom: 4 },
    statNumber: { fontSize: 32, fontWeight: '900', color: C.gold },
    statLabel: { fontSize: 12, color: C.textMuted, marginTop: 2, fontWeight: '600' },
    statDivider: { width: 1, height: 50, backgroundColor: C.border },

    // Badges
    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    badgeItem: {
      width: '21%',
      aspectRatio: 1,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      padding: 4,
    },
    badgeEarned: {
      backgroundColor: C.goldMuted,
      borderColor: C.gold,
    },
    badgeLocked: {
      backgroundColor: C.cardBgLight,
      borderColor: C.border,
    },
    badgeEmoji: { fontSize: 22 },
    badgeEmojiLocked: { opacity: 0.25 },
    badgeName: { fontSize: 8, color: C.gold, fontWeight: '700', marginTop: 2, textAlign: 'center' },
    badgeNameLocked: { color: C.textMuted, opacity: 0.4 },
    badgeCount: {
      color: C.textMuted,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 12,
    },

    // Theme preview
    themePreviewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBgLight,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    themePreviewSwatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
    },
    themePreviewText: {
      flex: 1,
      color: C.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    themeChangeText: {
      color: C.gold,
      fontSize: 14,
      fontWeight: '600',
    },

    // Info
    infoSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: C.textSecondary, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: C.textMuted, marginBottom: 6, letterSpacing: 0.5 },
    readOnlyField: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBgLight,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 14,
      padding: 16,
    },
    readOnlyIcon: { fontSize: 16, marginRight: 10 },
    readOnlyText: { color: C.textMuted, fontSize: 15 },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 14,
      paddingHorizontal: 14,
    },
    inputIcon: { fontSize: 16, marginRight: 10 },
    input: { flex: 1, paddingVertical: 16, color: C.textPrimary, fontSize: 16 },
    saveButton: {
      backgroundColor: C.gold,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      elevation: 6,
      shadowColor: C.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    saveText: { color: C.darkBg, fontWeight: '800', fontSize: 16 },
    signOutButton: {
      borderWidth: 2,
      borderColor: C.activeRed,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,61,61,0.08)',
    },
    signOutText: { color: C.activeRed, fontWeight: '700', fontSize: 16 },
    footerEmoji: { textAlign: 'center', fontSize: 28, marginTop: 32, opacity: 0.15 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: C.cardBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      maxHeight: '80%',
      borderTopWidth: 2,
      borderColor: C.gold,
    },
    modalTitle: { fontSize: 22, fontWeight: '800', color: C.gold, textAlign: 'center' },
    modalSubtitle: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 20 },
    modalCloseButton: { paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    modalCloseText: { color: C.textMuted, fontWeight: '600', fontSize: 16 },

    // Avatar picker grid
    avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    avatarPickerItem: {
      width: 72,
      height: 88,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: C.cardBgLight,
      borderWidth: 2,
      borderColor: C.border,
    },
    avatarPickerSelected: { borderColor: C.gold, backgroundColor: C.goldMuted },
    avatarPickerLocked: { opacity: 0.5 },
    avatarPickerEmoji: { fontSize: 32 },
    avatarLockLevel: {
      fontSize: 9,
      color: C.activeRed,
      fontWeight: '800',
      position: 'absolute',
      top: 4,
      right: 6,
    },
    avatarPickerName: { fontSize: 9, color: C.textMuted, marginTop: 4, fontWeight: '600', textAlign: 'center' },

    // Photo upload
    photoUploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.gold,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    photoUploadIcon: { fontSize: 18, marginRight: 8 },
    photoUploadText: { color: C.darkBg, fontSize: 15, fontWeight: '800' },

    // Theme picker items
    themeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.cardBgLight,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: C.border,
    },
    themeItemSelected: { borderColor: C.gold, backgroundColor: C.goldMuted },
    themeItemLocked: { opacity: 0.55 },
    themeItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    themeSwatch: { width: 36, height: 36, borderRadius: 18, marginRight: 14 },
    themeInfo: { flex: 1 },
    themeItemName: { color: C.textPrimary, fontSize: 15, fontWeight: '700' },
    themeItemDesc: { color: C.textMuted, fontSize: 11, marginTop: 2 },
    themeLockText: { color: C.textMuted, fontSize: 12, fontWeight: '700' },
    themeActiveText: { fontSize: 18 },
  });
}
