import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';
import { register } from '../api';
import { normalizeReferralCode } from '../utils/referral';
import {
  clearPendingReferralCode,
  getPendingReferralCode,
  savePendingReferralCode,
} from '../store/referralStore';

export default function RegisterScreen({ navigation, route }) {
  const [form, setForm]       = useState({ 
    username: '', email: '', phone_number: '', password: '', confirm_password: '',
    first_name: '', last_name: '', dob: '', referral_code: normalizeReferralCode(route.params?.referral) || '' 
  });
  const [referralLocked, setReferralLocked] = useState(!!normalizeReferralCode(route.params?.referral));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const fromRoute = normalizeReferralCode(route.params?.referral);
      const stored = fromRoute || await getPendingReferralCode();
      if (cancelled || !stored) return;
      setForm(f => ({ ...f, referral_code: stored }));
      setReferralLocked(true);
      await savePendingReferralCode(stored);
    })();
    return () => { cancelled = true; };
  }, [route.params?.referral]);

  const set = (k, v) => {
    if (k === 'referral_code' && referralLocked) return;
    if (k === 'dob') {
      // Auto-format date as YYYY-MM-DD
      const cleaned = v.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length > 4 && cleaned.length <= 6) {
        formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
      } else if (cleaned.length > 6) {
        formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
      }
      setForm(f => ({ ...f, [k]: formatted }));
    } else if (k === 'email') {
      setForm(f => ({ ...f, [k]: v.trim() }));
    } else {
      setForm(f => ({ ...f, [k]: v }));
    }
  };

  async function handleRegister() {
    if (!form.username || !form.email || !form.password || !form.confirm_password || !form.first_name || !form.last_name || !form.phone_number || !form.dob) {
      Alert.alert('Missing fields', 'All fields are required.');
      return;
    }
    if (form.password !== form.confirm_password) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await register(form);
      await clearPendingReferralCode();
      Alert.alert('Success', res.data.message, [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
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
                { key: 'dob',          label: 'Date of Birth (YYYY-MM-DD)', placeholder: '2000-01-01', keyboard: 'number-pad', auto: 'none', maxLength: 10 },
                { key: 'password',         label: 'Password',         placeholder: '••••••••',       keyboard: 'default',       auto: 'password', secure: true },
                { key: 'confirm_password', label: 'Confirm Password', placeholder: '••••••••',       keyboard: 'default',       auto: 'password', secure: true },
                { key: 'referral_code',    label: referralLocked ? 'Referral Code 🔒' : 'Referral Code (Optional)', placeholder: 'e.g. A1B2C3D4', keyboard: 'default', auto: 'none', maxLength: 8, locked: referralLocked },
              ].map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, f.secure && { paddingRight: 50 }, f.locked && styles.inputLocked]}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.white30}
                      value={form[f.key]}
                      onChangeText={v => set(f.key, v)}
                      keyboardType={f.keyboard}
                      autoCapitalize={f.key === 'referral_code' ? 'characters' : 'none'}
                      autoComplete={f.auto}
                      secureTextEntry={f.secure ? !showPassword : false}
                      maxLength={f.maxLength}
                      editable={!f.locked}
                      selectTextOnFocus={!f.locked}
                    />
                    {f.secure && (
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {f.locked && (
                    <Text style={styles.lockedHint}>Applied from your invite link</Text>
                  )}
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
  inputContainer: { position: 'relative', justifyContent: 'center' },
  input: {
    backgroundColor: colors.dark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    color: colors.light, fontSize: 15,
  },
  inputLocked: { color: colors.teal, opacity: 0.85 },
  eyeIcon:    { position: 'absolute', right: 16, height: '100%', justifyContent: 'center' },
  hint:       { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, lineHeight: 16 },
  lockedHint: { fontSize: 11, color: colors.teal, marginTop: 6 },
  submitBtn:  { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchLink: { marginTop: 20, alignItems: 'center' },
  switchText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});
