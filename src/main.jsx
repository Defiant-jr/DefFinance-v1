import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const reportError = (type, message) => {
    try {
      const url = `/__app-error?type=${encodeURIComponent(type)}&message=${encodeURIComponent(message ?? 'unknown')}`;
      navigator.sendBeacon?.(url) || fetch(url, { method: 'POST', keepalive: true });
    } catch {
      // ignore
    }
  };

  window.addEventListener('error', (event) => {
    reportError('error', event?.message ?? 'unknown error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const message = typeof reason === 'string' ? reason : reason?.message ?? JSON.stringify(reason);
    reportError('unhandledrejection', message ?? 'unknown rejection');
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
