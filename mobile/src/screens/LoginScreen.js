import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../utils/theme';
import { login } from '../api';
import { useAuth } from '../store/authStore';

export default function LoginScreen({ navigation, route }) {
  const { signIn } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  useEffect(() => {
    if (route.params?.verified === 'true') {
      Alert.alert('Verification Successful', 'Your email has been verified successfully. Please log in to continue.');
      // Clear the params so the alert doesn't show again if the component re-renders
      navigation.setParams({ verified: undefined });
    } else if (route.params?.error === 'expired') {
      Alert.alert('Verification Failed', 'The verification link has expired. Please request a new one.');
      navigation.setParams({ error: undefined });
    }
  }, [route.params?.verified, route.params?.error]);

  useEffect(() => {
    async function loadSavedEmail() {
      const savedEmail = await SecureStore.getItemAsync('saved_email');
      if (savedEmail) {
        setForm(f => ({ ...f, email: savedEmail }));
      }
    }
    loadSavedEmail();
  }, []);

  async function handleLogin() {
    if (!form.email || !form.password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(form);
      // Save credentials for biometric login
      await SecureStore.setItemAsync('saved_email', form.email);
      await SecureStore.setItemAsync('saved_password', form.password);
      
      await signIn(res.data.accessToken, res.data.refreshToken, res.data.user);
    } catch (err) {
      Alert.alert('Login Failed', err?.error?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometric() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled   = await LocalAuthentication.isEnrolledAsync();
    if (!compatible || !enrolled) {
      Alert.alert('Biometrics unavailable', 'Set up Face ID or fingerprint in your device settings.');
      return;
    }
    
    const savedEmail = await SecureStore.getItemAsync('saved_email');
    const savedPassword = await SecureStore.getItemAsync('saved_password');
    
    if (!savedEmail || !savedPassword) {
      Alert.alert('Biometric login', 'Please login with your password first to enable biometric login.');
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to sign in',
      fallbackLabel: 'Use Password',
    });
    
    if (result.success) {
      setLoading(true);
      try {
        const res = await login({ email: savedEmail, password: savedPassword });
        await signIn(res.data.accessToken, res.data.refreshToken, res.data.user);
      } catch (err) {
        Alert.alert('Login Failed', err?.error?.message || 'Invalid saved credentials. Please login with password again.');
        // Clear invalid credentials
        await SecureStore.deleteItemAsync('saved_email');
        await SecureStore.deleteItemAsync('saved_password');
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Logo */}
            <View style={styles.logoArea}>
              <View style={[styles.logoBox, { backgroundColor: 'transparent' }]}>
                <Text style={{ fontSize: 52 }}>🧠</Text>
              </View>
              <Text style={styles.logoTitle}>ThinkTrophy</Text>
              <Text style={styles.logoTagline}>Think Sharp. Win Big.</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome back</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.white30}
                  value={form.email}
                  onChangeText={v => setForm(f => ({ ...f, email: v.trim() }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.field}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={[styles.label, { marginBottom: 0 }]}>Password</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={{ color: colors.teal, fontSize: 13, fontWeight: '600' }}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={[styles.input, { paddingRight: 50 }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.white30}
                    value={form.password}
                    onChangeText={v => setForm(f => ({ ...f, password: v }))}
                    secureTextEntry={!showPw}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPw(s => !s)}
                    style={styles.eyeBtn}
                  >
                    <Text style={{ color: colors.white30, fontSize: 16 }}>{showPw ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={[colors.blue, colors.teal]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.submitText}>Sign In</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleBiometric} style={styles.biometricBtn} activeOpacity={0.7}>
                <Text style={styles.biometricText}>🔐  Sign in with Biometrics</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchLink}>
              <Text style={styles.switchText}>
                Don't have an account? <Text style={{ color: colors.teal, fontWeight: '600' }}>Register</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe:      { flex: 1 },
  scroll:    { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoArea:  { alignItems: 'center', marginBottom: 32 },
  logoBox:   { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoTitle: { fontSize: 28, fontWeight: '800', color: colors.light },
  logoTagline: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  card:      { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.light, marginBottom: 24 },
  field:     { marginBottom: 16 },
  label:     { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: colors.dark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    color: colors.light, fontSize: 15,
  },
  eyeBtn:       { position: 'absolute', right: 14, top: 13 },
  submitBtn:    { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  biometricBtn: { marginTop: 14, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  biometricText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  switchLink:   { marginTop: 24, alignItems: 'center' },
  switchText:   { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
