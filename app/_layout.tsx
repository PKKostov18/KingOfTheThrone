import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { useThemeStore } from '../src/store/useThemeStore';
import { useConsentStore } from '../src/store/useConsentStore';
import { useColors } from '../src/hooks/useColors';

export default function RootLayout() {
  const { session, initialized, initialize } = useAuthStore();
  const initTheme = useThemeStore((s) => s.initTheme);
  const themeInitialized = useThemeStore((s) => s.initialized);
  const { hasAcceptedConsent, initialized: consentInitialized, initConsent } = useConsentStore();
  const C = useColors();
  const segments = useSegments();
  const router = useRouter();

  // Initialize auth + theme + consent stores on app start
  useEffect(() => {
    initialize();
    initTheme();
    initConsent();
  }, []);

  // Navigate based on consent + auth state
  useEffect(() => {
    if (!initialized || !consentInitialized) return;

    const currentRoute = segments[0];

    // If consent not given, force to consent screen
    if (!hasAcceptedConsent) {
      if (currentRoute !== 'consent') {
        router.replace('/consent' as any);
      }
      return;
    }

    // Consent given — normal auth routing
    const inAuthGroup = currentRoute === '(auth)';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/' as any);
    } else if (!session && !inAuthGroup && currentRoute !== 'consent') {
      router.replace('/(auth)/login' as any);
    }
  }, [session, initialized, consentInitialized, hasAcceptedConsent, segments]);

  if (!initialized || !themeInitialized || !consentInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.darkBg }}>
        <Text style={{ fontSize: 64 }}>💩</Text>
        <Text style={{ fontSize: 36, position: 'absolute', top: '42%' }}>👑</Text>
        <ActivityIndicator size="large" color={C.gold} style={{ marginTop: 24 }} />
        <Text style={{ color: C.textSecondary, marginTop: 16, fontSize: 15, fontWeight: '600' }}>
          Preparing your throne...
        </Text>
      </View>
    );
  }

  return <Slot />;
}