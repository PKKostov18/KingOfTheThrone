import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>King of the Throne</Text>
        <Text style={styles.subtitle}>Влез в кралството</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor="#a1887f"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          onChangeText={setPassword}
          value={password}
          placeholder="Парола"
          placeholderTextColor="#a1887f"
          secureTextEntry={true}
          autoCapitalize="none"
          style={[styles.input, styles.inputSpacing]}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={signInWithEmail} 
          disabled={loading}
          style={styles.signInButton}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.signInText}>Влез</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={signUpWithEmail} 
          disabled={loading}
          style={styles.signUpButton}
        >
          <Text style={styles.signUpText}>Създай акаунт</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#efebe9',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  crown: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#4e342e',
    textAlign: 'center',
  },
  subtitle: {
    color: '#8d6e63',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7ccc8',
    borderRadius: 12,
    padding: 16,
    color: '#4e342e',
  },
  inputSpacing: {
    marginTop: 16,
  },
  actions: {
    width: '100%',
    marginTop: 32,
  },
  signInButton: {
    backgroundColor: '#4e342e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  signUpButton: {
    borderWidth: 2,
    borderColor: '#4e342e',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#4e342e',
    fontWeight: '700',
    fontSize: 18,
  },
});