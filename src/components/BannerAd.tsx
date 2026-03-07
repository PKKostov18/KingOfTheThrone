import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

// Guard: react-native-google-mobile-ads requires a native dev build.
// In Expo Go the native module is absent, so we render nothing.
let GADBannerAd: any = null;
let BannerAdSize: any = {};
let TestIds: any = {};
try {
  const ads = require('react-native-google-mobile-ads');
  GADBannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
} catch {
  // Native module unavailable (Expo Go) — ads will be skipped
}

interface BannerAdProps {
  size?: string;
}

/**
 * Reusable AdMob banner component.
 * Uses test IDs in development. Collapses gracefully if the ad fails to load.
 * Returns null when running inside Expo Go (no native ads module).
 */
export default function BannerAd({ size }: BannerAdProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // No native ads module available — render nothing
  if (!GADBannerAd) return null;
  if (failed) return null;

  const adSize = size || BannerAdSize.ANCHORED_ADAPTIVE_BANNER;

  return (
    <View style={[styles.container, !loaded && styles.hidden]}>
      <GADBannerAd
        unitId={TestIds.ADAPTIVE_BANNER}
        size={adSize}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  hidden: {
    opacity: 0,
    height: 0,
    overflow: 'hidden',
  },
});
