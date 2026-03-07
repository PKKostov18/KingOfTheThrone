import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, Dimensions, Easing } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const POOP_EMOJIS = ['💩', '💩', '💩', '💩', '🤎', '💩'];
const POOP_SIZES = [28, 32, 36, 40, 24];

interface FallingPoopProps {
  id: number;
  onDone: (id: number) => void;
}

export default function FallingPoop({ id, onDone }: FallingPoopProps) {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Randomize per poop instance
  const config = useMemo(() => {
    const startX = Math.random() * (SCREEN_WIDTH - 60) + 10;
    const emoji = POOP_EMOJIS[Math.floor(Math.random() * POOP_EMOJIS.length)];
    const size = POOP_SIZES[Math.floor(Math.random() * POOP_SIZES.length)];
    const duration = 2500 + Math.random() * 1500; // 2.5s – 4s
    const drift = (Math.random() - 0.5) * 100; // horizontal sway
    const rotation = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720); // 1–3 full spins
    const startY = -50;
    const delay = Math.random() * 50; // slight stagger

    return { startX, emoji, size, duration, drift, rotation, startY, delay };
  }, []);

  useEffect(() => {
    const fallAnimation = Animated.timing(fallAnim, {
      toValue: 1,
      duration: config.duration,
      delay: config.delay,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    });

    const rotateAnimation = Animated.timing(rotateAnim, {
      toValue: 1,
      duration: config.duration,
      delay: config.delay,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    Animated.parallel([fallAnimation, rotateAnimation]).start(() => {
      onDone(id);
    });
  }, []);

  const translateY = fallAnim.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [config.startY, config.startY + 30, SCREEN_HEIGHT * 0.75, SCREEN_HEIGHT + 60],
  });

  const translateX = fallAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [0, config.drift * 0.6, config.drift, config.drift * 0.8],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${config.rotation}deg`],
  });

  const opacity = fallAnim.interpolate({
    inputRange: [0, 0.05, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  const scale = fallAnim.interpolate({
    inputRange: [0, 0.15, 0.5, 1],
    outputRange: [0.3, 1.2, 1, 0.8],
  });

  return (
    <Animated.Text
      style={[
        styles.poop,
        {
          left: config.startX,
          fontSize: config.size,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { rotate },
            { scale },
          ],
        },
      ]}
    >
      {config.emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  poop: {
    position: 'absolute',
    top: 0,
    zIndex: 999,
  },
});
