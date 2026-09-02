/**
 * biometricAuth.ts — WebAuthn helpers for Face ID / Touch ID / Fingerprint lock.
 *
 * Uses platform authenticators (on-device biometrics) only.
 * Credentials are stored in localStorage (credential ID) and the device's secure enclave.
 */

const CREDENTIAL_ID_KEY = 'echospend_biometric_credential_id';
const RP_NAME = 'EchoSpend';

/** Check if the current browser/device supports WebAuthn platform authenticators */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/** Convert base64url string to Uint8Array */
function base64urlToUint8Array(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binaryStr = atob(base64);
  const bytes = new ArrayBuffer(binaryStr.length);
  const view = new Uint8Array(bytes);
  for (let i = 0; i < binaryStr.length; i++) {
    view[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/** Convert Uint8Array or ArrayBuffer to base64url string */
function arrayBufferToBase64url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binaryStr = '';
  for (const byte of bytes) {
    binaryStr += String.fromCharCode(byte);
  }
  return btoa(binaryStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Register a new biometric credential.
 * Must be called on a user gesture.
 * Returns the credential ID (base64url) on success, throws on failure.
 */
export async function registerBiometric(): Promise<string> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: RP_NAME },
      user: {
        id: userId,
        name: 'echospend-user',
        displayName: 'EchoSpend User',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  }) as PublicKeyCredential | null;

  if (!credential) throw new Error('Registration cancelled');

  const credentialId = arrayBufferToBase64url(credential.rawId);
  localStorage.setItem(CREDENTIAL_ID_KEY, credentialId);
  return credentialId;
}

/**
 * Authenticate using a previously registered biometric credential.
 * Must be called on a user gesture.
 * Returns true on success, throws on failure or cancellation.
 */
export async function authenticateWithBiometric(credentialId: string): Promise<boolean> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          type: 'public-key',
          id: base64urlToUint8Array(credentialId),
          transports: ['internal'],
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    },
  }) as PublicKeyCredential | null;

  return assertion !== null;
}

/** Remove stored credential from localStorage */
export function clearBiometricCredential() {
  localStorage.removeItem(CREDENTIAL_ID_KEY);
}

/** Get stored credential ID from localStorage */
export function getStoredCredentialId(): string | null {
  return localStorage.getItem(CREDENTIAL_ID_KEY);
}
