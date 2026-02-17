import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import React from 'react';

interface BigRedButtonProps {
  onPress: () => void;
  isActive: boolean;
}

export default function BigRedButton({ onPress, isActive }: BigRedButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      // Махаме динамичния className и ползваме масив със стилове
      style={[
        styles.button,
        isActive ? styles.buttonActive : styles.buttonInactive
      ]}
    >
      <View style={styles.innerCircle}>
        <Text className="text-white text-4xl font-extrabold text-center">
          {isActive ? "СТОП" : "АКАМ\nСЕГА"}
        </Text>
        {!isActive && (
          <Text className="text-white/70 text-sm mt-2 font-bold">
            Push me
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 256,
    height: 256,
    borderRadius: 128,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    elevation: 10, // за Android
    shadowOffset: { width: 0, height: 10 }, // за iOS
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  buttonActive: {
    backgroundColor: '#ef4444', // red-500
    borderColor: '#b91c1c',     // red-700
    shadowColor: '#7f1d1d',     // red-900
  },
  buttonInactive: {
    backgroundColor: '#8d6e63', // brown-500
    borderColor: '#4e342e',     // brown-800
    shadowColor: '#3e2723',     // brown-900
  },
  innerCircle: {
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    width: 224,
    height: 224,
    borderRadius: 112,
    justifyContent: 'center',
    alignItems: 'center',
  }
});