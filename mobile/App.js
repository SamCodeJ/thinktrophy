import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ScreenCapture from 'expo-screen-capture';
import { AuthProvider } from './src/store/authStore';
import { KioskProvider } from './src/store/kioskStore';
import AppNavigator from './src/navigation/AppNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  useEffect(() => {
    // ScreenCapture.preventScreenCaptureAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <KioskProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </KioskProvider>
    </QueryClientProvider>
  );
}
