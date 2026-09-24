import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { getProfile } from '../api';
import { setSessionExpiredHandler, markSessionStarted } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);
  userRef.current = user;

  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (userRef.current) {
        Alert.alert('Session expired', 'Please sign in again.');
      }
      setUser(null);
    });
    restoreSession();
    return () => setSessionExpiredHandler(null);
  }, []);

  async function restoreSession() {
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (accessToken || refreshToken) {
        const res = await getProfile();
        markSessionStarted();
        setUser(res.data);
      }
    } catch {
      await clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function saveTokens(accessToken, refreshToken) {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
  }

  async function clearTokens() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  }

  async function signIn(accessToken, refreshToken, userData) {
    await saveTokens(accessToken, refreshToken);
    markSessionStarted();
    setUser(userData);
  }

  async function signOut() {
    await clearTokens();
    setUser(null);
  }

  function refreshUser(data) {
    setUser(data);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
