import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { colors } from '../utils/theme';
import { getWallet, deposit, verifyPayment, withdraw } from '../api';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function TxRow({ tx }) {
  const typeIcon = { deposit: '⬇️', stake: '🎮', payout: '💰', withdrawal: '⬆️' };
  const typeColor = {
    deposit:    colors.green,
    payout:     colors.teal,
    stake:      colors.yellow,
    withdrawal: colors.red,
  };
  return (
    <View style={styles.txRow}>
      <View style={styles.txIcon}>
        <Text style={{ fontSize: 18 }}>{typeIcon[tx.type] || '💳'}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txType}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</Text>
        <Text style={styles.txDate}>{format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.txAmount, { color: typeColor[tx.type] || colors.light }]}>
          {tx.type === 'stake' || tx.type === 'withdrawal' ? '−' : '+'}{fmt(tx.amount)}
        </Text>
        <Text style={styles.txStatus}>{tx.status}</Text>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const qc = useQueryClient();

  // Refresh balance every time this tab comes into view
  useFocusEffect(
    React.useCallback(() => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    }, [])
  );

  const { data, isLoading } = useQuery({ queryKey: ['wallet'], queryFn: getWallet });
  const balance      = data?.data?.balance || 0;
  const transactions = data?.data?.transactions || [];

  const [depositModal, setDepositModal]   = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawForm, setWithdrawForm]   = useState({ amount: '', account_number: '', account_name: '' });

  const depositMut = useMutation({
    mutationFn: () => deposit({ amount: parseFloat(depositAmount) }),
    onSuccess: async (res) => {
      const ref = res.data.reference;
      // Auto-verify (stub)
      try {
        await verifyPayment(ref);
        qc.invalidateQueries({ queryKey: ['wallet'] });
        qc.invalidateQueries({ queryKey: ['profile'] });
        setDepositModal(false);
        setDepositAmount('');
        Alert.alert('Success', `₦${depositAmount} credited to your wallet!`);
      } catch (e) {
        Alert.alert('Deposit initiated', `Reference: ${ref}\nUse the verify endpoint to confirm.`);
      }
    },
    onError: e => Alert.alert('Error', e?.error?.message || 'Deposit failed'),
  });

  const withdrawMut = useMutation({
    mutationFn: () => withdraw({
      amount: parseFloat(withdrawForm.amount),
      account_details: {
        type: 'bank',
        account_number: withdrawForm.account_number,
        account_name: withdrawForm.account_name,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries(['wallet']);
      setWithdrawModal(false);
      setWithdrawForm({ amount: '', account_number: '', account_name: '' });
      Alert.alert('Success', 'Withdrawal request submitted!');
    },
    onError: e => Alert.alert('Error', e?.error?.message || 'Withdrawal failed'),
  });

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Wallet</Text>

          {/* Balance card */}
          <LinearGradient colors={[colors.blue, colors.teal]} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{fmt(balance)}</Text>
            <Text style={styles.balanceSub}>Tap deposit to add funds</Text>
          </LinearGradient>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setDepositModal(true)} style={styles.actionBtn} activeOpacity={0.8}>
              <LinearGradient colors={[colors.blue, colors.teal]} style={styles.actionGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.actionIcon}>⬇️</Text>
                <Text style={styles.actionText}>Deposit</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWithdrawModal(true)} style={styles.actionBtn} activeOpacity={0.8}>
              <View style={styles.actionOutline}>
                <Text style={styles.actionIcon}>⬆️</Text>
                <Text style={[styles.actionText, { color: colors.white50 }]}>Withdraw</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Transaction history */}
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.blue} style={{ marginVertical: 24 }} />
          ) : transactions.length === 0 ? (
            <Text style={styles.empty}>No transactions yet</Text>
          ) : (
            transactions.map(tx => <TxRow key={tx.id} tx={tx} />)
          )}
        </ScrollView>

        {/* Deposit Modal */}
        <Modal visible={depositModal} transparent animationType="slide" onRequestClose={() => setDepositModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Deposit Funds</Text>
              <Text style={styles.label}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor={colors.white30}
                keyboardType="decimal-pad"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />
              <TouchableOpacity
                onPress={() => depositMut.mutate()}
                disabled={depositMut.isPending || !depositAmount}
                activeOpacity={0.85}
                style={{ marginTop: 16 }}
              >
                <LinearGradient colors={[colors.blue, colors.teal]} style={styles.modalBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {depositMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Deposit</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDepositModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Withdraw Modal */}
        <Modal visible={withdrawModal} transparent animationType="slide" onRequestClose={() => setWithdrawModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              {[
                { key: 'amount',         label: 'Amount ($)',        keyboard: 'decimal-pad', placeholder: '0.00' },
                { key: 'account_name',   label: 'Account Name',      keyboard: 'default',     placeholder: 'John Doe' },
                { key: 'account_number', label: 'Account Number',    keyboard: 'numeric',     placeholder: '1234567890' },
              ].map(f => (
                <View key={f.key} style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.white30}
                    keyboardType={f.keyboard}
                    value={withdrawForm[f.key]}
                    onChangeText={v => setWithdrawForm(x => ({ ...x, [f.key]: v }))}
                  />
                </View>
              ))}
              <TouchableOpacity onPress={() => withdrawMut.mutate()} disabled={withdrawMut.isPending} activeOpacity={0.85}>
                <LinearGradient colors={[colors.blue, colors.teal]} style={styles.modalBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {withdrawMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Request Withdrawal</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWithdrawModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  title:        { fontSize: 24, fontWeight: '800', color: colors.light, marginBottom: 20 },
  balanceCard:  { borderRadius: 24, padding: 28, marginBottom: 20 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  balanceAmount: { color: '#fff', fontSize: 44, fontWeight: '900', marginTop: 4 },
  balanceSub:   { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 },
  actions:      { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionBtn:    { flex: 1 },
  actionGrad:   { borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  actionOutline: { borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionIcon:   { fontSize: 18 },
  actionText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.light, marginBottom: 12 },
  empty:        { color: colors.white30, textAlign: 'center', paddingVertical: 24 },
  txRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12 },
  txIcon:       { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  txInfo:       { flex: 1 },
  txType:       { fontSize: 14, fontWeight: '600', color: colors.light },
  txDate:       { fontSize: 11, color: colors.white30, marginTop: 2 },
  txAmount:     { fontSize: 15, fontWeight: '700' },
  txStatus:     { fontSize: 10, color: colors.white30, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: colors.light, marginBottom: 20 },
  label:        { fontSize: 13, color: colors.white50, marginBottom: 6 },
  input: {
    backgroundColor: colors.dark, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    color: colors.light, fontSize: 15,
  },
  modalBtn:     { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn:    { alignItems: 'center', paddingVertical: 14 },
  cancelText:   { color: colors.white30, fontSize: 14 },
});
