import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { colors } from '../utils/theme';
import { getCategories, createGameSession } from '../api';

// Legacy map for old-style icon_name strings; new categories store the emoji directly
const LEGACY_ICON_MAP = {
  flask: '🧪', landmark: '🏛️', trophy: '🏆', cpu: '💻', star: '⭐',
  music: '🎵', globe: '🌍', book: '📖', heart: '❤️', zap: '⚡',
};
const resolveIcon = name => LEGACY_ICON_MAP[name] || name || '📚';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CategorySelectionScreen({ navigation }) {
  const [selected, setSelected]     = useState([]);
  const [stakeInput, setStakeInput] = useState('');
  const [loading, setLoading]       = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const categories = data?.data || [];

  function toggleCategory(id) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(s => {
      if (s.includes(id)) return s.filter(i => i !== id);
      if (s.length >= 5)  return s;
      return [...s, id];
    });
  }

  const stake      = parseFloat(stakeInput) || 0;
  const canStart   = selected.length === 5 && stake >= 1;
  const potentialWin = (stake * 2).toFixed(2);

  async function handleStart() {
    if (!canStart) return;
    setLoading(true);
    try {
      const res = await createGameSession({
        category_ids: selected,
        stake_amount: stake,
      });
      navigation.replace('Game', {
        sessionId:    res.data.sessionId,
        sessionToken: res.data.sessionToken,
        firstQuestion: res.data.question,
        questionNumber: res.data.questionNumber,
      });
    } catch (err) {
      Alert.alert('Error', err?.error?.message || 'Could not start game. Check your wallet balance.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.white50, fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select 5 Categories</Text>
          <Text style={styles.sub}>Choose exactly 5 categories to play from ({selected.length}/5)</Text>

          {/* Categories grid */}
          {isLoading ? (
            <ActivityIndicator color={colors.blue} style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.grid}>
              {categories.map(cat => {
                const isSelected = selected.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    activeOpacity={0.8}
                    style={[styles.catCard, isSelected && styles.catCardSelected]}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[colors.blue, colors.teal]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      />
                    )}
                    <Text style={styles.catIcon}>{resolveIcon(cat.icon_name)}</Text>
                    <Text style={[styles.catName, isSelected && styles.catNameSelected]}>{cat.name}</Text>
                    <Text style={[styles.catCount, isSelected && styles.catCountSelected]}>
                      {cat.question_count} Q
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Stake section */}
          <View style={styles.stakeCard}>
            <Text style={styles.stakeLabel}>Stake Amount (USD)</Text>
            <View style={styles.stakeRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.stakeInput}
                placeholder="0.00"
                placeholderTextColor={colors.white30}
                value={stakeInput}
                onChangeText={setStakeInput}
                keyboardType="decimal-pad"
              />
            </View>
            {stake > 0 && (
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutLine}>
                  Perfect score (10/10): <Text style={{ color: colors.green, fontWeight: '700' }}>{fmt(stake * 2)}</Text>
                </Text>
                <Text style={styles.payoutLine}>
                  9/10 score: <Text style={{ color: colors.teal, fontWeight: '700' }}>{fmt(stake * 1.5)}</Text>
                </Text>
                <Text style={[styles.payoutLine, { color: colors.white30 }]}>
                  ≤ 8/10: ₦0.00 (stake lost)
                </Text>
              </View>
            )}
          </View>

          {/* Summary */}
          {canStart && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>
                ✅ You are staking <Text style={{ color: colors.yellow, fontWeight: '700' }}>{fmt(stake)}</Text>.{' '}
                Win <Text style={{ color: colors.green, fontWeight: '700' }}>{fmt(potentialWin)}</Text> with a perfect score!
              </Text>
            </View>
          )}

          {/* Start button */}
          <TouchableOpacity
            onPress={handleStart}
            disabled={!canStart || loading}
            activeOpacity={0.85}
            style={{ marginTop: 16, marginBottom: 24 }}
          >
            <LinearGradient
              colors={canStart ? [colors.blue, colors.teal] : ['#333', '#444']}
              style={styles.startBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.startBtnText}>
                    {!canStart && selected.length < 5
                      ? `Select ${5 - selected.length} more categor${5 - selected.length === 1 ? 'y' : 'ies'}`
                      : !canStart && stake < 1
                        ? 'Enter stake amount ($1 min)'
                        : '🎮 Start Game'}
                  </Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:    { paddingHorizontal: 20, paddingTop: 16 },
  title:     { fontSize: 24, fontWeight: '800', color: colors.light, marginBottom: 6 },
  sub:       { fontSize: 14, color: colors.white50, marginBottom: 24 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  catCard: {
    width: '47%', borderRadius: 18, padding: 16,
    backgroundColor: colors.card, borderWidth: 2, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', overflow: 'hidden', position: 'relative',
  },
  catCardSelected: { borderColor: colors.blue },
  catIcon:        { fontSize: 32, marginBottom: 8 },
  catName:        { fontSize: 14, fontWeight: '700', color: colors.white50, textAlign: 'center' },
  catNameSelected: { color: '#fff' },
  catCount:       { fontSize: 11, color: colors.white30, marginTop: 4 },
  catCountSelected: { color: 'rgba(255,255,255,0.7)' },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  stakeCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  stakeLabel: { fontSize: 13, color: colors.white50, fontWeight: '600', marginBottom: 10 },
  stakeRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dollarSign: { fontSize: 24, fontWeight: '700', color: colors.teal },
  stakeInput: { flex: 1, fontSize: 32, fontWeight: '800', color: colors.light },
  payoutInfo: { marginTop: 14, gap: 4 },
  payoutLine: { fontSize: 13, color: colors.white50 },
  summaryCard: { backgroundColor: 'rgba(9,132,227,0.12)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(9,132,227,0.25)' },
  summaryText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  startBtn:    { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  yellow: colors.yellow,
});
