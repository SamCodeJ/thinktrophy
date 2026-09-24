import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Modal,
  Platform, Keyboard, TouchableWithoutFeedback,
  Dimensions, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { WebView } from 'react-native-webview';
import { colors } from '../utils/theme';
import { getWallet, getProfile, deposit, verifyPayment, withdraw, getBanks, resolveAccount } from '../api';

const fmt = n => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const WITHDRAWAL_FEE = 50;

function parseWithdrawAmount(raw) {
  const n = parseFloat(String(raw || '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

// RN Modal is a separate Android window. Expo Go often resizes with the keyboard;
// production edge-to-edge builds usually do not, so the keypad covers the sheet.
function useKeyboardOverlap() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardHeight <= 0) return 0;

  const alreadyShrunk = Math.max(0, Dimensions.get('screen').height - windowHeight);
  if (alreadyShrunk >= keyboardHeight * 0.5) {
    return Math.max(0, keyboardHeight - alreadyShrunk);
  }
  return keyboardHeight;
}

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
  
  const meta = typeof tx.metadata === 'string'
    ? (() => { try { return JSON.parse(tx.metadata); } catch { return {}; } })()
    : (tx.metadata || {});
  const isDispute = !!meta.dispute_correction;

  let displayName = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
  if (tx.type === 'referral_bonus') displayName = 'Referral Bonus';
  if (tx.type === 'tax_deduction') displayName = isDispute ? 'Dispute Tax Adj.' : 'User Win Tax';
  if (tx.type === 'payout' && isDispute) displayName = 'Dispute Payout';

  const isDebit =
    meta.wallet_effect === 'debit' ||
    (!meta.wallet_effect && (tx.type === 'stake' || tx.type === 'withdrawal' || tx.type === 'tax_deduction'));

  return (
    <View style={styles.txRow}>
      <View style={styles.txIcon}>
        <Text style={{ fontSize: 18 }}>{isDispute ? '⚖️' : (typeIcon[tx.type] || '💳')}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txType}>{displayName}</Text>
        <Text style={styles.txDate}>{format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.txAmount, { color: isDebit ? colors.red : (typeColor[tx.type] || colors.light) }]}>
          {isDebit ? '−' : '+'}{fmt(tx.amount)}
        </Text>
        <Text style={styles.txStatus}>{tx.status}</Text>
      </View>
    </View>
  );
}

