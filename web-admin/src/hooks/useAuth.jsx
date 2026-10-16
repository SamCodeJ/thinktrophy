import { useState, createContext, useContext, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

function readAdminSession() {
  try {
    const token = localStorage.getItem('admin_token');
    const info = JSON.parse(localStorage.getItem('admin_info') || 'null');
    if (!token || !info) return null;
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('malformed');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      return null;
    }
    return info;
  } catch {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => readAdminSession());

  function login(adminData, token) {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_info', JSON.stringify(adminData));
    setAdmin(adminData);
  }

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    setAdmin(null);
  }

  // Auto-logout after 10 minutes of inactivity
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!admin) return;

    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        logout();
        toast('Logged out due to inactivity', { icon: '💤', duration: 5000 });
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Throttle the resetTimer slightly so it doesn't trigger on every single pixel of mouse movement
    let throttleTimer;
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        resetTimer();
        throttleTimer = null;
      }, 1000); // Only reset timer at most once per second
    };

    // Initial setup
    resetTimer();

    // Add listeners
    events.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [admin]);

  return (
    <AuthContext.Provider value={{ admin, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
