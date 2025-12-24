// ==================== CRYPTO UTILITIES ====================
// Improvements #71-74: Security features using Web Crypto API

// ===== #71 - WEB CRYPTO API HASHING =====
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha512(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha1(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== #72 - PBKDF2 KEY DERIVATION =====
export async function deriveKeyFromPassword(
  password: string,
  salt: string = 'RedConverterSalt2024',
  iterations: number = 100000,
  keyLength: number = 256
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: keyLength },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function deriveKeyHex(
  password: string,
  salt: string = 'RedConverterSalt2024',
  iterations: number = 100000
): Promise<string> {
  const key = await deriveKeyFromPassword(password, salt, iterations);
  const exported = await crypto.subtle.exportKey('raw', key);
  const keyArray = Array.from(new Uint8Array(exported));
  return keyArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ===== #73 - RANDOM KEY GENERATOR =====
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function generateRandomHex(length: number): string {
  const bytes = generateRandomBytes(Math.ceil(length / 2));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

export function generateRandomBase64(length: number): string {
  const bytes = generateRandomBytes(length);
  return btoa(String.fromCharCode(...bytes));
}

export function generatePassword(
  length: number = 16,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

  const randomBytes = generateRandomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

// ===== #74 - SECURE CLIPBOARD =====
let clipboardTimeoutId: number | null = null;

export async function copyToClipboardSecure(
  text: string,
  clearAfterMs: number = 30000 // Default 30 seconds
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    
    // Clear any existing timeout
    if (clipboardTimeoutId !== null) {
      clearTimeout(clipboardTimeoutId);
    }
    
    // Set auto-clear if enabled
    if (clearAfterMs > 0) {
      clipboardTimeoutId = window.setTimeout(async () => {
        try {
          // Only clear if clipboard still contains our text
          const currentClipboard = await navigator.clipboard.readText();
          if (currentClipboard === text) {
            await navigator.clipboard.writeText('');
          }
        } catch {
          // Clipboard read may fail, ignore
        }
        clipboardTimeoutId = null;
      }, clearAfterMs);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

export function cancelClipboardClear(): void {
  if (clipboardTimeoutId !== null) {
    clearTimeout(clipboardTimeoutId);
    clipboardTimeoutId = null;
  }
}

// ===== AES ENCRYPTION/DECRYPTION =====
export async function aesEncrypt(
  plaintext: string,
  password: string
): Promise<string> {
  const encoder = new TextEncoder();
  const salt = generateRandomBytes(16);
  const iv = generateRandomBytes(12);
  
  const key = await deriveKeyFromPassword(password, 
    Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Combine salt + iv + ciphertext
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  return btoa(String.fromCharCode(...result));
}

export async function aesDecrypt(
  ciphertext: string,
  password: string
): Promise<string> {
  try {
    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);
    
    const key = await deriveKeyFromPassword(password,
      Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed - wrong password or corrupted data');
  }
}

// ===== HMAC =====
export async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
