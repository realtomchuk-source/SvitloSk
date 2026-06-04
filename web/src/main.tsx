import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import './styles/legacy/style.css'
import './styles/pages.css'
import { initDB } from '@/services/db'
import { migrateFromLocalStorage } from '@/services/migrationService'
import { QueryProvider } from '@/providers/QueryProvider'

initDB();
migrateFromLocalStorage();

// Capture beforeinstallprompt event early for PWA install hook
(window as any).deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new Event('beforeinstallprompt_captured'));
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </React.StrictMode>,
)
