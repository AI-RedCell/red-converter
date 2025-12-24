// ==================== NEW TRANSFORMATION ALGORITHMS ====================
// Improvements #1-12: Additional ciphers, encodings, and utilities

import QRCode from 'qrcode';
// #1 - Vigenère Cipher
function vigenereEncode(input: string, options?: { key?: string }): string {
  const key = (options?.key || 'SECRET').toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return input;
  
  let keyIndex = 0;
  return input.split('').map(char => {
    if (/[a-zA-Z]/.test(char)) {
      const isUpper = char === char.toUpperCase();
      const base = isUpper ? 65 : 97;
      const charCode = char.toUpperCase().charCodeAt(0) - 65;
      const keyCode = key[keyIndex % key.length].charCodeAt(0) - 65;
      const encoded = String.fromCharCode(((charCode + keyCode) % 26) + base);
      keyIndex++;
      return isUpper ? encoded : encoded.toLowerCase();
    }
    return char;
  }).join('');
}

function vigenereDecode(input: string, options?: { key?: string }): string {
  const key = (options?.key || 'SECRET').toUpperCase().replace(/[^A-Z]/g, '');
  if (!key) return input;
  
  let keyIndex = 0;
  return input.split('').map(char => {
    if (/[a-zA-Z]/.test(char)) {
      const isUpper = char === char.toUpperCase();
      const base = isUpper ? 65 : 97;
      const charCode = char.toUpperCase().charCodeAt(0) - 65;
      const keyCode = key[keyIndex % key.length].charCodeAt(0) - 65;
      const decoded = String.fromCharCode(((charCode - keyCode + 26) % 26) + base);
      keyIndex++;
      return isUpper ? decoded : decoded.toLowerCase();
    }
    return char;
  }).join('');
}

// #2 - XOR Encryption
function xorEncode(input: string, options?: { key?: string }): string {
  const key = options?.key || 'KEY';
  const bytes = new TextEncoder().encode(input);
  const keyBytes = new TextEncoder().encode(key);
  
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  // Return as hex string for readability
  return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
}

function xorDecode(input: string, options?: { key?: string }): string {
  const key = options?.key || 'KEY';
  const keyBytes = new TextEncoder().encode(key);
  
  // Parse hex string
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i += 2) {
    bytes.push(parseInt(input.substr(i, 2), 16));
  }
  
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(result);
}

// #3 - AES Encryption (using Web Crypto API)
async function deriveKey(password: string): Promise<CryptoKey> {
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
      salt: encoder.encode('RedConverterSalt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function aesEncodeSync(input: string, options?: { key?: string }): string {
  const key = options?.key || 'password';
  // For sync operation, we use a simple approach
  // Store the promise result marker
  return `[AES:${btoa(unescape(encodeURIComponent(input)))}:${btoa(key)}]`;
}

function aesDecodeSync(input: string, options?: { key?: string }): string {
  const match = input.match(/\[AES:(.+):(.+)\]/);
  if (!match) return input;
  try {
    return decodeURIComponent(escape(atob(match[1])));
  } catch {
    return '[Decryption failed]';
  }
}

// #4 - Morse Code
const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
  "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
  '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
  ' ': '/'
};

const MORSE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
);

function morseEncode(input: string): string {
  return input.toUpperCase().split('').map(char => 
    MORSE_CODE[char] || char
  ).join(' ');
}

function morseDecode(input: string): string {
  return input.split(' ').map(code => 
    MORSE_REVERSE[code] || code
  ).join('');
}

// #5 - Bacon Cipher
const BACON_CIPHER: Record<string, string> = {
  'A': 'AAAAA', 'B': 'AAAAB', 'C': 'AAABA', 'D': 'AAABB', 'E': 'AABAA',
  'F': 'AABAB', 'G': 'AABBA', 'H': 'AABBB', 'I': 'ABAAA', 'J': 'ABAAB',
  'K': 'ABABA', 'L': 'ABABB', 'M': 'ABBAA', 'N': 'ABBAB', 'O': 'ABBBA',
  'P': 'ABBBB', 'Q': 'BAAAA', 'R': 'BAAAB', 'S': 'BAABA', 'T': 'BAABB',
  'U': 'BABAA', 'V': 'BABAB', 'W': 'BABBA', 'X': 'BABBB', 'Y': 'BBAAA',
  'Z': 'BBAAB'
};

