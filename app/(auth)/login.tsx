import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Грешка', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Грешка', error.message);
    } else {
      Alert.alert('Успех!', 'Провери имейла си за потвърждение.');
    }
    setLoading(false);
  }

  return (
    <View className="flex-1 justify-center items-center bg-[#efebe9] px-5">
      <View className="items-center mb-10">
        <Text className="text-6xl mb-2">👑</Text>
        <Text className="text-3xl font-bold text-[#4e342e] text-center">King of the Throne</Text>
        <Text className="text-[#8d6e63] mt-2">Влез в кралството</Text>
      </View>

      <View className="w-full">
        <TextInput
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor="#a1887f"
          autoCapitalize="none"
          className="bg-white border border-[#d7ccc8] rounded-xl p-4 text-[#4e342e]"
        />
        <TextInput
          onChangeText={setPassword}
          value={password}
          placeholder="Парола"
          placeholderTextColor="#a1887f"
          secureTextEntry={true}
          autoCapitalize="none"
          className="bg-white border border-[#d7ccc8] rounded-xl p-4 text-[#4e342e] mt-4"
        />
      </View>

      <View className="w-full mt-8">
        <TouchableOpacity 
          onPress={signInWithEmail} 
          disabled={loading}
          className="bg-[#4e342e] py-4 rounded-xl items-center justify-center"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Влез</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={signUpWithEmail} 
          disabled={loading}
          className="border-2 border-[#4e342e] py-4 rounded-xl mt-4 items-center justify-center"
        >
          <Text className="text-[#4e342e] font-bold text-lg">Създай акаунт</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}