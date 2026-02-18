import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { Colors } from '../src/constants/Colors';

export default function RootLayout() {
  const { session, initialized, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize auth store on app start
  useEffect(() => {
    initialize();
  }, []);

  // Navigate based on auth state
  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/' as any);
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    }
  }, [session, initialized, segments]);

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingEmoji}>💩</Text>
        <Text style={styles.loadingCrown}>👑</Text>
        <ActivityIndicator size="large" color={Colors.gold} style={styles.spinner} />
        <Text style={styles.loadingText}>Preparing your throne...</Text>
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
  },
  loadingEmoji: {
    fontSize: 64,
  },
  loadingCrown: {
    fontSize: 36,
    position: 'absolute',
    top: '42%',
  },
  spinner: {
    marginTop: 24,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
  },
});