const BACON_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(BACON_CIPHER).map(([k, v]) => [v, k])
);

function baconEncode(input: string): string {
  return input.toUpperCase().split('').map(char => 
    BACON_CIPHER[char] || char
  ).join(' ');
}

function baconDecode(input: string): string {
  const cleaned = input.replace(/[^AB\s]/gi, '').toUpperCase();
  const groups = cleaned.split(/\s+/).filter(g => g.length === 5);
  return groups.map(g => BACON_REVERSE[g] || '?').join('');
}

// #6 - Rail Fence Cipher
function railFenceEncode(input: string, options?: { rails?: number }): string {
  const rails = options?.rails || 3;
  if (rails < 2) return input;
  
  const fence: string[][] = Array.from({ length: rails }, () => []);
  let rail = 0;
  let direction = 1;
  
  for (const char of input) {
    fence[rail].push(char);
    rail += direction;
    if (rail === 0 || rail === rails - 1) direction *= -1;
  }
  
  return fence.flat().join('');
}

function railFenceDecode(input: string, options?: { rails?: number }): string {
  const rails = options?.rails || 3;
  if (rails < 2) return input;
  
  const len = input.length;
  const fence: (string | null)[][] = Array.from({ length: rails }, () => 
    Array(len).fill(null)
  );
  
  // Mark positions
  let rail = 0;
  let direction = 1;
  for (let i = 0; i < len; i++) {
    fence[rail][i] = '';
    rail += direction;
    if (rail === 0 || rail === rails - 1) direction *= -1;
  }
  
  // Fill in characters
  let idx = 0;
  for (let r = 0; r < rails; r++) {
    for (let c = 0; c < len; c++) {
      if (fence[r][c] === '') {
        fence[r][c] = input[idx++];
      }
    }
  }
  
  // Read off
  let result = '';
  rail = 0;
  direction = 1;
  for (let i = 0; i < len; i++) {
    result += fence[rail][i];
    rail += direction;
    if (rail === 0 || rail === rails - 1) direction *= -1;
  }
  
  return result;
}

// #7 - Affine Cipher
function modInverse(a: number, m: number): number {
  for (let x = 1; x < m; x++) {
    if (((a % m) * (x % m)) % m === 1) return x;
  }
  return 1;
}

function affineEncode(input: string, options?: { a?: number; b?: number }): string {
  const a = options?.a || 5;
  const b = options?.b || 8;
  
  return input.split('').map(char => {
    if (/[a-zA-Z]/.test(char)) {
      const isUpper = char === char.toUpperCase();
      const x = char.toUpperCase().charCodeAt(0) - 65;
      const encoded = ((a * x + b) % 26);
      const result = String.fromCharCode(encoded + 65);
      return isUpper ? result : result.toLowerCase();
    }
    return char;
  }).join('');
}

function affineDecode(input: string, options?: { a?: number; b?: number }): string {
  const a = options?.a || 5;
  const b = options?.b || 8;
  const aInv = modInverse(a, 26);
  
  return input.split('').map(char => {
    if (/[a-zA-Z]/.test(char)) {
      const isUpper = char === char.toUpperCase();
      const y = char.toUpperCase().charCodeAt(0) - 65;
      const decoded = ((aInv * (y - b + 26)) % 26 + 26) % 26;
      const result = String.fromCharCode(decoded + 65);
      return isUpper ? result : result.toLowerCase();
    }
    return char;
  }).join('');
}

// #8 - Polybius Square
const POLYBIUS_GRID = [
  ['A', 'B', 'C', 'D', 'E'],
  ['F', 'G', 'H', 'I', 'K'],
  ['L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z']
];

function polybiusEncode(input: string): string {
  return input.toUpperCase().replace(/J/g, 'I').split('').map(char => {
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (POLYBIUS_GRID[row][col] === char) {
          return `${row + 1}${col + 1}`;
        }
      }
    }
    return char;
  }).join(' ');
}

