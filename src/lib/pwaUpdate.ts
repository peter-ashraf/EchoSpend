/**
 * pwaUpdate.ts — Service Worker registration & version update manager.
 * Supports manual check for updates in Settings and prompts PWA reload.
 */

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.2.0';
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();

export interface CheckUpdateResult {
  hasUpdate: boolean;
  statusText: string;
}

let registrationInstance: ServiceWorkerRegistration | null = null;
let updateCallback: ((hasUpdate: boolean) => void) | null = null;

export function setSWRegistration(reg: ServiceWorkerRegistration) {
  registrationInstance = reg;

  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content is available and waiting
          updateCallback?.(true);
        }
      });
    }
  });

  // If there is already a waiting worker
  if (reg.waiting) {
    updateCallback?.(true);
  }
}

export function onUpdateAvailable(cb: (hasUpdate: boolean) => void) {
  updateCallback = cb;
  if (registrationInstance?.waiting) {
    cb(true);
  }
}

/**
 * Actively checks the server for updated Service Worker or assets.
 */
export async function checkForAppUpdate(): Promise<CheckUpdateResult> {
  if (!('serviceWorker' in navigator)) {
    return { hasUpdate: false, statusText: 'PWA not supported in this browser' };
  }

  if (!navigator.onLine) {
    return { hasUpdate: false, statusText: 'Offline — connect to internet to check' };
  }

  try {
    let reg: ServiceWorkerRegistration | undefined | null = registrationInstance;
    if (!reg) {
      reg = await navigator.serviceWorker.getRegistration();
    }

    if (!reg) {
      // In dev or unregistered mode
      return { hasUpdate: false, statusText: 'App is up to date' };
    }

    // Check if there is already a waiting worker
    if (reg.waiting) {
      return { hasUpdate: true, statusText: 'Update ready to install' };
    }

    // Trigger check against network for sw.js changes
    await reg.update();

    if (reg.waiting || reg.installing) {
      return { hasUpdate: true, statusText: 'New version found!' };
    }

    // Also fetch index.html with cache-buster to verify deployment
    const res = await fetch(`./?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const etag = res.headers.get('ETag') || res.headers.get('Last-Modified');
      const lastEtag = sessionStorage.getItem('app_etag');
      if (etag && lastEtag && etag !== lastEtag) {
        sessionStorage.setItem('app_etag', etag);
        return { hasUpdate: true, statusText: 'New build available!' };
      }
      if (etag) sessionStorage.setItem('app_etag', etag);
    }

    return { hasUpdate: false, statusText: 'You are on the latest version' };
  } catch (err: any) {
    return { hasUpdate: false, statusText: err?.message || 'Check failed' };
  }
}

/**
 * Reloads the PWA to apply the latest version.
 */
export function reloadAndApplyUpdate() {
  if (registrationInstance?.waiting) {
    registrationInstance.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  setTimeout(() => {
    window.location.reload();
  }, 150);
}