export default function WalletScreen({ navigation, route }) {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const kbOverlap = useKeyboardOverlap();
  const sheetBottom = {
    marginBottom: kbOverlap,
    paddingBottom: 28 + (kbOverlap > 0 ? 8 : insets.bottom),
  };

  // Refresh balance every time this tab comes into view
  useFocusEffect(
    React.useCallback(() => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    }, [])
  );

  const { data: walletData, isLoading } = useQuery({ queryKey: ['wallet'], queryFn: getWallet });
  useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { data: banksData, isLoading: loadingBanks } = useQuery({ queryKey: ['banks'], queryFn: getBanks });

  const [depositModal, setDepositModal]   = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    if (!route.params?.openDeposit) return;
    const suggested = parseFloat(route.params.suggestedAmount);
    if (Number.isFinite(suggested) && suggested > 0) {
      setDepositAmount(String(Math.ceil(suggested)));
    }
    setDepositModal(true);
    navigation.setParams({ openDeposit: false, suggestedAmount: undefined });
  }, [route.params?.openDeposit, route.params?.suggestedAmount, navigation]);
  const [withdrawForm, setWithdrawForm]   = useState({ amount: '', account_number: '', account_name: '', bank_code: '', bank_name: '' });
  const [bankModal, setBankModal]         = useState(false);
  const [bankSearch, setBankSearch]       = useState('');
  const [paymentRef, setPaymentRef] = useState(null);
  const [paymentLink, setPaymentLink] = useState(null);
  const paymentRefRef = useRef(null);
  const verifyingRef = useRef(false);
  const [verifying, setVerifying] = useState(false);

  const balance      = walletData?.data?.balance || 0;
  const transactions = walletData?.data?.transactions || [];
  const banks        = (banksData?.data || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  const bankQuery    = bankSearch.trim().toLowerCase();
  const filteredBanks = bankQuery
    ? banks.filter(b => (b.name || '').toLowerCase().includes(bankQuery))
    : banks;

  function closeBankModal() {
    Keyboard.dismiss();
    setBankModal(false);
    setBankSearch('');
  }

  const depositMut = useMutation({
    mutationFn: () => deposit({ amount: parseFloat(depositAmount) }),
    onSuccess: (res) => {
      const ref = res.data?.reference;
      const link = res.data?.payment_link;
      if (!ref || !link) {
        Alert.alert('Error', 'Failed to initialize payment. Please try again.');
        return;
      }
      paymentRefRef.current = ref;
      setPaymentRef(ref);
      setPaymentLink(link);
      setDepositModal(false);
    },
    onError: e => Alert.alert('Error', e?.error?.message || 'Deposit failed'),
  });

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function confirmDeposit(txRef, { showCancelMessage = false } = {}) {
    if (!txRef || verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);
    setPaymentLink(null);

    let lastError = null;
    // Bank transfer stays pending on Flutterwave for a while after checkout closes.
    for (let i = 0; i < 6; i++) {
      try {
        const verified = await verifyPayment(txRef);
        qc.invalidateQueries({ queryKey: ['wallet'] });
        qc.invalidateQueries({ queryKey: ['profile'] });
        setDepositAmount('');
        paymentRefRef.current = null;
        setPaymentRef(null);
        Alert.alert('Success', `${fmt(verified?.data?.amount)} credited to your wallet!`);
        verifyingRef.current = false;
        setVerifying(false);
        return;
      } catch (e) {
        lastError = e;
        const code = e?.error?.code;
        const stillPending = code === 'TX_FAILED' || code === 'VERIFICATION_FAILED';
        if (!stillPending) break;
        if (i < 5) await sleep(3000);
      }
    }

    console.error('Verify payment error:', lastError);
    verifyingRef.current = false;
    setVerifying(false);
    const code = lastError?.error?.code;
    const notCompleted = showCancelMessage && (code === 'TX_FAILED' || code === 'VERIFICATION_FAILED');
    Alert.alert(
      notCompleted ? 'Payment not completed' : 'Verification pending',
      notCompleted
        ? 'No successful payment was found. If you already transferred, wait a moment and check your wallet. Bank transfers can take a minute to confirm.'
        : (lastError?.error?.message
          || 'If you completed payment, your wallet will update shortly. Bank transfers can take a minute to confirm.')
    );
  }

  function flutterwaveReturnParams(url) {
    const marker = 'https://flutterwave.com/rn-redirect';
    if (!url || !url.startsWith(marker)) return null;
    const params = {};
    const q = url.indexOf('?');
    if (q === -1) return params;
    url.slice(q + 1).split('&').forEach(part => {
      const eq = part.indexOf('=');
      const rawKey = eq === -1 ? part : part.slice(0, eq);
      const rawVal = eq === -1 ? '' : part.slice(eq + 1);
      if (!rawKey) return;
      try {
        params[decodeURIComponent(rawKey)] = decodeURIComponent(rawVal);
      } catch {
        params[rawKey] = rawVal;
      }
    });
    return params;
  }

  const handleNavigationStateChange = async (navState) => {
    const params = flutterwaveReturnParams(navState.url);
    if (!params) return;

    const txRef = params.tx_ref || paymentRefRef.current || paymentRef;
    const status = String(params.status || '').toLowerCase();
    const failed = status === 'cancelled' || status === 'failed' || status === 'error';

    // Bank transfer often returns with no status, or with status=cancelled, before
    // Flutterwave marks the charge successful. Always check the reference first.
    if (txRef) {
      await confirmDeposit(txRef, { showCancelMessage: failed });
      return;
    }

    if (!failed) return;

    setPaymentLink(null);
    paymentRefRef.current = null;
    setPaymentRef(null);
    Alert.alert('Payment Failed', 'Your payment was not successful or was cancelled.');
  };

  const closeCheckout = () => {
    const ref = paymentRefRef.current || paymentRef;
    setPaymentLink(null);
    if (ref) confirmDeposit(ref, { showCancelMessage: true });
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

  const withdrawAmount = parseWithdrawAmount(withdrawForm.amount);
  const withdrawReady = Boolean(
    Number.isFinite(withdrawAmount)
    && withdrawAmount > WITHDRAWAL_FEE
    && withdrawAmount <= balance
    && withdrawForm.account_number.length === 10
    && withdrawForm.account_name
    && withdrawForm.bank_code
  );

  const withdrawMut = useMutation({
    mutationFn: () => withdraw({
      amount: withdrawAmount,
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
      Alert.alert(
        'Withdrawal submitted',
        'Your request is being processed. Check Transaction History for status. The amount will leave your wallet now and arrive in your bank when the transfer completes.'
      );
    },
    onError: e => {
      const timedOut = e?.code === 'ECONNABORTED' || /timeout/i.test(e?.message || '');
      Alert.alert(
        'Error',
        timedOut
          ? 'The request is taking longer than expected. Check Transaction History before trying again — a pending withdrawal may already be processing.'
          : (e?.error?.message || 'Withdrawal failed')
      );
    },
  });

  if (verifying && !paymentLink) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <ActivityIndicator color={colors.teal} size="large" />
        <Text style={{ color: colors.light, fontSize: 16, fontWeight: '700', marginTop: 18, textAlign: 'center' }}>
          Confirming your payment
        </Text>
        <Text style={{ color: colors.white50, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
          Bank transfers can take a minute. Keep this screen open.
        </Text>
      </SafeAreaView>
    );
  }

  if (paymentLink) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark }}>
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.darker }}>
          <TouchableOpacity onPress={closeCheckout}>
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
        <Modal
          visible={depositModal}
          transparent
          animationType="slide"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setDepositModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCard, sheetBottom]}>
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
          </View>
        </Modal>

        {/* Withdraw Modal */}
        <Modal
          visible={withdrawModal}
          transparent
          animationType="slide"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setWithdrawModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              style={{ marginBottom: kbOverlap }}
              contentContainerStyle={[styles.modalCard, { paddingBottom: 28 + (kbOverlap > 0 ? 8 : insets.bottom) }]}
            >
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>Bank</Text>
                <TouchableOpacity 
                  style={[styles.input, { justifyContent: 'center' }]} 
                  onPress={() => { setBankSearch(''); setBankModal(true); }}
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
                  onChangeText={v => setWithdrawForm(x => ({ ...x, amount: v.replace(/,/g, '') }))}
                />
                <Text style={{ color: colors.white50, fontSize: 12, marginTop: 6 }}>
                  A {fmt(WITHDRAWAL_FEE)} processing fee is deducted. You must withdraw more than {fmt(WITHDRAWAL_FEE)}.
                </Text>
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
                disabled={withdrawMut.isPending || !withdrawReady} 
                activeOpacity={0.85}
              >
                <LinearGradient colors={[colors.blue, colors.teal]} style={[styles.modalBtn, !withdrawReady && { opacity: 0.5 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {withdrawMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Request Withdrawal</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { Keyboard.dismiss(); setWithdrawModal(false); }} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* Bank Selection Modal */}
        <Modal
          visible={bankModal}
          transparent
          animationType="slide"
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={closeBankModal}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={closeBankModal}>
              <View style={styles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={[styles.modalCard, { height: '70%' }, sheetBottom]}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                placeholder="Search banks"
                placeholderTextColor={colors.white30}
                value={bankSearch}
                onChangeText={setBankSearch}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {loadingBanks ? (
                <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredBanks.length === 0 ? (
                    <Text style={styles.empty}>No banks match “{bankSearch.trim()}”</Text>
                  ) : (
                    filteredBanks.map(bank => (
                      <TouchableOpacity 
                        key={`${bank.code}-${bank.name}`}
                        style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                        onPress={() => {
                          setWithdrawForm(x => ({ ...x, bank_code: bank.code, bank_name: bank.name }));
                          closeBankModal();
                        }}
                      >
                        <Text style={{ color: colors.light, fontSize: 16 }}>{bank.name}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}
              <TouchableOpacity onPress={closeBankModal} style={styles.cancelBtn}>
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
