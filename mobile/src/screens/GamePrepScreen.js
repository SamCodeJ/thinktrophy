import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing, BackHandler, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../utils/theme';
import { createGameSession, getPublicSettings } from '../api';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function instructionList(seconds) {
  const secs = Number(seconds) > 0 ? Number(seconds) : 60;
  return [
    { icon: '📝', text: 'You will answer 10 questions drawn from the 7 categories you selected.' },
    {
      icon: '⏱️',
      text: `You have ${secs} seconds in total for all 10 questions. The timer starts when Question 1 appears, counts down without pausing, and the game ends when it reaches 0.`,
    },
    {
      icon: '🚫',
      text: 'You cannot go back to a previous question. Once you pick an answer, that question is locked and the next one is shown.',
    },
    { icon: '✅', text: 'Tap an answer once. You cannot change it after you select.' },
    { icon: '🎯', text: 'Score 9/10 or 10/10 to win. 8 or below forfeits your stake.' },
    { icon: '📵', text: 'Stay in the app until the game ends. Closing it can end the session and lose your stake.' },
  ];
}

export default function GamePrepScreen({ navigation, route }) {
  const { category_ids, stake_amount, gameDuration: routeDuration } = route.params || {};
  const [phase, setPhase] = useState('instructions');
  const [count, setCount] = useState(5);
  const [starting, setStarting] = useState(false);
  const [duration, setDuration] = useState(Number(routeDuration) > 0 ? Number(routeDuration) : 60);
  const startedRef = useRef(false);
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Number(routeDuration) > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getPublicSettings();
        const secs = parseInt(res?.data?.game_duration || '60', 10);
        if (!cancelled && secs > 0) setDuration(secs);
      } catch {
        // keep default
      }
    })();
    return () => { cancelled = true; };
  }, [routeDuration]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'countdown') return;

    pulseCount();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const id = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'countdown' && count < 5) {
      pulseCount();
      if (count > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [count, phase]);

  useEffect(() => {
    if (phase !== 'countdown' || count !== 0 || starting) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startGame();
  }, [count, phase]);

  function pulseCount() {
    scale.setValue(0.4);
    pulse.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }

  function handleProceed() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCount(5);
    setPhase('countdown');
  }

  async function startGame() {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarting(true);
    try {
      const res = await createGameSession({
        category_ids,
        stake_amount,
      });
      navigation.replace('Game', {
        sessionId:     res.data.sessionId,
        sessionToken:  res.data.sessionToken,
        firstQuestion: res.data.question,
        questionNumber: res.data.questionNumber,
        gameDuration:  res.data.gameDuration,
      });
    } catch (err) {
      startedRef.current = false;
      const msg = err?.error?.message || 'Could not start the game. Please try again.';
      Alert.alert('Could not start', msg, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      setStarting(false);
      setPhase('instructions');
      setCount(5);
    }
  }

  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {phase === 'instructions' ? (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.kicker}>GET READY</Text>
            <Text style={styles.title}>How this game works</Text>
            <Text style={styles.sub}>
              Read these once, then start the countdown. Your stake of{' '}
              <Text style={{ color: colors.yellow, fontWeight: '700' }}>{fmt(stake_amount)}</Text>
              {' '}is deducted when the questions begin.
            </Text>

            <View style={styles.highlights}>
              <View style={styles.highlight}>
                <Text style={styles.highlightValue}>{duration}s</Text>
                <Text style={styles.highlightLabel}>Total time for all 10 questions</Text>
              </View>
              <View style={styles.highlight}>
                <Text style={styles.highlightValue}>No back</Text>
                <Text style={styles.highlightLabel}>You cannot return to a previous question</Text>
              </View>
            </View>

            <View style={styles.card}>
              {instructionList(duration).map((item, i, list) => (
                <View key={item.text} style={[styles.row, i < list.length - 1 && styles.rowDivider]}>
                  <Text style={styles.rowIcon}>{item.icon}</Text>
                  <Text style={styles.rowText}>{item.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={handleProceed} activeOpacity={0.85} style={{ marginTop: 8 }}>
              <LinearGradient colors={[colors.blue, colors.teal]} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.ctaText}>I'm Ready — Start Countdown</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={styles.countdownWrap}>
            <Text style={styles.countdownLabel}>{starting ? 'Loading questions' : 'Game starts in'}</Text>
            <View style={styles.countStage}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.countRing,
                  { opacity: ringOpacity, transform: [{ scale: ringScale }] },
                ]}
              />
              <Animated.Text style={[styles.countNum, { transform: [{ scale }] }]}>
                {count}
              </Animated.Text>
            </View>
            {starting ? (
              <ActivityIndicator color={colors.teal} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.countdownHint}>Stay focused. You will have {duration} seconds for all 10 questions, and you cannot go back.</Text>
            )}
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 },
  backBtn: { marginBottom: 16 },
  backText: { color: colors.white50, fontSize: 22 },
  kicker: { fontSize: 12, fontWeight: '800', color: colors.teal, letterSpacing: 1.6, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.light, marginBottom: 10 },
  sub: { fontSize: 15, color: colors.white50, lineHeight: 22, marginBottom: 16 },
  highlights: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  highlight: {
    flex: 1, backgroundColor: 'rgba(9,132,227,0.12)', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(9,132,227,0.28)',
  },
  highlightValue: { fontSize: 18, fontWeight: '800', color: colors.teal, marginBottom: 4 },
  highlightLabel: { fontSize: 12, color: colors.white50, lineHeight: 16, fontWeight: '600' },
  card: {
    backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 24,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowIcon: { fontSize: 22, width: 28, textAlign: 'center', marginTop: 1 },
  rowText: { flex: 1, fontSize: 15, color: colors.light, lineHeight: 22, fontWeight: '500' },
  cta: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  countdownWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  countdownLabel: { fontSize: 16, fontWeight: '700', color: colors.white50, marginBottom: 28, letterSpacing: 0.4 },
  countStage: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  countRing: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    borderWidth: 8, borderColor: colors.teal,
  },
  countNum: { fontSize: 120, fontWeight: '900', color: colors.light, lineHeight: 130 },
  countdownHint: { fontSize: 14, color: colors.white30, textAlign: 'center', lineHeight: 20 },
});
