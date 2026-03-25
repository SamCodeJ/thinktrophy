import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';
import { register } from '../api';
import { useAuth } from '../store/authStore';

export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const [form, setForm]       = useState({ 
    username: '', email: '', phone_number: '', password: '',
    first_name: '', last_name: '', dob: '' 
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleRegister() {
    if (!form.username || !form.email || !form.password || !form.first_name || !form.last_name || !form.phone_number || !form.dob) {
      Alert.alert('Missing fields', 'All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await register(form);
      await signIn(res.data.accessToken, res.data.refreshToken, res.data.user);
    } catch (err) {
      Alert.alert('Registration Failed', err?.error?.message || 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={{ color: colors.white50, fontSize: 22 }}>←</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join ThinkTrophy and start winning</Text>
            </View>

            <View style={styles.card}>
              {[
                { key: 'first_name',   label: 'First Name',   placeholder: 'John',           keyboard: 'default',       auto: 'name'     },
                { key: 'last_name',    label: 'Last Name',    placeholder: 'Doe',            keyboard: 'default',       auto: 'name'     },
                { key: 'username',     label: 'Username',     placeholder: 'coolplayer99',   keyboard: 'default',       auto: 'username' },
                { key: 'email',        label: 'Email',        placeholder: 'you@email.com',  keyboard: 'email-address', auto: 'email'    },
                { key: 'phone_number', label: 'Phone',        placeholder: '+1 234 567 8901', keyboard: 'phone-pad',    auto: 'tel'      },
                { key: 'dob',          label: 'Date of Birth (YYYY-MM-DD)', placeholder: '2000-01-01', keyboard: 'default', auto: 'none' },
                { key: 'password',     label: 'Password',     placeholder: '••••••••',       keyboard: 'default',       auto: 'password', secure: true },
              ].map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.white30}
                    value={form[f.key]}
                    onChangeText={v => set(f.key, v)}
                    keyboardType={f.keyboard}
                    autoCapitalize="none"
                    autoComplete={f.auto}
                    secureTextEntry={!!f.secure}
                  />
                </View>
              ))}

              <Text style={styles.hint}>
                Password must be at least 8 characters with one uppercase letter and one number.
              </Text>

              <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85} style={{ marginTop: 8 }}>
                <LinearGradient colors={[colors.blue, colors.teal]} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Account</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchLink}>
              <Text style={styles.switchText}>
                Already have an account? <Text style={{ color: colors.teal, fontWeight: '600' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:     { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 },
  header:     { marginBottom: 28 },
  backBtn:    { marginBottom: 16 },
  title:      { fontSize: 28, fontWeight: '800', color: colors.light },
  subtitle:   { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  card:       { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  field:      { marginBottom: 14 },
  label:      { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: colors.dark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    color: colors.light, fontSize: 15,
  },
  hint:       { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, lineHeight: 16 },
  submitBtn:  { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchLink: { marginTop: 20, alignItems: 'center' },
  switchText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
