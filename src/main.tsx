import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { setSWRegistration } from './lib/pwaUpdate'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('pwa-need-refresh'));
    setTimeout(() => {
      updateSW(true);
    }, 400);
  },
  onRegisteredSW(_swUrl, r) {
    if (r) {
      setSWRegistration(r);

      // Check for server updates every 15 seconds automatically
      setInterval(() => {
        r.update().catch(() => {});
      }, 15000);

      // Check for updates on tab focus and app visibility change
      window.addEventListener('focus', () => r.update().catch(() => {}));
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          r.update().catch(() => {});
        }
      });
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
