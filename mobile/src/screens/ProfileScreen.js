import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../utils/theme';
import { useAuth } from '../store/authStore';
import { getProfile, logout, updatePassword } from '../api';
import { buildReferralLink } from '../utils/referral';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const BADGES = [
  { id: 'first_game',     label: 'First Game',      emoji: '🎮', condition: p => p.total_games_played >= 1 },
  { id: 'first_win',      label: 'First Win',        emoji: '🏆', condition: p => parseFloat(p.total_won) > 0 },
  { id: 'perfect_score',  label: 'Perfect Score',    emoji: '💯', condition: p => (p.best_score || 0) >= 10 },
  { id: 'high_roller',    label: 'High Roller',      emoji: '💰', condition: p => parseFloat(p.total_staked) >= 100 },
  { id: 'ten_games',      label: '10 Games Played',  emoji: '🎯', condition: p => p.total_games_played >= 10 },
  { id: 'big_winner',     label: 'Big Winner',       emoji: '🤑', condition: p => parseFloat(p.total_won) >= 50 },
];

export default function ProfileScreen({ navigation }) {
  const { signOut }  = useAuth();

  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' });
  const [loading, setLoading] = useState(false);

  const { data: profileData } = useQuery({ queryKey: ['profile'],  queryFn: getProfile });

  const profile   = profileData?.data;
  const winRate   = profile?.win_rate ?? 0;
  const bestScore = profile?.best_score ?? 0;

  async function handleChangePassword() {
    if (!pwForm.old_password || !pwForm.new_password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await updatePassword(pwForm);
      Alert.alert('Success', res.data.message);
      setShowPwModal(false);
      setPwForm({ old_password: '', new_password: '' });
    } catch (err) {
      Alert.alert('Error', err?.error?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try { await logout(); } catch {}
          signOut();
        },
      },
    ]);
  }

  async function handleShareReferral() {
    const link = buildReferralLink(profile?.referral_code);
    if (!link) return;
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message: 'Join me on ThinkTrophy!', url: link }
          : { message: `Join me on ThinkTrophy! ${link}`, title: 'ThinkTrophy' }
      );
    } catch {
      // User dismissed the share sheet
    }
  }

  async function handleCopyReferralLink() {
    const link = buildReferralLink(profile?.referral_code);
    if (!link) return;
    await Clipboard.setStringAsync(link);
    Alert.alert('Copied!', 'Referral link copied to clipboard.');
  }

  if (!profile) return null;

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.avatarArea}>
            <LinearGradient colors={[colors.blue, colors.teal]} style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.username[0].toUpperCase()}</Text>
            </LinearGradient>
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.memberSince}>Member since {format(new Date(profile.created_at), 'MMMM yyyy')}</Text>
            
            {profile.referral_code && (
              <View style={styles.referralCard}>
                <Text style={styles.referralLabel}>Referral Link</Text>
                <Text style={styles.referralLink} numberOfLines={1}>
                  {buildReferralLink(profile.referral_code)}
                </Text>
                <View style={styles.referralActions}>
                  <TouchableOpacity onPress={handleShareReferral} style={styles.referralShareBtn} activeOpacity={0.8}>
                    <Text style={styles.referralShareText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCopyReferralLink} style={styles.referralCopyBtn} activeOpacity={0.8}>
                    <Text style={styles.referralCopyText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Total Games',   value: profile.total_games_played, color: colors.blue },
              { label: 'Win Rate',      value: `${winRate}%`,              color: colors.teal },
              { label: 'Total Staked',  value: fmt(profile.total_staked),  color: colors.yellow },
              { label: 'Total Earned',  value: fmt(profile.total_won),     color: colors.green },
              { label: 'Best Score',    value: `${bestScore}/10`,         color: colors.teal },
              { label: 'Balance',       value: fmt(profile.wallet_balance), color: colors.blue },
            ].map(s => (
              <View key={s.label} style={styles.statCard}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Badges */}
          <Text style={styles.sectionTitle}>Achievement Badges</Text>
          <View style={styles.badgesRow}>
            {BADGES.map(badge => {
              const earned = profile && badge.condition(profile);
              return (
                <View key={badge.id} style={[styles.badge, !earned && styles.badgeLocked]}>
                  <Text style={{ fontSize: 24, opacity: earned ? 1 : 0.3 }}>{badge.emoji}</Text>
                  <Text style={[styles.badgeLabel, !earned && { color: colors.white30 }]}>{badge.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Game history link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('GameHistory')}
            style={styles.historyBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.historyIcon}>🎮</Text>
            <Text style={styles.historyText}>View Game History</Text>
            <Text style={styles.historyChevron}>›</Text>
          </TouchableOpacity>

          {/* Change Password link */}
          <TouchableOpacity
            onPress={() => setShowPwModal(true)}
            style={styles.historyBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.historyIcon}>🔐</Text>
            <Text style={styles.historyText}>Change Password</Text>
            <Text style={styles.historyChevron}>›</Text>
          </TouchableOpacity>

          {/* Sign out */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={showPwModal} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Change Password</Text>
              
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.white30}
                value={pwForm.old_password}
                onChangeText={v => setPwForm(f => ({ ...f, old_password: v }))}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.white30}
                value={pwForm.new_password}
                onChangeText={v => setPwForm(f => ({ ...f, new_password: v }))}
              />

              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setShowPwModal(false)} style={styles.modalBtnCancel}>
                  <Text style={{ color: colors.white50, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleChangePassword} disabled={loading} style={styles.modalBtnSubmit}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Update</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:      { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  avatarArea:  { alignItems: 'center', marginBottom: 28 },
  avatar:      { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:  { fontSize: 36, fontWeight: '900', color: '#fff' },
  username:    { fontSize: 22, fontWeight: '800', color: colors.light },
  memberSince: { fontSize: 13, color: colors.white30, marginTop: 4 },
  referralCard: {
    width: '100%', marginTop: 16, backgroundColor: colors.card, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  referralLabel: { fontSize: 12, color: colors.white50, marginBottom: 6, fontWeight: '600' },
  referralLink: { fontSize: 13, fontWeight: '600', color: colors.teal, marginBottom: 12 },
  referralActions: { flexDirection: 'row', gap: 8 },
  referralShareBtn: {
    flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.blue,
  },
  referralShareText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  referralCopyBtn: {
    flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  referralCopyText: { color: colors.light, fontWeight: '700', fontSize: 14 },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  statCard: {
    width: '31%', backgroundColor: colors.card, borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue:   { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  statLabel:   { fontSize: 10, color: colors.white30, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.light, marginBottom: 14 },
  badgesRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  badge: {
    width: '30%', backgroundColor: colors.card, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  badgeLocked: { borderColor: 'rgba(255,255,255,0.03)' },
  badgeLabel:  { fontSize: 10, color: colors.white50, textAlign: 'center', fontWeight: '600' },
  historyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 12,
  },
  historyIcon:    { fontSize: 20, marginRight: 12 },
  historyText:    { flex: 1, color: colors.light, fontWeight: '700', fontSize: 15 },
  historyChevron: { fontSize: 22, color: colors.white30 },
  logoutBtn: {
    borderRadius: 16, height: 50, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.light, marginBottom: 20 },
  label: { fontSize: 13, color: colors.white50, marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: colors.dark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.light, fontSize: 15,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 12 },
  modalBtnCancel: { paddingVertical: 12, paddingHorizontal: 16 },
  modalBtnSubmit: { backgroundColor: colors.blue, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
});
