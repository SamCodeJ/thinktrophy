import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { colors } from '../utils/theme';
import { getSessionResult } from '../api';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatPill({ label, value, color }) {
  return (
    <View style={[styles.pill, { borderColor: `${color}30` }]}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

export default function GameTranscriptScreen({ navigation, route }) {
  const { sessionId } = route.params;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transcript', sessionId],
    queryFn:  () => getSessionResult(sessionId),
    enabled:  !!sessionId,
  });

  const result  = data?.data;
  const won     = result && parseFloat(result.payout) > 0;
  const expired = result?.status === 'expired';

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Game Transcript</Text>
          <View style={{ width: 60 }} />
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.teal} size="large" />
          </View>
        )}

        {isError && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load transcript.</Text>
            <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {result && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Summary card */}
            <LinearGradient
              colors={won ? ['#00B894', '#00CEC9'] : expired ? ['#6C5CE7', '#0984E3'] : ['#2d3748', '#1E272E']}
              style={styles.summaryCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.summaryEmoji}>
                {expired ? '⏰' : won ? '🏆' : '📚'}
              </Text>
              <Text style={styles.summaryOutcome}>
                {expired ? 'Time Expired' : won ? 'You Won!' : 'Better Luck Next Time'}
              </Text>
              <Text style={styles.summaryScore}>
                {result.score ?? 0} / {result.totalQuestions ?? 10}
              </Text>
              <Text style={styles.summaryScoreLabel}>Correct Answers</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginBottom: 6 }}>
                ID: {sessionId.substring(0, 8).toUpperCase()}
              </Text>
              {result.completedAt && (
                <Text style={styles.summaryDate}>
                  {format(new Date(result.completedAt), 'dd MMM yyyy · HH:mm')}
                </Text>
              )}
            </LinearGradient>

            {/* Stat pills */}
            <View style={styles.pills}>
              <StatPill label="Staked"  value={fmt(result.stakeAmount)} color={colors.white50} />
              <StatPill
                label={won ? 'Payout' : 'Lost'}
                value={won ? fmt(result.payout) : fmt(result.stakeAmount)}
                color={won ? colors.green : colors.red}
              />
              {won && (
                <StatPill
                  label="Profit"
                  value={fmt(result.payout - result.stakeAmount)}
                  color={colors.teal}
                />
              )}
              {won && result.taxAmount > 0 && (
                <StatPill
                  label="Tax"
                  value={`−${fmt(result.taxAmount)}`}
                  color={colors.red}
                />
              )}
            </View>

            {/* Question-by-question review */}
            <Text style={styles.reviewTitle}>Question Breakdown</Text>

            {(result.questionReview || []).map((q, i) => (
              <View
                key={q.question_id}
                style={[
                  styles.qCard,
                  {
                    borderColor: q.is_correct ? `${colors.green}35` : `${colors.red}35`,
                    backgroundColor: q.is_correct
                      ? 'rgba(0,184,148,0.07)'
                      : 'rgba(239,68,68,0.07)',
                  },
                ]}
              >
                {/* Question header */}
                <View style={styles.qHeader}>
                  <View style={styles.qNumWrap}>
                    <Text style={styles.qNum}>Q{i + 1}</Text>
                  </View>
                  <View style={[styles.diffBadge, { backgroundColor: diffColor(q.difficulty) + '22' }]}>
                    <Text style={[styles.diffText, { color: diffColor(q.difficulty) }]}>
                      {q.difficulty?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, marginLeft: 'auto' }}>
                    {q.is_correct ? '✅' : q.chosen_option ? '❌' : '⏭️'}
                  </Text>
                </View>

                {/* Question text */}
                <Text style={styles.qText}>{q.question_text}</Text>

                {/* Answer options */}
                <View style={styles.optionsList}>
                  {['a', 'b', 'c', 'd'].map(key => {
                    const text       = q.options?.[key];
                    if (!text) return null;
                    const isChosen   = key === q.chosen_option;
                    const isCorrect  = q.correct_option
                      ? key === q.correct_option
                      : (isChosen && Boolean(q.is_correct));
                    const isWrongPick = isChosen && !q.is_correct;

                    return (
                      <View
                        key={key}
                        style={[
                          styles.optionRow,
                          isCorrect   && styles.optionCorrect,
                          isWrongPick && styles.optionWrong,
                        ]}
                      >
                        <Text style={[
                          styles.optionKey,
                          isCorrect   && { color: colors.green },
                          isWrongPick && { color: colors.red },
                        ]}>
                          {key.toUpperCase()}
                        </Text>
                        <Text style={[
                          styles.optionText,
                          isCorrect   && { color: colors.green, fontWeight: '700' },
                          isWrongPick && { color: colors.red },
                        ]}>
                          {text}
                        </Text>
                        {isCorrect   && <Text style={styles.optionMark}>✓</Text>}
                        {isWrongPick && <Text style={styles.optionMark}>✗</Text>}
                      </View>
                    );
                  })}
                </View>

                {/* Skipped message */}
                {!q.chosen_option && (
                  <Text style={styles.skippedText}>⏭ Not answered (time expired)</Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function diffColor(difficulty) {
  switch (difficulty) {
    case 'easy':   return colors.green;
    case 'medium': return colors.yellow;
    case 'hard':   return colors.red;
    default:       return colors.white50;
  }
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  backBtn:  { width: 60 },
  backText: { color: colors.blue, fontSize: 16, fontWeight: '600' },
  title:    { fontSize: 17, fontWeight: '800', color: colors.light },
  scroll:   { padding: 16, paddingBottom: 40 },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: colors.red, fontSize: 15, fontWeight: '600' },
  retryBtn:  { backgroundColor: colors.blue, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700' },

  summaryCard: {
    borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16,
  },
  summaryEmoji:       { fontSize: 48, marginBottom: 6 },
  summaryOutcome:     { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  summaryScore:       { fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 60 },
  summaryScoreLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  summaryDate:        { fontSize: 12, color: 'rgba(255,255,255,0.55)' },

  pills:       { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  pill: {
    flex: 1, minWidth: 90, backgroundColor: colors.card, borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1,
  },
  pillValue: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  pillLabel: { fontSize: 11, color: colors.white30, fontWeight: '600' },

  reviewTitle: { fontSize: 16, fontWeight: '700', color: colors.light, marginBottom: 12 },

  qCard: { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1 },
  qHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  qNumWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  qNum:     { fontSize: 12, fontWeight: '800', color: colors.white50 },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  qText:    { fontSize: 15, fontWeight: '600', color: colors.light, lineHeight: 22, marginBottom: 12 },

  optionsList: { gap: 6 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  optionCorrect: { backgroundColor: 'rgba(0,184,148,0.12)' },
  optionWrong:   { backgroundColor: 'rgba(239,68,68,0.12)' },
  optionKey:  { width: 20, fontSize: 13, fontWeight: '800', color: colors.white30 },
  optionText: { flex: 1, fontSize: 13, color: colors.light, lineHeight: 19 },
  optionMark: { fontSize: 14, fontWeight: '800' },
  skippedText: { fontSize: 12, color: colors.yellow, marginTop: 10, fontStyle: 'italic' },
});
