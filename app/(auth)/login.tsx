import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors } from '../../src/constants/Colors';

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  const { signIn, signUp, loading } = useAuthStore();

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password.');
      return;
    }

    const { error } = await signIn(email.trim(), password);
    if (error) {
      Alert.alert('Sign In Error', error);
    }
  }

  async function handleSignUp() {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    const { error } = await signUp(email.trim(), password, username.trim());
    if (error) {
      Alert.alert('Sign Up Error', error);
    } else {
      Alert.alert(
        'Welcome to the Throne! 👑💩',
        'Your account has been created. Check your email for confirmation if needed.',
        [{ text: 'OK', onPress: () => setIsRegister(false) }]
      );
    }
  }

  function toggleMode() {
    setIsRegister(!isRegister);
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Decorative emojis */}
        <Text style={[styles.decoEmoji, { position: 'absolute', top: 40, left: 20 }]}>🧻</Text>
        <Text style={[styles.decoEmoji, { position: 'absolute', top: 60, right: 30 }]}>💩</Text>
        <Text style={[styles.decoEmoji, { position: 'absolute', bottom: 80, left: 30 }]}>🚽</Text>
        <Text style={[styles.decoEmoji, { position: 'absolute', bottom: 60, right: 20 }]}>📰</Text>

        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💩</Text>
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
          <Text style={styles.title}>King of the Throne</Text>
          <Text style={styles.subtitle}>
            {isRegister ? '🚽 Claim your throne' : '🚽 Enter your kingdom'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {isRegister && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                onChangeText={setUsername}
                value={username}
                placeholder="Royal Name"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          )}

          <View style={[styles.inputWrapper, isRegister && styles.inputSpacing]}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              onChangeText={setEmail}
              value={email}
              placeholder="email@address.com"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={[styles.inputWrapper, styles.inputSpacing]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              onChangeText={setPassword}
              value={password}
              placeholder="Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {isRegister && (
            <View style={[styles.inputWrapper, styles.inputSpacing]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                placeholder="Confirm password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={isRegister ? handleSignUp : handleSignIn}
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading ? (
              <ActivityIndicator color={Colors.darkBg} />
            ) : (
              <Text style={styles.primaryText}>
                {isRegister ? '👑 Create Account' : '🚀 Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleMode}
            disabled={loading}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryText}>
              {isRegister ? 'Already a royal? Sign In' : "New here? Create Account"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  decoEmoji: {
    fontSize: 30,
    opacity: 0.12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.goldMuted,
    borderWidth: 3,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 44,
  },
  crownEmoji: {
    fontSize: 24,
    position: 'absolute',
    top: -8,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.gold,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 8,
    fontSize: 15,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  inputSpacing: {
    marginTop: 12,
  },
  actions: {
    width: '100%',
    marginTop: 32,
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  primaryText: {
    color: Colors.darkBg,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
});