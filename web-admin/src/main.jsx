import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#151D23', color: '#F5F6FA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, padding: 32, fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#EF4444' }}>Something went wrong</h1>
          <pre style={{
            background: '#232F38', padding: 20, borderRadius: 12, maxWidth: 700,
            overflowX: 'auto', fontSize: 13, color: '#F5F6FA', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg,#0984E3,#00CEC9)', color: '#fff',
              border: 'none', borderRadius: 12, padding: '10px 24px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#232F38', color: '#F5F6FA', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#00CEC9', secondary: '#1E272E' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#1E272E' } },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
