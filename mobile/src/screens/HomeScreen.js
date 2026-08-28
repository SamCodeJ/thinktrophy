import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../utils/theme';
import { useAuth } from '../store/authStore';
import { getProfile, getGameHistory, getLeaderboard, resendVerification } from '../api';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function RecentGame({ game, onPress }) {
  const won = parseFloat(game.payout_amount) > 0;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.gameCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={styles.gameScore}>{game.score}/10</Text>
          <Text style={styles.gameLabel}>Score</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.gamePayout, { color: won ? colors.green : colors.white50 }]}>
            {won ? `+${fmt(game.payout_amount)}` : `−${fmt(game.stake_amount)}`}
          </Text>
          <Text style={styles.gameLabel}>{won ? 'Won' : 'Lost'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.gameStake}>{fmt(game.stake_amount)}</Text>
          <Text style={styles.gameLabel}>Stake</Text>
        </View>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', marginLeft: 8 }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [resending, setResending] = useState(false);

  // Refresh balance and history every time the home screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }, [])
  );

  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { data: historyData } = useQuery({ queryKey: ['history'], queryFn: getGameHistory });
  const { data: lbData }      = useQuery({ queryKey: ['leaderboard', 'weekly'], queryFn: () => getLeaderboard('weekly') });

  const profile  = profileData?.data || user;
  const history  = [...new Map((historyData?.data || []).map(g => [g.id, g])).values()].slice(0, 3);
  const leaders  = [...new Map((lbData?.data || []).map(p => [p.id, p])).values()].slice(0, 5);
  const balance  = parseFloat(profile?.wallet_balance || 0);
  const isVerified = profile?.email_verified;

  async function handleResendVerification() {
    if (!profile?.email) return;
    setResending(true);
    try {
      const res = await resendVerification({ email: profile.email });
      Alert.alert('Verification Sent', res.data.message);
    } catch (err) {
      Alert.alert('Error', err?.error?.message || 'Failed to resend verification.');
    } finally {
      setResending(false);
    }
  }

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcome}>Hey, {profile?.username || 'Player'} 👋</Text>
              <Text style={styles.sub}>Ready to win today?</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
                {(profile?.username || 'P')[0].toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Wallet balance card */}
          <LinearGradient colors={[colors.blue, colors.teal]} style={styles.walletCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Text style={styles.walletBalance}>{fmt(balance)}</Text>
            <Text style={styles.walletSub}>Available to stake</Text>
          </LinearGradient>

          {/* Play Now CTA / Verification Card */}
          {isVerified ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('CategorySelection')}
              activeOpacity={0.85}
              style={styles.playCTAWrapper}
            >
              <LinearGradient colors={['#0984E3', '#00CEC9']} style={styles.playCTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.playIcon}>🎮</Text>
                <View>
                  <Text style={styles.playTitle}>Play Now</Text>
                  <Text style={styles.playHint}>Select 7 categories · Stake · Win</Text>
                </View>
                <Text style={styles.playArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.verifyCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>✉️</Text>
              <Text style={styles.verifyTitle}>Verify Your Email</Text>
              <Text style={styles.verifyDesc}>
                You have not verified your email. You cannot play games until you verify your account.
              </Text>
              <TouchableOpacity onPress={handleResendVerification} disabled={resending} activeOpacity={0.8} style={styles.verifyBtn}>
                {resending ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>Resend Verification Link</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Recent games */}
          {history.length > 0 && (
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Recent Games</Text>
                <TouchableOpacity onPress={() => navigation.navigate('GameHistory')}>
                  <Text style={{ color: colors.blue, fontSize: 13, fontWeight: '600' }}>See all ›</Text>
                </TouchableOpacity>
              </View>
              {history.map(g => (
                <RecentGame
                  key={g.id}
                  game={g}
                  onPress={() => navigation.navigate('GameTranscript', { sessionId: g.id })}
                />
              ))}
            </View>
          )}

          {/* Mini leaderboard */}
          {leaders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏆 Top Players This Week</Text>
              {leaders.map((p, i) => (
                <View key={p.id} style={styles.leaderRow}>
                  <Text style={[styles.rank, i < 3 && { color: colors.teal }]}>#{i + 1}</Text>
                  <Text style={styles.leaderName}>{p.username}</Text>
                  <Text style={styles.leaderAmount}>{fmt(p.total_won)}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:       { paddingHorizontal: 20, paddingBottom: 32 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 20 },
  welcome:      { fontSize: 22, fontWeight: '800', color: colors.light },
  sub:          { fontSize: 14, color: colors.white50, marginTop: 2 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  walletCard: {
    borderRadius: 20, padding: 24, marginBottom: 16,
    shadowColor: colors.blue, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16,
  },
  walletLabel:   { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  walletBalance: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 4 },
  walletSub:     { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 },
  playCTAWrapper: { marginBottom: 24 },
  playCTA: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 20,
    shadowColor: colors.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  playIcon:  { fontSize: 28 },
  playTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  playHint:  { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  playArrow: { marginLeft: 'auto', color: '#fff', fontSize: 20, fontWeight: '700' },
  verifyCard: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24
  },
  verifyTitle: { fontSize: 18, fontWeight: '800', color: colors.red, marginBottom: 8, textAlign: 'center' },
  verifyDesc: { fontSize: 13, color: colors.white50, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  verifyBtn: {
    backgroundColor: colors.red, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center'
  },
  verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.light, marginBottom: 12 },
  gameCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  gameScore:  { fontSize: 20, fontWeight: '800', color: colors.light },
  gamePayout: { fontSize: 16, fontWeight: '700' },
  gameStake:  { fontSize: 14, fontWeight: '600', color: colors.white50 },
  gameLabel:  { fontSize: 10, color: colors.white30, marginTop: 2 },
  leaderRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  rank:       { width: 32, fontSize: 14, fontWeight: '700', color: colors.white50 },
  leaderName: { flex: 1, fontSize: 14, color: colors.light, fontWeight: '600' },
  leaderAmount: { fontSize: 14, fontWeight: '700', color: colors.teal },
});
