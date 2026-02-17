import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Използваме директни цветове, за да не минават през CSS двигателя на NativeWind
        tabBarActiveTintColor: '#ffd700', 
        tabBarInactiveTintColor: '#a1887f',
        tabBarStyle: {
          backgroundColor: '#3e2723',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Тронът',
          tabBarIcon: ({ color }) => <FontAwesome5 name="toilet" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Класация',
          tabBarIcon: ({ color }) => <FontAwesome5 name="trophy" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Приятели',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}