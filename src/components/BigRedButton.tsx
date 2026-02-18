import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import React from 'react';
import { Colors } from '../constants/Colors';

interface BigRedButtonProps {
  onPress: () => void;
  isActive: boolean;
}

export default function BigRedButton({ onPress, isActive }: BigRedButtonProps) {
  return (
    <View style={styles.outerGlow}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          styles.button,
          isActive ? styles.buttonActive : styles.buttonInactive,
        ]}
      >
        {/* Toilet seat ring */}
        <View
          style={[
            styles.seatRing,
            isActive ? styles.seatRingActive : styles.seatRingInactive,
          ]}
        >
          {/* Inner bowl */}
          <View
            style={[
              styles.innerBowl,
              isActive ? styles.innerBowlActive : styles.innerBowlInactive,
            ]}
          >
            <Text style={styles.poopEmoji}>{isActive ? '⏱️' : '💩'}</Text>
            <Text
              style={[
                styles.mainLabel,
                isActive ? styles.mainLabelActive : styles.mainLabelInactive,
              ]}
            >
              {isActive ? 'FLUSH' : 'SIT DOWN'}
            </Text>
            {!isActive && (
              <Text style={styles.subLabel}>tap to begin 🚽</Text>
            )}
            {isActive && (
              <Text style={styles.subLabelActive}>tap when done</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerGlow: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.goldMuted,
  },
  button: {
    width: 260,
    height: 260,
    borderRadius: 130,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    elevation: 20,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  buttonActive: {
    backgroundColor: Colors.activeRed,
    borderColor: Colors.activeRedDark,
    shadowColor: Colors.activeRed,
  },
  buttonInactive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDark,
    shadowColor: Colors.gold,
  },
  seatRing: {
    width: 230,
    height: 230,
    borderRadius: 115,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
  },
  seatRingActive: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  seatRingInactive: {
    borderColor: 'rgba(139,90,43,0.4)',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  innerBowl: {
    width: 190,
    height: 190,
    borderRadius: 95,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  innerBowlActive: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  innerBowlInactive: {
    borderColor: 'rgba(139,90,43,0.25)',
    backgroundColor: 'rgba(27,14,7,0.2)',
  },
  poopEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  mainLabel: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  mainLabelActive: {
    color: '#FFFFFF',
  },
  mainLabelInactive: {
    color: Colors.darkBg,
  },
  subLabel: {
    color: 'rgba(27,14,7,0.6)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '700',
  },
  subLabelActive: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '700',
  },
});