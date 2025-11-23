import '@/index.css';
import App from '@/App';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import React from 'react';
import ReactDOM from 'react-dom/client';

if (import.meta.env.DEV && typeof window !== 'undefined') {
	const reportError = (type, message) => {
		try {
			const url = `/__app-error?type=${encodeURIComponent(type)}&message=${encodeURIComponent(
				message ?? 'unknown',
			)}`;
			navigator.sendBeacon?.(url) ?? fetch(url, { method: 'POST', keepalive: true });
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

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<AuthProvider>
			<App />
		</AuthProvider>
	</React.StrictMode>,
);