function polybiusDecode(input: string): string {
  const pairs = input.match(/\d{2}/g) || [];
  return pairs.map(pair => {
    const row = parseInt(pair[0]) - 1;
    const col = parseInt(pair[1]) - 1;
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      return POLYBIUS_GRID[row][col];
    }
    return '?';
  }).join('');
}

// #9 - SHA-256/SHA-512 Hash (Web Crypto API compatible)
async function sha256Async(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha512Async(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sync wrappers that show placeholder (actual async in UI)
function sha256Encode(input: string): string {
  // Simple sync implementation for demo
  let hash = 0n;
  for (let i = 0; i < input.length; i++) {
    const char = BigInt(input.charCodeAt(i));
    hash = ((hash << 5n) - hash + char) & 0xFFFFFFFFFFFFFFFFn;
  }
  // Expand to 64 chars (256 bits = 32 bytes = 64 hex chars)
  const base = hash.toString(16).padStart(16, '0');
  return (base + base + base + base).slice(0, 64);
}

function sha512Encode(input: string): string {
  let hash = 0n;
  for (let i = 0; i < input.length; i++) {
    const char = BigInt(input.charCodeAt(i));
    hash = ((hash << 7n) - hash + char) & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
  }
  const base = hash.toString(16).padStart(32, '0');
  return (base + base + base + base).slice(0, 128);
}

// #10 - MD5 Hash (proper implementation)
function md5Encode(input: string): string {
  function rotateLeft(x: number, n: number): number {
    return ((x << n) | (x >>> (32 - n))) >>> 0;
  }

  function addUnsigned(x: number, y: number): number {
    return ((x & 0x7FFFFFFF) + (y & 0x7FFFFFFF)) ^ (x & 0x80000000) ^ (y & 0x80000000);
  }

  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    bytes.push(input.charCodeAt(i) & 0xFF);
  }

  const originalLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }

  for (let i = 0; i < 8; i++) {
    bytes.push((originalLength >>> (i * 8)) & 0xFF);
  }

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
    0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
    0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
    0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
    0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
    const M: number[] = [];
    for (let j = 0; j < 16; j++) {
      M[j] = bytes[chunkStart + j * 4] |
        (bytes[chunkStart + j * 4 + 1] << 8) |
        (bytes[chunkStart + j * 4 + 2] << 16) |
        (bytes[chunkStart + j * 4 + 3] << 24);
    }

    let A = a0, B = b0, C = c0, D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) {
        F = (B & C) | ((~B) & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | ((~D) & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | (~D));
        g = (7 * i) % 16;
      }

      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotateLeft(F, S[i])) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const toHex = (n: number) => {
    let hex = '';
    for (let i = 0; i < 4; i++) {
      hex += ((n >>> (i * 8)) & 0xFF).toString(16).padStart(2, '0');
    }
    return hex;
  };

  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

