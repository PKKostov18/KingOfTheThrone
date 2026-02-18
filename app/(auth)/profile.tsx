import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors } from '../../src/constants/Colors';

export default function ProfileScreen() {
  const { profile, user, updateProfile, signOut, loading } = useAuthStore();
  const [username, setUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);

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

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>💩</Text>
            <Text style={styles.crownOverlay}>👑</Text>
          </View>
        </View>
        <Text style={styles.usernameDisplay}>{profile?.username ?? 'Anonymous'}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>⭐ Level {profile?.level ?? 1}</Text>
        </View>
      </View>

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
            placeholderTextColor={Colors.textMuted}
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
            <ActivityIndicator color={Colors.darkBg} />
          ) : (
            <Text style={styles.saveText}>👑 Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sign out button */}
      <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>🚪 Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footerEmoji}>🧻🚽💩👑</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarOuter: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: Colors.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.gold,
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  crownOverlay: {
    fontSize: 28,
    position: 'absolute',
    top: -10,
  },
  usernameDisplay: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  levelBadge: {
    marginTop: 8,
    backgroundColor: Colors.goldMuted,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.goldDark,
  },
  levelText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.gold,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
  },
  readOnlyIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  readOnlyText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 6,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveText: {
    color: Colors.darkBg,
    fontWeight: '800',
    fontSize: 16,
  },
  signOutButton: {
    borderWidth: 2,
    borderColor: Colors.activeRed,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,61,61,0.08)',
  },
  signOutText: {
    color: Colors.activeRed,
    fontWeight: '700',
    fontSize: 16,
  },
  footerEmoji: {
    textAlign: 'center',
    fontSize: 28,
    marginTop: 32,
    opacity: 0.15,
  },
});