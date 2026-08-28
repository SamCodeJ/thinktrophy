import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '../utils/theme';
import { getSessionResult } from '../api';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ScoreCounter({ target, duration = 1200 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const steps = 30;
    const step  = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.round(current));
      if (current >= target) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);
  return <Text style={styles.scoreCount}>{count}</Text>;
}

export default function ResultScreen({ navigation, route }) {
  const { sessionId, score: routeScore, payout: routePayout, stakeAmount, expired, kioskEnded, taxAmount: routeTax, grossPayout: routeGross } = route.params;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const trophyAnim = useRef(new Animated.Value(0)).current;
  const [showReview, setShowReview] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['result', sessionId],
    queryFn:  () => getSessionResult(sessionId),
    enabled:  !!sessionId,
  });

  const result       = data?.data;

  // Invalidate wallet/profile cache as soon as result arrives so balance is fresh
  useEffect(() => {
    if (result) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['gameHistory'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  }, [result]);
  const score        = result?.score    ?? routeScore    ?? 0;
  const payout       = result?.payout   ?? routePayout   ?? 0;
  const stake        = result?.stakeAmount ?? stakeAmount ?? 0;
  const taxAmount    = result?.taxAmount ?? routeTax ?? 0;
  const grossPayout  = result?.grossPayout ?? routeGross ?? (parseFloat(payout) + parseFloat(taxAmount));
  const questionReview = result?.questionReview || [];
  const won          = payout > 0;
  const taxableWinnings = grossPayout > stake ? grossPayout - stake : grossPayout;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(trophyAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
    ]).start();

    if (kioskEnded) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (won)   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [won]);

  const trophyScale = trophyAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Trophy / result icon */}
            <Animated.View style={[styles.iconArea, { transform: [{ scale: trophyScale }] }]}>
              {kioskEnded ? (
                <Text style={{ fontSize: 72 }}>🔒</Text>
              ) : expired ? (
                <Text style={{ fontSize: 72 }}>⏰</Text>
              ) : score === 10 ? (
                <Text style={{ fontSize: 72 }}>🏆</Text>
              ) : score >= 9 ? (
                <Text style={{ fontSize: 72 }}>🥈</Text>
              ) : (
                <Text style={{ fontSize: 72 }}>📚</Text>
              )}
            </Animated.View>

            {/* Score display */}
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>
                {kioskEnded ? 'Game Ended' : expired ? 'Time Expired!' : won ? 'You Won!' : 'Better Luck Next Time'}
              </Text>
              {kioskEnded && (
                <Text style={[styles.scoreSubLabel, { color: colors.red, marginBottom: 4, textAlign: 'center' }]}>
                  You closed the app too many times during this game.
                </Text>
              )}
              <View style={styles.scoreRow}>
                <ScoreCounter target={score} />
                <Text style={styles.scoreDivider}>/10</Text>
              </View>
              <Text style={styles.scoreSubLabel}>Correct Answers</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontFamily: 'monospace' }}>
                Game ID: {sessionId.substring(0, 8).toUpperCase()}
              </Text>
            </View>

            {/* Payout display */}
            <View style={[styles.payoutCard, { borderColor: won ? `${colors.green}40` : 'rgba(255,255,255,0.08)' }]}>
              {won ? (
                <>
                  <Text style={styles.payoutLabel}>Credited to Wallet</Text>
                  <Text style={styles.payoutAmount}>{fmt(payout)}</Text>
                  {taxAmount > 0 ? (
                    <Text style={styles.payoutSub}>
                      Winnings {fmt(taxableWinnings)} · Tax {fmt(taxAmount)}
                    </Text>
                  ) : (
                    <Text style={styles.payoutSub}>
                      {payout >= stake ? `+${fmt(payout - stake)} profit` : `-${fmt(stake - payout)} loss`} · Credited to wallet
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.payoutLabel}>Staked</Text>
                  <Text style={[styles.payoutAmount, { color: colors.white50 }]}>{fmt(stake)}</Text>
                  <Text style={[styles.payoutSub, { color: colors.white30 }]}>
                    Score 9+ to win next time
                  </Text>
                </>
              )}
            </View>

            {/* Question review toggle */}
            {questionReview.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowReview(s => !s)}
                style={styles.reviewToggle}
              >
                <Text style={styles.reviewToggleText}>
                  {showReview ? 'Hide' : 'Show'} Question Review ▾
                </Text>
              </TouchableOpacity>
            )}

            {showReview && (
              <View style={styles.reviewList}>
                {questionReview.map((q, i) => (
                  <View key={q.question_id} style={[styles.reviewItem, { borderColor: q.is_correct ? `${colors.green}30` : `${colors.red}30`, backgroundColor: q.is_correct ? 'rgba(0,184,148,0.06)' : 'rgba(239,68,68,0.06)' }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewQNum}>Q{i + 1}</Text>
                      <Text style={{ fontSize: 14 }}>{q.is_correct ? '✅' : '❌'}</Text>
                    </View>
                    <Text style={styles.reviewQ}>{q.question_text}</Text>
                    {!q.is_correct && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.reviewWrong}>Your answer: {q.options[q.chosen_option] || '—'}</Text>
                        <Text style={styles.reviewCorrect}>Correct: {q.correct_text}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Action buttons */}
            <TouchableOpacity
              onPress={() => navigation.navigate('CategorySelection')}
              activeOpacity={0.85}
              style={{ marginTop: 16 }}
            >
              <LinearGradient colors={[colors.blue, colors.teal]} style={styles.actionBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.actionBtnText}>🎮 Play Again</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Main')}
              style={styles.homeBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.homeBtnText}>🏠 Go Home</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:       { paddingHorizontal: 24, paddingVertical: 32, paddingBottom: 48 },
  iconArea:     { alignItems: 'center', marginBottom: 24 },
  scoreCard:    { alignItems: 'center', marginBottom: 20 },
  scoreLabel:   { fontSize: 24, fontWeight: '800', color: colors.light, textAlign: 'center' },
  scoreRow:     { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  scoreCount:   { fontSize: 72, fontWeight: '900', color: colors.teal },
  scoreDivider: { fontSize: 32, fontWeight: '700', color: colors.white30, marginBottom: 8, marginLeft: 4 },
  scoreSubLabel: { fontSize: 14, color: colors.white30, marginTop: 4 },
  payoutCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 20,
    alignItems: 'center', borderWidth: 2, marginBottom: 16,
  },
  payoutLabel:  { fontSize: 13, color: colors.white50, fontWeight: '600', marginBottom: 4 },
  payoutAmount: { fontSize: 36, fontWeight: '900', color: colors.green },
  payoutSub:    { fontSize: 12, color: 'rgba(0,184,148,0.7)', marginTop: 4 },
  reviewToggle: { alignItems: 'center', paddingVertical: 12 },
  reviewToggleText: { color: colors.blue, fontSize: 14, fontWeight: '600' },
  reviewList: { gap: 10, marginBottom: 8 },
  reviewItem: { borderRadius: 14, padding: 14, borderWidth: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewQNum:   { fontSize: 12, fontWeight: '700', color: colors.white30 },
  reviewQ:      { fontSize: 14, color: colors.light, lineHeight: 20 },
  reviewWrong:  { fontSize: 13, color: `${colors.red}cc`, marginBottom: 2 },
  reviewCorrect: { fontSize: 13, color: colors.green, fontWeight: '600' },
  actionBtn:    { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  homeBtn:      { marginTop: 12, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  homeBtnText:  { color: colors.white50, fontSize: 15, fontWeight: '600' },
});