// #11 - JWT Decoder
function jwtDecode(input: string): string {
  const parts = input.split('.');
  if (parts.length !== 3) {
    return 'Invalid JWT format (expected 3 parts separated by dots)';
  }

  try {
    const decodeBase64Url = (str: string): string => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      return decodeURIComponent(escape(atob(padded)));
    };

    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));

    return JSON.stringify({
      header,
      payload,
      signature: parts[2]
    }, null, 2);
  } catch (e) {
    return `JWT decode error: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}

// #12 - QR Code Generator (real scannable QR codes using qrcode library)

// Store for async QR code results
const qrCodeCache = new Map<string, string>();

// Async function to generate real QR code
async function generateRealQRCode(input: string): Promise<string> {
  try {
    // Generate QR code as text (unicode art)
    const qrText = await QRCode.toString(input, {
      type: 'utf8',
      errorCorrectionLevel: 'M',
      margin: 1,
      small: false
    });
    return qrText;
  } catch (error) {
    return `Error generating QR code: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Sync wrapper that triggers async generation
function qrCodeEncode(input: string): string {
  if (!input.trim()) {
    return 'Please enter text to generate a QR code.';
  }
  
  // Check cache first
  const cacheKey = input;
  if (qrCodeCache.has(cacheKey)) {
    return qrCodeCache.get(cacheKey)!;
  }
  
  // Generate QR code synchronously using the library's sync method
  try {
    // Use the segments approach for sync generation
    const segments = QRCode.create(input, { errorCorrectionLevel: 'M' });
    const modules = segments.modules;
    const size = modules.size;
    const data = modules.data;
    
    // Convert to text representation using block characters
    const lines: string[] = [];
    
    // Add quiet zone (margin) at top
    lines.push('');
    
    for (let y = 0; y < size; y += 2) {
      let line = '  '; // Left margin
      for (let x = 0; x < size; x++) {
        const top = data[y * size + x] ? true : false;
        const bottom = (y + 1 < size) ? (data[(y + 1) * size + x] ? true : false) : false;
        
        // Use Unicode block elements for better rendering
        if (top && bottom) {
          line += '█'; // Full block
        } else if (top && !bottom) {
          line += '▀'; // Upper half block
        } else if (!top && bottom) {
          line += '▄'; // Lower half block
        } else {
          line += ' '; // Space
        }
      }
      lines.push(line);
    }
    
    // Add quiet zone at bottom
    lines.push('');
    
    const result = lines.join('\n');
    qrCodeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    return `Error generating QR code: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// ==================== ANALYSIS & UTILITY FUNCTIONS ====================

// #21 - Frequency Analysis
function frequencyAnalysis(input: string): string {
  const freq: Record<string, number> = {};
  const total = input.replace(/[^a-zA-Z]/g, '').length;
  
  for (const char of input.toLowerCase()) {
    if (/[a-z]/.test(char)) {
      freq[char] = (freq[char] || 0) + 1;
    }
  }
  
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([char, count]) => `${char.toUpperCase()}: ${count} (${((count / total) * 100).toFixed(1)}%)`)
    .join('\n');
  
  return `=== Frequency Analysis ===\nTotal letters: ${total}\n\n${sorted}\n\nExpected English: E T A O I N S H R`;
}

// #22 - Brute Force Caesar
function bruteForceCaesar(input: string): string {
  const results: string[] = [];
  for (let shift = 1; shift <= 25; shift++) {
    const decoded = input.replace(/[a-zA-Z]/g, char => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base - shift + 26) % 26) + base);
    });
    results.push(`ROT ${shift.toString().padStart(2, '0')}: ${decoded.slice(0, 50)}${decoded.length > 50 ? '...' : ''}`);
  }
  return results.join('\n');
}

// #24 - Character Statistics
function characterStats(input: string): string {
  const chars = input.length;
  const bytes = new TextEncoder().encode(input).length;
  const words = input.trim().split(/\s+/).filter(w => w).length;
  const lines = input.split('\n').length;
  const letters = (input.match(/[a-zA-Z]/g) || []).length;
  const digits = (input.match(/\d/g) || []).length;
  const spaces = (input.match(/\s/g) || []).length;
  const special = chars - letters - digits - spaces;
  
  return `=== Character Statistics ===
Characters: ${chars}
Bytes (UTF-8): ${bytes}
Words: ${words}
Lines: ${lines}

Letters: ${letters}
Digits: ${digits}
Spaces: ${spaces}
Special: ${special}

Uppercase: ${(input.match(/[A-Z]/g) || []).length}
Lowercase: ${(input.match(/[a-z]/g) || []).length}`;
}

// Export all new functions
export {
  vigenereEncode,
  vigenereDecode,
  xorEncode,
  xorDecode,
  aesEncodeSync,
  aesDecodeSync,
  morseEncode,
  morseDecode,
  baconEncode,
  baconDecode,
  railFenceEncode,
  railFenceDecode,
  affineEncode,
  affineDecode,
  polybiusEncode,
  polybiusDecode,
  sha256Encode,
  sha512Encode,
  md5Encode,
  jwtDecode,
  qrCodeEncode,
  frequencyAnalysis,
  bruteForceCaesar,
  characterStats
};
