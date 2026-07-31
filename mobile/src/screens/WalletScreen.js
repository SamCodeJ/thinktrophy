import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Modal,
  Platform, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { FlutterwaveInit } from 'flutterwave-react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../utils/theme';
import { getWallet, getProfile, deposit, verifyPayment, withdraw, getBanks, resolveAccount } from '../api';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function TxRow({ tx }) {
  const typeIcon = { deposit: '⬇️', stake: '🎮', payout: '💰', withdrawal: '⬆️', referral_bonus: '🎁', tax_deduction: '🏛️' };
  const typeColor = {
    deposit:    colors.green,
    payout:     colors.teal,
    stake:      colors.yellow,
    withdrawal: colors.red,
    referral_bonus: colors.green,
    tax_deduction: colors.red,
  };
  
  let displayName = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
  if (tx.type === 'referral_bonus') displayName = 'Referral Bonus';
  if (tx.type === 'tax_deduction') displayName = 'User Win Tax';

  return (
    <View style={styles.txRow}>
      <View style={styles.txIcon}>
        <Text style={{ fontSize: 18 }}>{typeIcon[tx.type] || '💳'}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txType}>{displayName}</Text>
        <Text style={styles.txDate}>{format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.txAmount, { color: typeColor[tx.type] || colors.light }]}>
          {tx.type === 'stake' || tx.type === 'withdrawal' || tx.type === 'tax_deduction' ? '−' : '+'}{fmt(tx.amount)}
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

  const { data: walletData, isLoading } = useQuery({ queryKey: ['wallet'], queryFn: getWallet });
  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { data: banksData, isLoading: loadingBanks } = useQuery({ queryKey: ['banks'], queryFn: getBanks });
  
  const balance      = walletData?.data?.balance || 0;
  const transactions = walletData?.data?.transactions || [];
  const userEmail    = profileData?.data?.email || 'user@example.com';
  const userName     = profileData?.data?.username || 'User';

  const [depositModal, setDepositModal]   = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawForm, setWithdrawForm]   = useState({ amount: '', account_number: '', account_name: '', bank_code: '', bank_name: '' });
  const [bankModal, setBankModal]         = useState(false);
  
  const [paymentRef, setPaymentRef] = useState(null);
  const [paymentLink, setPaymentLink] = useState(null);
  const verifyingRef = useRef(false);

  const depositMut = useMutation({
    mutationFn: () => deposit({ amount: parseFloat(depositAmount) }),
    onSuccess: async (res) => {
      const ref = res.data.reference;
      setPaymentRef(ref);
      setDepositModal(false);
      
      try {
        const link = await FlutterwaveInit({
          tx_ref: ref,
          authorization: 'FLWPUBK_TEST-e35abe483f6a314d5769d6689cefbca6-X',
          customer: {
            email: userEmail,
            name: userName
          },
          amount: parseFloat(depositAmount),
          currency: 'NGN',
          payment_options: 'card,ussd,banktransfer',
          redirect_url: 'https://flutterwave.com/rn-redirect'
        });
        setPaymentLink(link);
      } catch (err) {
        console.error('FlutterwaveInit error:', err);
        Alert.alert('Error', 'Failed to initialize payment. Please try again.');
      }
    },
    onError: e => Alert.alert('Error', e?.error?.message || 'Deposit failed'),
  });

  const handleNavigationStateChange = async (navState) => {
    if (!navState.url.includes('flutterwave.com/rn-redirect')) return;
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setPaymentLink(null);

    const params = {};
    if (navState.url.includes('?')) {
      const queryString = navState.url.split('?')[1];
      queryString.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[k] = decodeURIComponent(v || '');
      });
    }

    const txRef = paymentRef || params.tx_ref;
    if (!txRef) {
      verifyingRef.current = false;
      Alert.alert('Verification Failed', 'Could not find payment reference. Please contact support.');
      return;
    }

    if (params.status === 'successful') {
      try {
        await verifyPayment(txRef);
        qc.invalidateQueries({ queryKey: ['wallet'] });
        qc.invalidateQueries({ queryKey: ['profile'] });
        setDepositAmount('');
        setPaymentRef(null);
        Alert.alert('Success', `${fmt(parseFloat(depositAmount) || 0)} credited to your wallet!`);
      } catch (e) {
        console.error('Verify payment error:', e);
        Alert.alert(
          'Verification Failed',
          e?.error?.message || 'Payment was successful but verification failed. Please contact support.'
        );
      } finally {
        verifyingRef.current = false;
      }
    } else {
      verifyingRef.current = false;
      setPaymentRef(null);
      Alert.alert('Payment Failed', 'Your payment was not successful or was cancelled.');
    }
  };

  const resolveMut = useMutation({
    mutationFn: (data) => resolveAccount(data),
    onSuccess: (res) => {
      setWithdrawForm(x => ({ ...x, account_name: res.data.account_name }));
    },
    onError: () => {
      setWithdrawForm(x => ({ ...x, account_name: '' }));
      Alert.alert('Error', 'Could not resolve account name. Please check the account number and bank.');
    }
  });

  useEffect(() => {
    if (withdrawForm.account_number.length === 10 && withdrawForm.bank_code) {
      resolveMut.mutate({ account_number: withdrawForm.account_number, bank_code: withdrawForm.bank_code });
    } else {
      setWithdrawForm(x => ({ ...x, account_name: '' }));
    }
  }, [withdrawForm.account_number, withdrawForm.bank_code]);

  const withdrawMut = useMutation({
    mutationFn: () => withdraw({
      amount: parseFloat(withdrawForm.amount),
      account_details: {
        type: 'bank',
        account_number: withdrawForm.account_number,
        account_name: withdrawForm.account_name,
        bank_code: withdrawForm.bank_code,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      setWithdrawModal(false);
      setWithdrawForm({ amount: '', account_number: '', account_name: '', bank_code: '', bank_name: '' });
      Alert.alert('Success', 'Withdrawal request submitted!');
    },
    onError: e => Alert.alert('Error', e?.error?.message || 'Withdrawal failed'),
  });

  if (paymentLink) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark }}>
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.darker }}>
          <TouchableOpacity onPress={() => setPaymentLink(null)}>
            <Text style={{ fontSize: 16, color: colors.blue }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Secure Checkout</Text>
          <View style={{ width: 50 }} />
        </View>
        <WebView 
          source={{ uri: paymentLink }} 
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          onNavigationStateChange={handleNavigationStateChange}
        />
      </SafeAreaView>
    );
  }

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
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Deposit Funds</Text>
              <Text style={styles.label}>Amount (₦)</Text>
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
                  {depositMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Proceed to Pay</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { Keyboard.dismiss(); setDepositModal(false); }} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Withdraw Modal */}
        <Modal visible={withdrawModal} transparent animationType="slide" onRequestClose={() => setWithdrawModal(false)}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={styles.modalCard}
            >
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>Bank</Text>
                <TouchableOpacity 
                  style={[styles.input, { justifyContent: 'center' }]} 
                  onPress={() => setBankModal(true)}
                >
                  <Text style={{ color: withdrawForm.bank_name ? colors.light : colors.white30, fontSize: 15 }}>
                    {withdrawForm.bank_name || 'Select Bank'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>Amount (₦)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.white30}
                  keyboardType="decimal-pad"
                  value={withdrawForm.amount}
                  onChangeText={v => setWithdrawForm(x => ({ ...x, amount: v }))}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234567890"
                  placeholderTextColor={colors.white30}
                  keyboardType="numeric"
                  maxLength={10}
                  value={withdrawForm.account_number}
                  onChangeText={v => setWithdrawForm(x => ({ ...x, account_number: v.replace(/[^0-9]/g, '') }))}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>Account Name</Text>
                <View style={[styles.input, { justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                  {resolveMut.isPending ? (
                    <ActivityIndicator size="small" color={colors.blue} style={{ alignSelf: 'flex-start' }} />
                  ) : (
                    <Text style={{ color: withdrawForm.account_name ? colors.light : colors.white30, fontSize: 15 }}>
                      {withdrawForm.account_name || 'Auto-filled after entering account number'}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => withdrawMut.mutate()} 
                disabled={withdrawMut.isPending || !withdrawForm.amount || !withdrawForm.account_number || !withdrawForm.account_name || !withdrawForm.bank_code} 
                activeOpacity={0.85}
              >
                <LinearGradient colors={[colors.blue, colors.teal]} style={[styles.modalBtn, (!withdrawForm.amount || !withdrawForm.account_number || !withdrawForm.account_name || !withdrawForm.bank_code) && { opacity: 0.5 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {withdrawMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Request Withdrawal</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { Keyboard.dismiss(); setWithdrawModal(false); }} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        {/* Bank Selection Modal */}
        <Modal visible={bankModal} transparent animationType="slide" onRequestClose={() => setBankModal(false)}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={() => setBankModal(false)}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCard, { height: '70%' }]}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              {loadingBanks ? (
                <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {(banksData?.data || []).sort((a, b) => a.name.localeCompare(b.name)).map(bank => (
                    <TouchableOpacity 
                      key={bank.code}
                      style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                      onPress={() => {
                        setWithdrawForm(x => ({ ...x, bank_code: bank.code, bank_name: bank.name }));
                        setBankModal(false);
                      }}
                    >
                      <Text style={{ color: colors.light, fontSize: 16 }}>{bank.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity onPress={() => setBankModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
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
