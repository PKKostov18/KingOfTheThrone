import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/Colors';

export default function LeaderboardScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.decoTop}>🏆</Text>
      <Text style={styles.emoji}>👑</Text>
      <Text style={styles.title}>Royal Rankings</Text>
      <Text style={styles.subtitle}>Who drops the most?</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Coming Soon</Text>
      </View>
      <Text style={styles.decoBottom}>💩🥇🥈🥉💩</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
    padding: 24,
  },
  decoTop: {
    fontSize: 60,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.gold,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  badge: {
    marginTop: 24,
    backgroundColor: Colors.goldMuted,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.goldDark,
  },
  badgeText: {
    color: Colors.gold,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  decoBottom: {
    fontSize: 24,
    marginTop: 32,
    opacity: 0.2,
  },
});