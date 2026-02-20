import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useColors } from '../../src/hooks/useColors';

export default function TabLayout() {
  const C = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: {
          backgroundColor: C.cardBg,
          borderTopWidth: 1,
          borderTopColor: C.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '🚽 Throne',
          tabBarIcon: ({ color }) => <FontAwesome5 name="toilet" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: '🏆 Rankings',
          tabBarIcon: ({ color }) => <FontAwesome5 name="crown" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: '💩 Squad',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}