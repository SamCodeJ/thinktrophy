import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';
import { resetPassword } from '../api';

export default function ResetPasswordScreen({ navigation, route }) {
  const initialEmail = route.params?.email || '';
  const [form, setForm] = useState({ email: initialEmail, code: '', new_password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleReset() {
    if (!form.email || !form.code || !form.new_password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(form);
      Alert.alert('Success', res.data.message);
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Error', err?.error?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reset Password</Text>
              <Text style={styles.cardSub}>Enter the 6-digit code sent to your email.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={v => setForm(f => ({ ...f, email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!initialEmail}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Reset Code</Text>
                <TextInput
                  style={[styles.input, { letterSpacing: 8, fontSize: 20, textAlign: 'center' }]}
                  placeholder="123456"
                  placeholderTextColor={colors.white30}
                  value={form.code}
                  onChangeText={v => setForm(f => ({ ...f, code: v.replace(/[^0-9]/g, '') }))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>New Password</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={[styles.input, { paddingRight: 50 }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.white30}
                    value={form.new_password}
                    onChangeText={v => setForm(f => ({ ...f, new_password: v }))}
                    secureTextEntry={!showPw}
                  />
                  <TouchableOpacity onPress={() => setShowPw(s => !s)} style={styles.eyeBtn}>
                    <Text style={{ color: colors.white30, fontSize: 16 }}>{showPw ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={handleReset} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={[colors.blue, colors.teal]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Reset Password</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe:      { flex: 1 },
  scroll:    { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20 },
  backBtn:   { marginBottom: 20, paddingVertical: 10, alignSelf: 'flex-start' },
  backText:  { color: colors.white50, fontSize: 16, fontWeight: '600' },
  card:      { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginTop: 20 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: colors.light, marginBottom: 8 },
  cardSub:   { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 20 },
  field:     { marginBottom: 16 },
  label:     { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: colors.dark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    color: colors.light, fontSize: 15,
  },
  eyeBtn:       { position: 'absolute', right: 14, top: 13 },
  submitBtn:  { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});