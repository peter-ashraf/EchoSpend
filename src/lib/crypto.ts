/**
 * crypto.ts — Client-Side 256-bit AES-GCM Data & Backup Encryption
 * Uses native Web Crypto API (crypto.subtle) with PBKDF2 key derivation.
 */

// Derive 256-bit AES-GCM Key from password using PBKDF2 (100,000 iterations)
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  version: string;
  isEncrypted: true;
  algorithm: 'AES-GCM-256';
  salt: string;       // Base64
  iv: string;         // Base64
  ciphertext: string; // Base64
}

const DEFAULT_INTERNAL_PASS = 'EchoSpend-AES-256-MasterKey-v1';

/**
 * Encrypts any JSON-serializable object or text using AES-GCM 256.
 */
export async function encryptData(data: object | string, password?: string): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const pass = password || DEFAULT_INTERNAL_PASS;

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(jsonString)
  );

  return {
    version: '1.3.0',
    isEncrypted: true,
    algorithm: 'AES-GCM-256',
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
  };
}

/**
 * Decrypts an AES-GCM encrypted payload.
 */
export async function decryptData<T = any>(payload: EncryptedPayload, password?: string): Promise<T> {
  const dec = new TextDecoder();
  const pass = password || DEFAULT_INTERNAL_PASS;

  const salt = Uint8Array.from(atob(payload.salt), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(payload.ciphertext), c => c.charCodeAt(0));

  const key = await deriveKey(pass, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString);
}
