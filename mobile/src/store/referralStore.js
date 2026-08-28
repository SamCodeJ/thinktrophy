import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as Application from 'expo-application';
import {
  extractReferralCodeFromReferrer,
  extractReferralCodeFromUrl,
  normalizeReferralCode,
} from '../utils/referral';

const STORAGE_KEY = 'pending_referral_code';

export async function getPendingReferralCode() {
  try {
    return normalizeReferralCode(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function savePendingReferralCode(code) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // ignore storage failures — in-memory flow can still use route params
  }
  return normalized;
}

export async function clearPendingReferralCode() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function captureReferralFromUrl(url) {
  const code = extractReferralCodeFromUrl(url);
  if (!code) return null;
  return savePendingReferralCode(code);
}

async function captureInstallReferrer() {
  if (Platform.OS !== 'android') return null;
  try {
    const referrer = await Application.getInstallReferrerAsync();
    const code = extractReferralCodeFromReferrer(referrer);
    if (!code) return null;
    return savePendingReferralCode(code);
  } catch {
    return null;
  }
}

export async function initReferralCapture() {
  const existing = await getPendingReferralCode();

  try {
    const initialUrl = await Linking.getInitialURL();
    await captureReferralFromUrl(initialUrl);
  } catch {
    // ignore
  }

  if (!existing) {
    await captureInstallReferrer();
  }

  const subscription = Linking.addEventListener('url', ({ url }) => {
    captureReferralFromUrl(url);
  });

  return () => subscription.remove();
}
