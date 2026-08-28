import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../utils/theme';
import { getCategories, createGameSession, getProfile, getPublicSettings, getGameHistory } from '../api';
import { useAuth } from '../store/authStore';

// Legacy map for old-style icon_name strings; new categories store the emoji directly
const LEGACY_ICON_MAP = {
  flask: '🧪', landmark: '🏛️', trophy: '🏆', cpu: '💻', star: '⭐',
  music: '🎵', globe: '🌍', book: '📖', heart: '❤️', zap: '⚡',
};
const resolveIcon = name => LEGACY_ICON_MAP[name] || name || '📚';

const MIN_STAKE = 500;
const MAX_STAKE = 5000;
const REQUIRED_CATEGORIES = 7;
const EMPTY_CATEGORIES = [];

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function categoriesStorageKey(userId) {
  return `last_selected_categories:${userId || 'guest'}`;
}

export default function CategorySelectionScreen({ navigation }) {
  const { user } = useAuth();
  const [selected, setSelected]     = useState([]);
  const [stakeInput, setStakeInput] = useState('');
  const [loading, setLoading]       = useState(false);
  const restoredRef = useRef(false);

  const { data: catData, isLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 0,
  });
  const { data: profileData }        = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { data: settingsData }       = useQuery({ queryKey: ['public-settings'], queryFn: getPublicSettings });
  const { data: historyData }        = useQuery({ queryKey: ['history'], queryFn: getGameHistory });
  
  useFocusEffect(
    React.useCallback(() => {
      refetchCategories();
    }, [refetchCategories])
  );

  const categories = catData?.data || EMPTY_CATEGORIES;
  const playableIds = new Set(categories.filter(c => !c.exhausted).map(c => c.id));
  const playableCount = playableIds.size;
  const balance    = parseFloat(profileData?.data?.wallet_balance || user?.wallet_balance || 0);

  useEffect(() => {
    if (restoredRef.current || !categories.length) return;
    let cancelled = false;

    (async () => {
      let ids = [];
      try {
        const raw = await AsyncStorage.getItem(categoriesStorageKey(user?.id));
        const stored = raw ? JSON.parse(raw) : [];
        if (Array.isArray(stored)) ids = stored.filter(id => playableIds.has(id));
      } catch {
        ids = [];
      }

      if (!ids.length) {
        const lastGame = (historyData?.data || []).find(g => Array.isArray(g.selected_category_ids) && g.selected_category_ids.length);
        if (lastGame) ids = lastGame.selected_category_ids.filter(id => playableIds.has(id));
      }

      if (cancelled) return;

      if (ids.length) {
        restoredRef.current = true;
        setSelected(s => (s.length ? s : ids.slice(0, REQUIRED_CATEGORIES)));
        return;
      }

      // Wait for history before giving up — last game is the fallback
      if (historyData !== undefined) restoredRef.current = true;
    })();

    return () => { cancelled = true; };
  }, [categories, historyData, user?.id]);

  useEffect(() => {
    setSelected(s => {
      const next = s.filter(id => playableIds.has(id));
      if (next.length === s.length) return s;
      persistSelection(next);
      return next;
    });
  }, [categories]);

  function persistSelection(ids) {
    AsyncStorage.setItem(categoriesStorageKey(user?.id), JSON.stringify(ids)).catch(() => {});
  }

  function toggleCategory(id) {
    if (!playableIds.has(id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(s => {
      const next = s.includes(id)
        ? s.filter(i => i !== id)
        : s.length >= REQUIRED_CATEGORIES
          ? s
          : [...s, id];
      persistSelection(next);
      return next;
    });
  }

  const stake        = parseFloat(stakeInput) || 0;
  const stakeValid   = stake >= MIN_STAKE && stake <= MAX_STAKE;
  const hasEnoughBalance = stake <= balance;
  const canStart     = selected.length === REQUIRED_CATEGORIES && stakeValid && hasEnoughBalance;
  const settings     = settingsData?.data || {};
  const taxRate      = parseFloat(settings.user_win_tax_percentage || '0.05');
  const payoutPerfect = parseFloat(settings.payout_perfect || '2.0');
  const payoutNine    = parseFloat(settings.payout_nine || '0.5');

  function netAfterTax(gross) {
    if (!(gross > 0) || !(stake > 0)) return 0;
    const winnings = gross > stake ? gross - stake : gross;
    const tax = Math.round(winnings * taxRate * 100) / 100;
    return Math.round((gross - tax) * 100) / 100;
  }

  const perfectGross = stake * payoutPerfect;
  const nineGross    = stake * payoutNine;
  const perfectNet   = netAfterTax(perfectGross);
  const nineNet      = netAfterTax(nineGross);
  const potentialWin = perfectNet;
  const taxPercentLabel = `${Math.round(taxRate * 100)}% tax`;

  async function handleStart() {
    if (!canStart) return;
    setLoading(true);
    try {
      const res = await createGameSession({
        category_ids: selected,
        stake_amount: stake,
      });
      persistSelection(selected);
      navigation.replace('Game', {
        sessionId:    res.data.sessionId,
        sessionToken: res.data.sessionToken,
        firstQuestion: res.data.question,
        questionNumber: res.data.questionNumber,
        gameDuration: res.data.gameDuration,
      });
    } catch (err) {
      const code = err?.error?.code;
      if (code === 'CATEGORY_EXHAUSTED' || code === 'INSUFFICIENT_QUESTIONS') {
        refetchCategories();
      }
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
          <Text style={styles.title}>Select {REQUIRED_CATEGORIES} Categories</Text>
          <Text style={styles.sub}>Choose exactly {REQUIRED_CATEGORIES} categories to play from ({selected.length}/{REQUIRED_CATEGORIES})</Text>
          {playableCount < REQUIRED_CATEGORIES && !isLoading && (
            <Text style={styles.exhaustedWarn}>
              You need {REQUIRED_CATEGORIES} categories with unused questions to start. You've completed {categories.filter(c => c.exhausted).length} categor{categories.filter(c => c.exhausted).length === 1 ? 'y' : 'ies'}.
            </Text>
          )}
          {categories.some(c => c.exhausted) && playableCount >= REQUIRED_CATEGORIES && (
            <Text style={styles.exhaustedHint}>Greyed-out categories have no unused questions left for you.</Text>
          )}

          {/* Categories grid */}
          {isLoading ? (
            <ActivityIndicator color={colors.blue} style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.grid}>
              {categories.map(cat => {
                const isSelected = selected.includes(cat.id);
                const exhausted = !!cat.exhausted;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    disabled={exhausted}
                    activeOpacity={exhausted ? 1 : 0.8}
                    style={[
                      styles.catCard,
                      isSelected && styles.catCardSelected,
                      exhausted && styles.catCardExhausted,
                    ]}
                  >
                    {isSelected && !exhausted && (
                      <LinearGradient
                        colors={[colors.blue, colors.teal]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      />
                    )}
                    <Text style={[styles.catIcon, exhausted && { opacity: 0.35 }]}>{resolveIcon(cat.icon_name)}</Text>
                    <Text style={[
                      styles.catName,
                      isSelected && styles.catNameSelected,
                      exhausted && styles.catNameExhausted,
                    ]}>{cat.name}</Text>
                    {exhausted ? (
                      <Text style={styles.exhaustedLabel}>Completed</Text>
                    ) : isSelected ? (
                      <View style={styles.checkBadge}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Stake section */}
          <View style={styles.stakeCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={styles.stakeLabel}>Stake Amount</Text>
                <Text style={styles.stakeRange}>₦{MIN_STAKE.toLocaleString('en-NG')} – ₦{MAX_STAKE.toLocaleString('en-NG')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.stakeLabel}>Balance</Text>
                <Text style={{ color: balance < stake ? colors.red : colors.green, fontWeight: '700', fontSize: 13 }}>
                  {fmt(balance)}
                </Text>
              </View>
            </View>

            {/* Quick-select amounts */}
            <View style={styles.quickStake}>
              {[500, 1000, 2000, 5000].map(amt => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setStakeInput(String(amt))}
                  style={[styles.quickBtn, stake === amt && styles.quickBtnActive]}
                >
                  <Text style={[styles.quickBtnText, stake === amt && styles.quickBtnTextActive]}>
                    ₦{amt.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.stakeRow}>
              <Text style={styles.nairaSign}>₦</Text>
              <TextInput
                style={styles.stakeInput}
                placeholder="0"
                placeholderTextColor={colors.white30}
                value={stakeInput}
                onChangeText={setStakeInput}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Validation hint */}
            {stake > 0 && !stakeValid && (
              <Text style={styles.stakeError}>
                {stake < MIN_STAKE
                  ? `Minimum stake is ₦${MIN_STAKE.toLocaleString('en-NG')}`
                  : `Maximum stake is ₦${MAX_STAKE.toLocaleString('en-NG')}`}
              </Text>
            )}
            {stake > 0 && stakeValid && !hasEnoughBalance && (
              <Text style={styles.stakeError}>
                Insufficient wallet balance. You need {fmt(stake - balance)} more.
              </Text>
            )}

            {stake > 0 && stakeValid && hasEnoughBalance && (
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutLine}>
                  Perfect score (10/10): <Text style={{ color: colors.green, fontWeight: '700' }}>{fmt(perfectNet)}</Text>
                  <Text style={{ color: colors.white30 }}> after {taxPercentLabel}</Text>
                </Text>
                <Text style={styles.payoutLine}>
                  9/10 score: <Text style={{ color: colors.teal, fontWeight: '700' }}>{fmt(nineNet)}</Text>
                  <Text style={{ color: colors.white30 }}> after {taxPercentLabel}</Text>
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
                    {selected.length < REQUIRED_CATEGORIES
                      ? `Select ${REQUIRED_CATEGORIES - selected.length} more categor${REQUIRED_CATEGORIES - selected.length === 1 ? 'y' : 'ies'}`
                      : !stakeValid
                        ? `Enter stake (₦${MIN_STAKE.toLocaleString('en-NG')}–₦${MAX_STAKE.toLocaleString('en-NG')})`
                        : !hasEnoughBalance
                          ? 'Insufficient Balance'
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
  sub:       { fontSize: 14, color: colors.white50, marginBottom: 8 },
  exhaustedHint: { fontSize: 12, color: colors.white30, marginBottom: 20 },
  exhaustedWarn: { fontSize: 13, color: colors.yellow, marginBottom: 20, lineHeight: 18 },
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
  catCardExhausted: {
    backgroundColor: '#2A3238',
    borderColor: 'rgba(255,255,255,0.04)',
    opacity: 0.7,
  },
  catNameExhausted: { color: '#8A9399' },
  exhaustedLabel: { fontSize: 10, color: '#8A9399', fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  stakeCard:      { backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  stakeLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stakeLabel:     { fontSize: 13, color: colors.white50, fontWeight: '600' },
  stakeRange:     { fontSize: 12, color: colors.teal, fontWeight: '600' },
  quickStake:     { flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickBtn:       { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  quickBtnActive: { backgroundColor: 'rgba(9,132,227,0.2)', borderColor: colors.blue },
  quickBtnText:   { fontSize: 12, fontWeight: '700', color: colors.white50 },
  quickBtnTextActive: { color: colors.blue },
  stakeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nairaSign:      { fontSize: 24, fontWeight: '700', color: colors.teal },
  stakeInput:     { flex: 1, fontSize: 32, fontWeight: '800', color: colors.light },
  stakeError:     { marginTop: 8, fontSize: 13, color: colors.red, fontWeight: '600' },
  payoutInfo:     { marginTop: 14, gap: 4 },
  payoutLine:     { fontSize: 13, color: colors.white50 },
  summaryCard: { backgroundColor: 'rgba(9,132,227,0.12)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(9,132,227,0.25)' },
  summaryText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  startBtn:    { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  yellow: colors.yellow,
});
