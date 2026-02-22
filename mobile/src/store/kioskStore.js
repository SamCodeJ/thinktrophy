import { createContext, useContext, useState, useEffect } from 'react';
import { getPublicSettings } from '../api';

const KioskContext = createContext(null);

export function KioskProvider({ children }) {
  const [kioskEnabled, setKioskEnabled] = useState(false);
  const [warningCount, setWarningCount] = useState(1);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await getPublicSettings();
      const s   = res?.data || {};
      setKioskEnabled(s.kiosk_mode === 'true');
      setWarningCount(parseInt(s.kiosk_warning_count || '1', 10));
    } catch {
      setKioskEnabled(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KioskContext.Provider value={{ kioskEnabled, warningCount, loading, refetchKiosk: fetchSettings }}>
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  return useContext(KioskContext);
}
