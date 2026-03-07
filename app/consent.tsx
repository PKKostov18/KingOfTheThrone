import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useConsentStore } from '../src/store/useConsentStore';

// Guard: react-native-google-mobile-ads requires a native dev build.
// In Expo Go the native module is absent, so we gracefully skip it.
let mobileAds: (() => { initialize: () => Promise<void> }) | null = null;
try {
  mobileAds = require('react-native-google-mobile-ads').default;
} catch {
  // Native module unavailable (Expo Go) — ads will be skipped
}
import { useColors } from '../src/hooks/useColors';

export default function ConsentScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const acceptConsent = useConsentStore((s) => s.acceptConsent);
  const [loading, setLoading] = useState(false);

  const handleDecline = () => {
    Alert.alert(
      'Consent Required',
      'King of the Throne cannot be used without accepting the Terms of Service and Privacy Policy. Please accept to continue.',
      [{ text: 'OK' }],
    );
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      // 1. Request App Tracking Transparency permission (iOS)
      await requestTrackingPermissionsAsync();

      // 2. Initialize Google Mobile Ads SDK (skip in Expo Go)
      if (mobileAds) {
        await mobileAds().initialize();
      }

      // 3. Save consent to persistent store
      await acceptConsent();

      // 4. Navigate to auth flow
      router.replace('/(auth)/login' as any);
    } catch (err) {
      // Even if ATT or ads fail, still accept consent so user isn't stuck
      console.warn('Consent flow warning:', err);
      await acceptConsent();
      router.replace('/(auth)/login' as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>👑💩</Text>
        <Text style={styles.title}>King of the Throne</Text>
        <Text style={styles.subtitle}>Before you claim the throne...</Text>
      </View>

      {/* Scrollable Legal Text */}
      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
        >
          <Text style={styles.sectionTitle}>📜 Terms of Service</Text>
          <Text style={styles.legalText}>
            By using King of the Throne ("the App"), you agree to abide by our Terms
            of Service. The App provides entertainment features including an idle game,
            poop tracking, and social features.
          </Text>
          <Text style={styles.legalText}>
            You must be at least 13 years of age to use this App. By continuing, you
            confirm that you meet this age requirement.
          </Text>

          <Text style={styles.sectionTitle}>🚫 Community Standards</Text>
          <Text style={styles.legalText}>
            Objectionable content and abusive users will not be tolerated. This
            includes but is not limited to: harassment, hate speech, threats,
            sexually explicit content, impersonation, and any content that violates
            applicable laws.
          </Text>
          <Text style={styles.legalText}>
            Violations may result in immediate account suspension or permanent ban
            without prior notice. We reserve the right to remove any content that
            violates these standards at our sole discretion.
          </Text>

          <Text style={styles.sectionTitle}>🔒 Privacy Policy</Text>
          <Text style={styles.legalText}>
            We collect minimal data necessary to provide the App's services, including
            your email address, username, and usage data. Your poop tracking data is
            stored securely and is only visible to you and your approved friends.
          </Text>
          <Text style={styles.legalText}>
            We use Google AdMob to display advertisements. AdMob may collect device
            identifiers and usage data to serve personalized ads. You may be asked to
            grant tracking permission on iOS — declining will result in non-personalized
            ads only and will not affect app functionality.
          </Text>

          <Text style={styles.sectionTitle}>📊 Advertising & Tracking</Text>
          <Text style={styles.legalText}>
            This App displays advertisements powered by Google AdMob. By accepting,
            you acknowledge that third-party ad networks may collect data as described
            in their respective privacy policies.
          </Text>
          <Text style={styles.legalText}>
            On iOS, you will be prompted to allow or deny App Tracking. This choice
            is entirely optional and does not affect your ability to use the App.
          </Text>

          <Text style={styles.sectionTitle}>📋 End User License Agreement (EULA)</Text>
          <Text style={styles.legalText}>
            This App is licensed, not sold, to you. You may not reverse engineer,
            decompile, or disassemble the App. We may update these terms at any time,
            and continued use constitutes acceptance of updated terms.
          </Text>

          <View style={styles.scrollSpacer} />
        </ScrollView>
      </View>

      {/* Agreement notice */}
      <Text style={styles.agreementText}>
        By tapping "Accept & Continue" you agree to our Terms of Service,
        Privacy Policy, and EULA.
      </Text>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          activeOpacity={0.7}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1B0E07" />
          ) : (
            <Text style={styles.acceptText}>Accept & Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(C: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: C.darkBg,
      paddingTop: 60,
      paddingBottom: 40,
      paddingHorizontal: 24,
    },

    // Header
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: {
      fontSize: 48,
      marginBottom: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: '900',
      color: C.gold,
      letterSpacing: 1,
    },
    subtitle: {
      fontSize: 14,
      color: C.textSecondary,
      marginTop: 4,
    },

    // Scroll area
    scrollContainer: {
      flex: 1,
      backgroundColor: C.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.border,
      overflow: 'hidden',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: C.gold,
      marginTop: 16,
      marginBottom: 8,
    },
    legalText: {
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 20,
      marginBottom: 10,
    },
    scrollSpacer: {
      height: 12,
    },

    // Agreement
    agreementText: {
      fontSize: 11,
      color: C.textMuted,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 16,
      lineHeight: 16,
      paddingHorizontal: 8,
    },

    // Buttons
    buttons: {
      flexDirection: 'row',
      gap: 12,
    },
    declineButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: C.activeRed,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,61,61,0.08)',
    },
    declineText: {
      color: C.activeRed,
      fontSize: 15,
      fontWeight: '800',
    },
    acceptButton: {
      flex: 2,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: C.gold,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: C.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    acceptText: {
      color: '#1B0E07',
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
  });
}
