import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { colors } from '../utils/theme';
import { getGameHistory } from '../api';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function SessionRow({ session, onPress }) {
  const won     = parseFloat(session.payout_amount) > 0;
  const expired = session.status === 'expired';
  const date    = session.completed_at || session.started_at;

  const statusColor = expired ? colors.yellow : won ? colors.green : colors.red;
  const statusLabel = expired ? 'Expired' : won ? 'Won' : 'Lost';
  const statusEmoji = expired ? '⏰' : won ? '🏆' : '📚';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={styles.row}>
      {/* Left — score + emoji */}
      <View style={[styles.scoreBox, { borderColor: `${statusColor}40` }]}>
        <Text style={{ fontSize: 22 }}>{statusEmoji}</Text>
        <Text style={[styles.scoreText, { color: statusColor }]}>
          {session.score ?? '—'}/10
        </Text>
      </View>

      {/* Middle — date + status */}
      <View style={styles.rowMid}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 }}>
          <Text style={styles.rowDate}>
            {date ? format(new Date(date), 'dd MMM yyyy · HH:mm') : 'In progress'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={{ fontSize: 10, color: colors.white30, fontFamily: 'monospace' }}>ID: {session.id.substring(0, 8).toUpperCase()}</Text>
        </View>
      </View>

      {/* Right — amounts */}
      <View style={styles.rowRight}>
        <Text style={[styles.payoutAmt, { color: won ? colors.green : colors.white50 }]}>
          {won ? `+${fmt(session.payout_amount)}` : won === false && !expired ? `−${fmt(session.stake_amount)}` : fmt(session.stake_amount)}
        </Text>
        <Text style={styles.stakeAmt}>Stake: {fmt(session.stake_amount)}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function GameHistoryScreen({ navigation }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['gameHistory'],
    queryFn:  getGameHistory,
  });

  const sessions = data?.data || [];

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Game History</Text>
          <View style={{ width: 60 }} />
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.teal} size="large" />
          </View>
        )}

        {isError && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load history.</Text>
            <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && sessions.length === 0 && (
          <View style={styles.center}>
            <Text style={{ fontSize: 48 }}>🎮</Text>
            <Text style={styles.emptyText}>No games played yet.</Text>
            <Text style={styles.emptySub}>Play your first game and it will appear here.</Text>
          </View>
        )}

        {!isLoading && sessions.length > 0 && (
          <FlatList
            data={sessions}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <SessionRow
                session={item}
                onPress={() => navigation.navigate('GameTranscript', { sessionId: item.id })}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
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
  list:     { padding: 16, paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  scoreBox: {
    width: 58, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, borderWidth: 1, paddingVertical: 8, marginRight: 12,
  },
  scoreText: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  rowMid:   { flex: 1 },
  rowDate:  { fontSize: 12, color: colors.white50, marginBottom: 4 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  rowRight:    { alignItems: 'flex-end', marginRight: 6 },
  payoutAmt:   { fontSize: 14, fontWeight: '700' },
  stakeAmt:    { fontSize: 11, color: colors.white30, marginTop: 2 },
  chevron:     { fontSize: 22, color: colors.white30, marginLeft: 2 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText:   { color: colors.red, fontSize: 15, fontWeight: '600' },
  retryBtn:    { backgroundColor: colors.blue, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText:   { color: '#fff', fontWeight: '700' },
  emptyText:   { color: colors.light, fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptySub:    { color: colors.white50, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});
