/**
 * pwaUpdate.ts — Service Worker registration & version update manager.
 * Supports manual check for updates in Settings and prompts PWA reload.
 */

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.3.0';
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();
export const GIT_HASH = typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev';
export const GIT_COUNT = typeof __GIT_COUNT__ !== 'undefined' ? __GIT_COUNT__ : '0';

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
    // 1. Direct server check against version.json with fresh timestamp
    try {
      const vRes = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache, no-store' } });
      if (vRes.ok) {
        const serverInfo = await vRes.json();
        const isNewVersion = serverInfo?.version && serverInfo.version !== APP_VERSION;
        const isNewCommit = serverInfo?.commit && serverInfo.commit !== GIT_HASH;
        if (isNewVersion || isNewCommit) {
          if (registrationInstance) {
            registrationInstance.update().catch(() => {});
          }
          window.dispatchEvent(new CustomEvent('pwa-need-refresh'));
          return {
            hasUpdate: true,
            statusText: `New build ${serverInfo.version} (${serverInfo.commit || 'update'}) found!`
          };
        }
      }
    } catch {}

    let reg: ServiceWorkerRegistration | undefined | null = registrationInstance;
    if (!reg && 'serviceWorker' in navigator) {
      reg = await navigator.serviceWorker.getRegistration();
    }

    if (reg) {
      if (reg.waiting) {
        return { hasUpdate: true, statusText: 'Update ready to install' };
      }
      await reg.update();
      if (reg.waiting || reg.installing) {
        return { hasUpdate: true, statusText: 'New version downloading...' };
      }
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
