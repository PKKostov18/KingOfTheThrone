import { View, Text } from 'react-native';
import { useColors } from '../../src/hooks/useColors';

export default function LeaderboardScreen() {
  const C = useColors();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.darkBg, padding: 24 }}>
      <Text style={{ fontSize: 60, marginBottom: 8 }}>🏆</Text>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>👑</Text>
      <Text style={{ fontSize: 26, fontWeight: '900', color: C.gold, letterSpacing: 1 }}>Royal Rankings</Text>
      <Text style={{ fontSize: 15, color: C.textSecondary, marginTop: 6 }}>Who drops the most?</Text>
      <View style={{
        marginTop: 24,
        backgroundColor: C.goldMuted,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.goldDark,
      }}>
        <Text style={{ color: C.gold, fontWeight: '700', fontSize: 14, letterSpacing: 1 }}>Coming Soon</Text>
      </View>
      <Text style={{ fontSize: 24, marginTop: 32, opacity: 0.2 }}>💩🥇🥈🥉💩</Text>
    </View>
  );
}
