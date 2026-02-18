import React, { useEffect, useState } from 'react';
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
import { useSessionStore } from '../../src/store/useSessionStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import BigRedButton from '../../src/components/BigRedButton';
import { supabase } from '../../src/lib/supabase';
import { BRISTOL_SCALE, FUN_RATINGS } from '../../src/constants/BristolScale';
import { Colors } from '../../src/constants/Colors';

export default function HomeScreen() {
  const { isActive, startTime, startSession, endSession } = useSessionStore();
  const { user, profile, fetchProfile } = useAuthStore();
  const [elapsed, setElapsed] = useState(0);

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
      // Stop -> show the rating modal
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
        .select('total_poops')
        .eq('id', user.id)
        .single();

      if (profileData) {
        await supabase
          .from('profiles')
          .update({ total_poops: (profileData.total_poops || 0) + 1 })
          .eq('id', user.id);
      }

      // Reload profile for updated stats
      await fetchProfile();

      Alert.alert(
        'Royal Deposit! 💩👑',
        `Session recorded: ${formatTime(pendingDuration)}\n${BRISTOL_SCALE[selectedBristol - 1].emoji} ${BRISTOL_SCALE[selectedBristol - 1].name}\nRating: ${FUN_RATINGS[selectedFun - 1].emoji}`
      );
    } catch (error: any) {
      Alert.alert('Save Error', error.message);
    } finally {
      setSaving(false);
      setShowModal(false);
      endSession();
    }
  };

  // Cancel entry
  const handleCancelEntry = () => {
    setShowModal(false);
    endSession();
  };

  return (
    <View style={styles.screen}>
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
        {profile && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              💩 {profile.total_poops ?? 0} deposits  •  ⭐ Level {profile.level ?? 1}
            </Text>
          </View>
        )}
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
              {/* Modal title */}
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
                placeholderTextColor={Colors.textMuted}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
  },
  decoEmoji: {
    position: 'absolute',
    fontSize: 28,
    opacity: 0.15,
  },
  titleContainer: {
    position: 'absolute',
    top: 64,
    alignItems: 'center',
  },
  crownEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.gold,
    letterSpacing: 1,
  },
  subtitleText: {
    color: Colors.textSecondary,
    marginTop: 6,
    fontSize: 14,
  },
  streakBadge: {
    marginTop: 12,
    backgroundColor: Colors.poopMuted,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  timerContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  timerLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.gold,
    letterSpacing: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
    borderTopWidth: 2,
    borderColor: Colors.gold,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.gold,
    textAlign: 'center',
  },
  durationBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.goldMuted,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.goldDark,
  },
  durationText: {
    fontSize: 16,
    color: Colors.gold,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },

  // Bristol
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bristolOption: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBgLight,
    minWidth: 44,
  },
  bristolSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldMuted,
  },
  bristolEmoji: {
    fontSize: 22,
  },
  bristolLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  bristolLabelSelected: {
    color: Colors.gold,
  },
  bristolDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Fun rating
  funOption: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBgLight,
    flex: 1,
    minWidth: 56,
  },
  funSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldMuted,
  },
  funEmoji: {
    fontSize: 26,
  },
  funLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  funLabelSelected: {
    color: Colors.gold,
    fontWeight: '700',
  },

  // Note
  noteInput: {
    backgroundColor: Colors.cardBgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Modal actions
  modalActions: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  saveText: {
    color: Colors.darkBg,
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
});