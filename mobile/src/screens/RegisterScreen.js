import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Linking, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { colors } from '../utils/theme';
import { register, checkUsername } from '../api';
import { normalizeReferralCode } from '../utils/referral';
import {
  clearPendingReferralCode,
  getPendingReferralCode,
  savePendingReferralCode,
} from '../store/referralStore';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PASSWORD_RULES = [
  { id: 'len', label: '8+ characters', test: p => p.length >= 8 },
  { id: 'upper', label: 'Uppercase letter', test: p => /[A-Z]/.test(p) },
  { id: 'num', label: 'A number', test: p => /[0-9]/.test(p) },
];

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function maxAdultDob() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function toIsoDate(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function WheelColumn({ data, selected, onSelect }) {
  return (
    <ScrollView style={styles.wheel} showsVerticalScrollIndicator={false}>
      {data.map(item => {
        const active = item.value === selected;
        return (
          <TouchableOpacity
            key={String(item.value)}
            onPress={() => onSelect(item.value)}
            style={[styles.wheelItem, active && styles.wheelItemActive]}
          >
            <Text style={[styles.wheelText, active && styles.wheelTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function DobPickerModal({ visible, value, onClose, onConfirm }) {
  const maxDate = maxAdultDob();
  const minYear = maxDate.getFullYear() - 82;
  const parsed = parseIsoDate(value);
  const initial = parsed && parsed <= maxDate ? parsed : new Date(maxDate.getFullYear() - 3, 0, 1);

  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  const [day, setDay] = useState(initial.getDate());

  useEffect(() => {
    if (!visible) return;
    const next = parseIsoDate(value);
    const seed = next && next <= maxDate ? next : initial;
    setYear(seed.getFullYear());
    setMonth(seed.getMonth());
    setDay(seed.getDate());
  }, [visible, value]);

  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);

  const years = Array.from({ length: maxDate.getFullYear() - minYear + 1 }, (_, i) => {
    const y = maxDate.getFullYear() - i;
    return { value: y, label: String(y) };
  });
  const months = MONTHS.map((label, value) => ({ value, label }));
  const days = Array.from({ length: maxDay }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Date of Birth</Text>
          <Text style={styles.modalHint}>You must be at least 18 years old</Text>
          <View style={styles.wheels}>
            <WheelColumn data={days} selected={safeDay} onSelect={setDay} />
            <WheelColumn data={months} selected={month} onSelect={setMonth} />
            <WheelColumn data={years} selected={year} onSelect={setYear} />
          </View>
          <TouchableOpacity
            onPress={() => onConfirm(toIsoDate(year, month, safeDay))}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[colors.blue, colors.teal]} style={styles.modalBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.modalBtnText}>Use this date</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.modalCancel}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function RegisterScreen({ navigation, route }) {
  const [form, setForm]       = useState({
    username: '', email: '', phone_number: '', password: '', confirm_password: '',
    first_name: '', last_name: '', dob: '', referral_code: normalizeReferralCode(route.params?.referral) || '',
  });
  const [referralLocked, setReferralLocked] = useState(!!normalizeReferralCode(route.params?.referral));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' });

  useEffect(() => {
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

  useEffect(() => {
    const username = form.username.trim();
    if (!username) {
      setUsernameStatus({ state: 'idle', message: '' });
      return;
    }
    if (username.length < 3) {
      setUsernameStatus({ state: 'invalid', message: 'At least 3 characters' });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus({ state: 'invalid', message: 'Letters, numbers, and underscores only' });
      return;
    }

    let cancelled = false;
    setUsernameStatus({ state: 'checking', message: 'Checking availability…' });
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsername(username);
        if (cancelled) return;
        const data = res?.data || {};
        setUsernameStatus({
          state: data.available ? 'available' : 'taken',
          message: data.message || (data.available ? 'Username is available' : 'Username is already taken'),
        });
      } catch {
        if (!cancelled) setUsernameStatus({ state: 'idle', message: '' });
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.username]);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map(rule => ({ ...rule, ok: rule.test(form.password) })),
    [form.password]
  );
  const passwordScore = passwordChecks.filter(r => r.ok).length;
  const passwordStrong = passwordScore === PASSWORD_RULES.length;
  const usernameOk = usernameStatus.state === 'available';
  const canSubmit = acceptedTerms && usernameOk && passwordStrong && form.password === form.confirm_password;

  const set = (k, v) => {
    if (k === 'referral_code' && referralLocked) return;
    if (k === 'email') {
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
    if (!usernameOk) {
      Alert.alert('Username', usernameStatus.message || 'Please choose an available username.');
      return;
    }
    if (!passwordStrong) {
      Alert.alert('Weak password', 'Password must be at least 8 characters with one uppercase letter and one number.');
      return;
    }
    if (form.password !== form.confirm_password) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Terms required', 'Please accept the Terms and Conditions to continue.');
      return;
    }
    setLoading(true);
    try {
      const res = await register(form);
      await clearPendingReferralCode();
      Alert.alert('Success', res.data.message, [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Registration Failed', err?.error?.message || 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  const dobLabel = parseIsoDate(form.dob) ? format(parseIsoDate(form.dob), 'dd MMM yyyy') : '';
  const usernameColor = usernameStatus.state === 'available' ? colors.green
    : usernameStatus.state === 'taken' || usernameStatus.state === 'invalid' ? colors.red
    : colors.white30;

  const fields = [
    { key: 'first_name',   label: 'First Name',   placeholder: 'John',           keyboard: 'default',       auto: 'name'     },
    { key: 'last_name',    label: 'Last Name',    placeholder: 'Doe',            keyboard: 'default',       auto: 'name'     },
    { key: 'email',        label: 'Email',        placeholder: 'you@email.com',  keyboard: 'email-address', auto: 'email'    },
    { key: 'phone_number', label: 'Phone',        placeholder: '+1 234 567 8901', keyboard: 'phone-pad',    auto: 'tel'      },
    { key: 'referral_code', label: referralLocked ? 'Referral Code 🔒' : 'Referral Code (Optional)', placeholder: 'e.g. A1B2C3D4', keyboard: 'default', auto: 'none', maxLength: 8, locked: referralLocked },
  ];

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
              {fields.slice(0, 2).map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.white30}
                    value={form[f.key]}
                    onChangeText={v => set(f.key, v)}
                    keyboardType={f.keyboard}
                    autoCapitalize="words"
                    autoComplete={f.auto}
                  />
                </View>
              ))}

              <View style={styles.field}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="coolplayer99"
                  placeholderTextColor={colors.white30}
                  value={form.username}
                  onChangeText={v => set('username', v.replace(/\s/g, ''))}
                  autoCapitalize="none"
                  autoComplete="username"
                  maxLength={30}
                />
                {!!usernameStatus.message && (
                  <Text style={[styles.inlineHint, { color: usernameColor }]}>
                    {usernameStatus.state === 'checking' ? '… ' : usernameStatus.state === 'available' ? '✓ ' : '✕ '}
                    {usernameStatus.message}
                  </Text>
                )}
              </View>

              {fields.slice(2, 4).map(f => (
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
                  />
                </View>
              ))}

              <View style={styles.field}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity onPress={() => setShowDobPicker(true)} activeOpacity={0.8} style={styles.input}>
                  <Text style={dobLabel ? styles.dobValue : styles.dobPlaceholder}>
                    {dobLabel || 'Select your date of birth'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { paddingRight: 50 }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.white30}
                    value={form.password}
                    onChangeText={v => set('password', v)}
                    autoCapitalize="none"
                    autoComplete="password"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(s => !s)} activeOpacity={0.7}>
                    <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {!!form.password && (
                  <View style={styles.strengthWrap}>
                    <View style={styles.strengthBars}>
                      {PASSWORD_RULES.map((rule, i) => (
                        <View
                          key={rule.id}
                          style={[
                            styles.strengthBar,
                            i < passwordScore && {
                              backgroundColor: passwordScore === 1 ? colors.red : passwordScore === 2 ? colors.yellow : colors.green,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    {passwordChecks.map(rule => (
                      <Text key={rule.id} style={[styles.ruleText, { color: rule.ok ? colors.green : colors.white30 }]}>
                        {rule.ok ? '✓' : '○'} {rule.label}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.white30}
                  value={form.confirm_password}
                  onChangeText={v => set('confirm_password', v)}
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                />
                {!!form.confirm_password && form.confirm_password !== form.password && (
                  <Text style={[styles.inlineHint, { color: colors.red }]}>Passwords do not match</Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{fields[4].label}</Text>
                <TextInput
                  style={[styles.input, fields[4].locked && styles.inputLocked]}
                  placeholder={fields[4].placeholder}
                  placeholderTextColor={colors.white30}
                  value={form.referral_code}
                  onChangeText={v => set('referral_code', v)}
                  autoCapitalize="characters"
                  maxLength={8}
                  editable={!fields[4].locked}
                  selectTextOnFocus={!fields[4].locked}
                />
                {fields[4].locked && (
                  <Text style={styles.lockedHint}>Applied from your invite link</Text>
                )}
              </View>

              <View style={styles.termsRow}>
                <TouchableOpacity
                  onPress={() => setAcceptedTerms(v => !v)}
                  activeOpacity={0.8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedTerms }}
                >
                  <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                    {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink} onPress={() => Linking.openURL('https://thinktrophy.com/terms')}>
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink} onPress={() => Linking.openURL('https://thinktrophy.com/privacy-policy')}>
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading || !canSubmit}
                activeOpacity={0.85}
                style={{ marginTop: 8, opacity: canSubmit && !loading ? 1 : 0.4 }}
              >
                <LinearGradient
                  colors={canSubmit ? [colors.blue, colors.teal] : ['#4B5563', '#6B7280']}
                  style={styles.submitBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
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
      <DobPickerModal
        visible={showDobPicker}
        value={form.dob}
        onClose={() => setShowDobPicker(false)}
        onConfirm={iso => {
          set('dob', iso);
          setShowDobPicker(false);
        }}
      />
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
  inlineHint: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  dobValue:   { color: colors.light, fontSize: 15 },
  dobPlaceholder: { color: colors.white30, fontSize: 15 },
  strengthWrap: { marginTop: 10, gap: 4 },
  strengthBars: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)' },
  ruleText:   { fontSize: 12, fontWeight: '600' },
  lockedHint: { fontSize: 11, color: colors.teal, marginTop: 6 },
  termsRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 16, marginBottom: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.blue, borderColor: colors.blue },
  checkmark:  { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 16 },
  termsText:  { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20 },
  termsLink:  { color: colors.teal, fontWeight: '600' },
  submitBtn:  { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchLink: { marginTop: 20, alignItems: 'center' },
  switchText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 22, paddingBottom: 32,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.light, textAlign: 'center' },
  modalHint:  { fontSize: 13, color: colors.white30, textAlign: 'center', marginTop: 4, marginBottom: 14 },
  wheels:     { flexDirection: 'row', gap: 8, height: 220, marginBottom: 16 },
  wheel:      { flex: 1, backgroundColor: colors.dark, borderRadius: 14 },
  wheelItem:  { paddingVertical: 10, alignItems: 'center' },
  wheelItemActive: { backgroundColor: 'rgba(9,132,227,0.25)' },
  wheelText:  { color: colors.white50, fontSize: 15, fontWeight: '600' },
  wheelTextActive: { color: colors.light, fontWeight: '800' },
  modalBtn:   { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalCancel: { alignItems: 'center', paddingVertical: 14 },
  modalCancelText: { color: colors.white50, fontWeight: '600' },
});
