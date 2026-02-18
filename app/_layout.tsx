import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
// ПРОМЯНА: Използваме 'import type', за да сме сигурни, че е само за TypeScript
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  // ПРОМЯНА: Ако <Session | null> все още ти дава грешка, махни частта между скобите <...>
const [session, setSession] = useState(null as Session | null);
  const [initialized, setInitialized] = useState(false);
  
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    // Взимаме името на текущата група (напр. "(auth)" или "(tabs)")
    // segments[0] може да е undefined, затова правим проверка
    const inAuthGroup = segments[0] === '(auth)';

    if (session && inAuthGroup) {
      // Имаме потребител, но е на Login екрана -> пращаме го вътре
      router.replace('/(tabs)/' as any);
    } else if (!session && !inAuthGroup) {
      // Нямаме потребител, но се опитва да влезе вътре -> пращаме го на Login
      // Забележка: Тук ползваме 'as any', за да избегнем грешки с пътищата, ако Expo се оплаче
      router.replace('/(auth)/login' as any);
    }
  }, [session, initialized, segments]);

if (!initialized) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fefce8' }}>
      <ActivityIndicator size="large" color="#4e342e" />
    </View>
  );
}

  return <Slot />;
}