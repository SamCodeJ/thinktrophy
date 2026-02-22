import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        const res = await getProfile();
        setUser(res.data);
      }
    } catch {
      await clearTokens();
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
