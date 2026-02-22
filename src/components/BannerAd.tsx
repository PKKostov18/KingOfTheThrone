import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd as GADBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface BannerAdProps {
  size?: BannerAdSize;
}

/**
 * Reusable AdMob banner component.
 * Uses test IDs in development. Collapses gracefully if the ad fails to load.
 */
export default function BannerAd({ size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: BannerAdProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <View style={[styles.container, !loaded && styles.hidden]}>
      <GADBannerAd
        unitId={TestIds.ADAPTIVE_BANNER}
        size={size}
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
