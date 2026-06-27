import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';
import { forgotPassword } from '../api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!email) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      Alert.alert('Code Sent', res.data.message);
      navigation.navigate('ResetPassword', { email });
    } catch (err) {
      Alert.alert('Error', err?.error?.message || 'Failed to send reset code.');
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
              <Text style={styles.cardTitle}>Forgot Password</Text>
              <Text style={styles.cardSub}>Enter your email to receive a password reset code.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.white30}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity onPress={handleSend} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={[colors.blue, colors.teal]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Send Code</Text>}
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
  submitBtn:  { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});