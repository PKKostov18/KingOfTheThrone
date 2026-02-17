import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useSessionStore } from '../../src/store/useSessionStore';
import BigRedButton from '../../src/components/BigRedButton';
import { supabase } from '../../src/lib/supabase';

export default function HomeScreen() {
  const { isActive, startTime, startSession, endSession } = useSessionStore();
  const [elapsed, setElapsed] = useState(0);

  // Логика за таймера (брои секундите, докато си активен)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && startTime) {
      // Обновяваме таймера всяка секунда
      interval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000);
        setElapsed(diffInSeconds);
      }, 1000);
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  // Функция за форматиране на времето (напр. 01:30)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Най-важната функция: ПРИКЛЮЧВАНЕ НА СЕСИЯТА
  const handlePress = async () => {
    if (!isActive) {
      // СТАРТ
      startSession();
    } else {
      // СТОП
      if (!startTime) return;

      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - new Date(startTime).getTime()) / 1000);

      try {
        // 1. Взимаме текущия потребител
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Няма логнат потребител!');

        // 2. Записваме в базата данни (Supabase)
        const { error } = await supabase
          .from('entries')
          .insert({
            user_id: user.id,
            duration_seconds: durationSeconds,
            bristol_scale: 4, // По подразбиране (после ще добавим меню за избор)
            fun_rating: 3,    // По подразбиране
          });

        if (error) throw error;

        Alert.alert("Успех! 💩", `Честито! Ти беше на трона ${formatTime(durationSeconds)} минути.`);

      } catch (error: any) {
        Alert.alert("Грешка при запис", error.message);
      } finally {
        // 3. Нулираме бутона
        endSession(); 
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fefce8' }}>
      {/* Заглавие */}
      <View style={{ position: 'absolute', top: 64, alignItems: 'center' }}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#4e342e' }}>
          King of the Throne
        </Text>
        <Text style={{ color: '#8d6e63', marginTop: 4 }}>
          {isActive ? "Приятно прекарване..." : "Готов ли си?"}
        </Text>
      </View>

      {/* Големият Бутон */}
      <BigRedButton 
        isActive={isActive} 
        onPress={handlePress} 
      />

      {/* Таймер */}
      {isActive && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#4e342e' }}>
            {formatTime(elapsed)}
          </Text>
        </View>
      )}
    </View>
  );
}