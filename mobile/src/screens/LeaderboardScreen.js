import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../utils/theme';
import { getLeaderboard } from '../api';
import { useAuth } from '../store/authStore';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const MEDALS = ['🥇', '🥈', '🥉'];

function LeaderRow({ player, rank, isMe }) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.rankArea}>
        {rank <= 3
          ? <Text style={{ fontSize: 22 }}>{MEDALS[rank - 1]}</Text>
          : <Text style={[styles.rankText, { color: rank <= 10 ? colors.teal : colors.white30 }]}>#{rank}</Text>
        }
      </View>
      <View style={styles.playerInfo}>
        <View style={[styles.mini_avatar, { backgroundColor: isMe ? colors.blue : colors.card }]}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{player.username[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={[styles.playerName, isMe && { color: colors.teal }]}>
            {player.username}{isMe ? ' (You)' : ''}
          </Text>
          <Text style={styles.playerGames}>{player.games_played} games</Text>
        </View>
      </View>
      <Text style={styles.playerWon}>{fmt(player.total_won)}</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn:  () => getLeaderboard(period),
  });

  const leaders = [...new Map((data?.data || []).map(p => [p.id, p])).values()];

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <View style={styles.tabs}>
            {['weekly', 'all_time'].map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                activeOpacity={0.8}
                style={[styles.tab, period === p && styles.tabActive]}
              >
                {period === p ? (
                  <LinearGradient colors={[colors.blue, colors.teal]} style={styles.tabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={[styles.tabText, { color: '#fff' }]}>{p === 'weekly' ? 'This Week' : 'All Time'}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.tabText}>{p === 'weekly' ? 'This Week' : 'All Time'}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top 3 podium */}
        {leaders.length >= 3 && (
          <View style={styles.podium}>
            {[1, 0, 2].map(i => (
              <View key={i} style={[styles.podiumItem, i === 0 && styles.podiumFirst]}>
                <Text style={{ fontSize: i === 0 ? 36 : 24 }}>{MEDALS[i]}</Text>
                <View style={[styles.podiumAvatar, { backgroundColor: i === 0 ? colors.teal : colors.card }]}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: i === 0 ? 18 : 14 }}>
                    {leaders[i]?.username?.[0]?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{leaders[i]?.username}</Text>
                <Text style={[styles.podiumAmount, { color: i === 0 ? colors.teal : colors.white50 }]}>
                  {fmt(leaders[i]?.total_won)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Full list */}
        {isLoading ? (
          <ActivityIndicator color={colors.blue} style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={leaders}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <LeaderRow
                player={item}
                rank={index + 1}
                isMe={user && item.id === user.id}
              />
            )}
            ListEmptyComponent={
              <Text style={{ color: colors.white30, textAlign: 'center', paddingVertical: 40 }}>
                No data yet — be the first to play!
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header:      { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title:       { fontSize: 24, fontWeight: '800', color: colors.light, marginBottom: 14 },
  tabs:        { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: 4, gap: 4 },
  tab:         { flex: 1, borderRadius: 10, overflow: 'hidden' },
  tabActive:   {},
  tabGrad:     { paddingVertical: 8, alignItems: 'center' },
  tabText:     { color: colors.white50, fontSize: 13, fontWeight: '600', textAlign: 'center', paddingVertical: 8 },
  podium:      { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  podiumItem:  { flex: 1, alignItems: 'center', gap: 4 },
  podiumFirst: { marginBottom: 12 },
  podiumAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  podiumName:  { fontSize: 12, fontWeight: '600', color: colors.light, textAlign: 'center' },
  podiumAmount: { fontSize: 12, fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12,
  },
  rowMe: { backgroundColor: 'rgba(9,132,227,0.08)', borderRadius: 12, paddingHorizontal: 8, borderColor: `${colors.blue}20`, borderWidth: 1, borderBottomWidth: 1 },
  rankArea:    { width: 36, alignItems: 'center' },
  rankText:    { fontSize: 14, fontWeight: '700' },
  playerInfo:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  mini_avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  playerName:  { fontSize: 14, fontWeight: '600', color: colors.light },
  playerGames: { fontSize: 11, color: colors.white30, marginTop: 1 },
  playerWon:   { fontSize: 14, fontWeight: '700', color: colors.teal },
});
