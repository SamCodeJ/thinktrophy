import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  BackHandler, Alert, Dimensions, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ScreenCapture from 'expo-screen-capture';
import { submitAnswer, abandonSession } from '../api';
import { colors } from '../utils/theme';
import { useKiosk } from '../store/kioskStore';

const { width } = Dimensions.get('window');
const FEEDBACK_DELAY = 800;

function TimerRing({ timeLeft, totalTime }) {
  const progress = timeLeft / totalTime;
  const isUrgent = timeLeft <= 10;
  const size = 70;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * progress;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* SVG-like ring using border */}
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 5,
        borderColor: isUrgent ? colors.red : colors.teal,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
      }}>
        <Text style={{
          fontSize: 18, fontWeight: '900',
          color: isUrgent ? colors.red : colors.light,
        }}>
          {timeLeft}
        </Text>
      </View>
    </View>
  );
}

function AnswerOption({ option, status, onPress, disabled }) {
  const isSelected = status === 'selected';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.optionBtn,
        {
          backgroundColor: isSelected ? colors.blue          : 'rgba(255,255,255,0.07)',
          borderColor:     isSelected ? colors.blue          : 'rgba(255,255,255,0.1)',
        },
      ]}
    >
      <Text style={[styles.optionText, isSelected && { color: '#fff', fontWeight: '700' }]}>
        {option.text}
      </Text>
    </TouchableOpacity>
  );
}

export default function GameScreen({ navigation, route }) {
  const { sessionId, sessionToken: initToken, firstQuestion, questionNumber: initNum, gameDuration } = route.params;

  const TOTAL_TIME = gameDuration || 60;

  const [question, setQuestion]         = useState(firstQuestion);
  const [questionNum, setQuestionNum]   = useState(initNum || 1);
  const [sessionToken]                  = useState(initToken);
  const [timeLeft, setTimeLeft]         = useState(TOTAL_TIME);
  const [selectedUuid, setSelectedUuid] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef          = useRef(null);
  const slideAnim         = useRef(new Animated.Value(0)).current;

  // Kiosk mode
  const { kioskEnabled, warningCount } = useKiosk();
  const closeCountRef      = useRef(0);   // how many times player backgrounded the app
  const kioskAbandonedRef  = useRef(false);
  const prevAppStateRef    = useRef(AppState.currentState);
  const gameEndedRef       = useRef(false); // set true when game finishes normally

  // Block hardware back during game
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Block screenshots while this screen is focused
  useFocusEffect(
    useCallback(() => {
      ScreenCapture.preventScreenCaptureAsync();
      return () => {
        ScreenCapture.allowScreenCaptureAsync();
      };
    }, [])
  );

  // Kiosk: monitor app backgrounding
  useEffect(() => {
    if (!kioskEnabled) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = prevAppStateRef.current;
      prevAppStateRef.current = nextState;

      // Player sent the app to background
      if (prev === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        if (gameEndedRef.current) return; // game already over, no penalty
        closeCountRef.current += 1;

        if (closeCountRef.current > warningCount) {
          // Threshold exceeded — abandon the session immediately
          kioskAbandonedRef.current = true;
          clearInterval(timerRef.current);
          abandonSession(sessionId).catch(() => {});
        }
        return;
      }

      // Player returned to foreground
      if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
        if (kioskAbandonedRef.current) {
          navigation.replace('Result', { sessionId, kioskEnded: true });
          return;
        }

        if (closeCountRef.current > 0 && !gameEndedRef.current) {
          const remaining = warningCount - closeCountRef.current;
          Alert.alert(
            '⚠️ Kiosk Warning',
            remaining > 0
              ? `You closed the app ${closeCountRef.current} time(s). You have ${remaining} more close(s) before your game ends and your stake is lost.`
              : `Final warning! Closing the app one more time will end your game immediately and you will lose your stake.`,
            [{ text: 'Continue Playing', style: 'default' }],
            { cancelable: false }
          );
        }
      }
    });

    return () => sub.remove();
  }, [kioskEnabled, warningCount, sessionId]);

  // Countdown timer — only updates state, never navigates inside setter
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // When timer reaches 0: mark session expired on server, then navigate
  useEffect(() => {
    if (timeLeft === 0) {
      gameEndedRef.current = true;
      abandonSession(sessionId).catch(() => {}).finally(() => {
        navigation.replace('Result', { sessionId, expired: true });
      });
    }
  }, [timeLeft]);

  function slideInNext() {
    slideAnim.setValue(width);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }

  async function handleAnswer(option) {
    if (isSubmitting || selectedUuid) return;
    setIsSubmitting(true);
    setSelectedUuid(option.uuid);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await submitAnswer(sessionId, {
        answer_uuid:   option.uuid,
        session_token: sessionToken,
      });

      const { gameComplete, score, payout, stakeAmount, taxAmount, grossPayout,
              question: nextQ, questionNumber: nextNum } = res.data;

      // Brief pause so the user sees their selection highlighted, then move on
      setTimeout(() => {
        if (gameComplete) {
          gameEndedRef.current = true;
          clearInterval(timerRef.current);
          navigation.replace('Result', { sessionId, score, payout, stakeAmount, taxAmount, grossPayout });
        } else {
          setQuestion(nextQ);
          setQuestionNum(nextNum);
          setSelectedUuid(null);
          setIsSubmitting(false);
          slideInNext();
        }
      }, FEEDBACK_DELAY);
    } catch (err) {
      const msg = err?.error?.message || 'Network error';
      if (msg.includes('expired') || msg.includes('SESSION_EXPIRED')) {
        Alert.alert('Time Up!', 'Your session expired.', [
          { text: 'OK', onPress: () => navigation.replace('Main') }
        ]);
      } else {
        Alert.alert('Error', msg);
        setSelectedUuid(null);
        setIsSubmitting(false);
      }
    }
  }

  const isUrgent = timeLeft <= 10;

  return (
    <LinearGradient colors={[colors.darker, '#1a2b38']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar — timer + question number only, no live score */}
        <View style={styles.topBar}>
          <TimerRing timeLeft={timeLeft} totalTime={TOTAL_TIME} />
          <Text style={styles.qNumText}>Question {questionNum} / 10</Text>
          {/* Empty view keeps the timer centered */}
          <View style={{ width: 70 }} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[colors.blue, colors.teal]}
            style={[styles.progressFill, { width: `${(questionNum / 10) * 100}%` }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        </View>

        {/* Question */}
        <Animated.View style={[styles.questionArea, { transform: [{ translateX: slideAnim }] }]}>
          {question?.category_name && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{question.category_name}</Text>
            </View>
          )}
          <Text style={styles.questionText}>{question?.question_text}</Text>
        </Animated.View>

        {/* Options — only show selected state, never correct/wrong */}
        <View style={styles.options}>
          {(question?.options || []).map(opt => (
            <AnswerOption
              key={opt.uuid}
              option={opt}
              status={selectedUuid === opt.uuid ? 'selected' : null}
              onPress={() => handleAnswer(opt)}
              disabled={!!selectedUuid || isSubmitting}
            />
          ))}
        </View>

        {isUrgent && (
          <View style={styles.urgentBanner}>
            <Text style={styles.urgentText}>⚡ Hurry! {timeLeft} seconds left!</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  qNumText: { fontSize: 16, fontWeight: '700', color: colors.light },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  questionArea: { flex: 1, paddingHorizontal: 24, paddingTop: 24, justifyContent: 'center' },
  categoryBadge: {
    alignSelf: 'flex-start', marginBottom: 14,
    backgroundColor: 'rgba(0,206,201,0.15)', borderWidth: 1,
    borderColor: 'rgba(0,206,201,0.35)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  categoryText: { fontSize: 12, fontWeight: '700', color: colors.teal, letterSpacing: 0.5, textTransform: 'uppercase' },
  questionText: { fontSize: 22, fontWeight: '700', color: colors.light, lineHeight: 32 },
  options: { padding: 20, gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16,
    borderWidth: 2, minHeight: 56,
  },
  optionText: { flex: 1, fontSize: 15, color: colors.light, fontWeight: '500', lineHeight: 22 },
  urgentBanner: { marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  urgentText: { color: colors.red, fontWeight: '700', fontSize: 14 },
});
