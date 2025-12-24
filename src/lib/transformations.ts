// Transformation types and utilities

import {
  vigenereEncode, vigenereDecode,
  xorEncode, xorDecode,
  aesEncodeSync, aesDecodeSync,
  morseEncode, morseDecode,
  baconEncode, baconDecode,
  railFenceEncode, railFenceDecode,
  affineEncode, affineDecode,
  polybiusEncode, polybiusDecode,
  sha256Encode, sha512Encode, md5Encode,
  frequencyAnalysis, bruteForceCaesar, characterStats
} from './new-transformations';

export type TransformMode = 'encode' | 'decode' | 'detect';
export type Reversibility = 'reversible' | 'partial' | 'irreversible';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Transformation {
  id: string;
  name: string;
  category: string;
  description: string;
  canEncode: boolean;
  canDecode: boolean;
  reversibility: Reversibility;
  riskLevel: RiskLevel;
  encode?: (input: string, options?: Record<string, unknown>) => string;
  decode?: (input: string, options?: Record<string, unknown>) => string;
}

// ==================== BASE ENCODINGS ====================

// Base32 (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let result = '';
  let buffer = 0;
  let bitsLeft = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_ALPHABET[(buffer >> bitsLeft) & 0x1f];
    }
  }

  if (bitsLeft > 0) {
    result += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 0x1f];
  }

  while (result.length % 8 !== 0) {
    result += '=';
  }

  return result;
}

function base32Decode(input: string): string {
  const cleaned = input.replace(/=+$/, '').toUpperCase();
  let buffer = 0;
  let bitsLeft = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 5) | value;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >> bitsLeft) & 0xff);
    }
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Base58 (Bitcoin alphabet)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let num = BigInt(0);
  for (const byte of bytes) {
    num = num * BigInt(256) + BigInt(byte);
  }

  let result = '';
  while (num > 0) {
    result = BASE58_ALPHABET[Number(num % BigInt(58))] + result;
    num = num / BigInt(58);
  }

  for (const byte of bytes) {
    if (byte === 0) result = '1' + result;
    else break;
  }

  return result || '1';
}

function base58Decode(input: string): string {
  let num = BigInt(0);
  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value === -1) throw new Error('Invalid Base58 character');
    num = num * BigInt(58) + BigInt(value);
  }

  const bytes: number[] = [];
  while (num > 0) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }

  for (const char of input) {
    if (char === '1') bytes.unshift(0);
    else break;
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Base85 / ASCII85
function base85Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let result = '<~';
  
  for (let i = 0; i < bytes.length; i += 4) {
    let value = 0;
    let count = 0;
    for (let j = 0; j < 4 && i + j < bytes.length; j++) {
      value = (value << 8) | bytes[i + j];
      count++;
    }
    
    if (count < 4) {
      value <<= (4 - count) * 8;
    }
    
    if (value === 0 && count === 4) {
      result += 'z';
    } else {
      const encoded = [];
      for (let j = 4; j >= 0; j--) {
        encoded[j] = String.fromCharCode((value % 85) + 33);
        value = Math.floor(value / 85);
      }
      result += encoded.slice(0, count + 1).join('');
    }
  }
  
  return result + '~>';
}

function base85Decode(input: string): string {
  let data = input.replace(/^<~/, '').replace(/~>$/, '').replace(/\s/g, '');
  data = data.replace(/z/g, '!!!!!');
  
  const bytes: number[] = [];
  
  for (let i = 0; i < data.length; i += 5) {
    let value = 0;
    const chunk = data.slice(i, i + 5).padEnd(5, 'u');
    
    for (const char of chunk) {
      value = value * 85 + (char.charCodeAt(0) - 33);
    }
    
    const count = Math.min(data.length - i, 5) - 1;
    for (let j = 3; j >= 4 - count; j--) {
      bytes.push((value >> (j * 8)) & 0xff);
    }
  }
  
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Standard encodings
function base64Encode(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function base64Decode(input: string): string {
  return decodeURIComponent(escape(atob(input)));
}

function hexEncode(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexDecode(input: string): string {
  const bytes = input.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [];
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function binaryEncode(input: string, options?: { bits?: number }): string {
  const bits = options?.bits === 7 ? 7 : 8;
  return Array.from(new TextEncoder().encode(input))
    .map(b => (b & ((1 << bits) - 1)).toString(2).padStart(bits, '0'))
    .join(' ');
}

function binaryDecode(input: string): string {
  const bytes = input.split(/\s+/).filter(b => b).map(b => parseInt(b, 2));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// HTML Entity Encoding
function htmlEntityEncode(input: string): string {
  return input.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code > 127 || char === '<' || char === '>' || char === '&' || char === '"' || char === "'") {
      return `&#${code};`;
    }
    return char;
  }).join('');
}

function htmlEntityDecode(input: string): string {
  return input.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// Unicode Escape
function unicodeEscapeEncode(input: string): string {
  return input.split('').map(char => {
    const code = char.charCodeAt(0);
    return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char;
  }).join('');
}

function unicodeEscapeDecode(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
    String.fromCharCode(parseInt(code, 16))
  );
}

function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

function urlDecode(input: string): string {
  return decodeURIComponent(input);
}

// ==================== CIPHERS ====================

function rot13(input: string): string {
  return input.replace(/[a-zA-Z]/g, char => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function rot47(input: string): string {
  return input.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 33 && code <= 126) {
      return String.fromCharCode(33 + ((code - 33 + 47) % 94));
    }
    return char;
  }).join('');
}

function rotN(input: string, options?: { shift?: number }): string {
  const shift = options?.shift ?? 5;
  return input.replace(/[a-zA-Z]/g, char => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
  });
}

function rotNDecode(input: string, options?: { shift?: number }): string {
  const shift = options?.shift ?? 5;
  return rotN(input, { shift: 26 - (shift % 26) });
}

function caesarCipher(input: string, options?: { shift?: number }): string {
  const shift = options?.shift ?? 3;
  return rotN(input, { shift });
}

function caesarDecipher(input: string, options?: { shift?: number }): string {
  const shift = options?.shift ?? 3;
  return rotNDecode(input, { shift });
}

function atbashCipher(input: string): string {
  return input.replace(/[a-zA-Z]/g, char => {
    const isUpper = char === char.toUpperCase();
    const base = isUpper ? 65 : 97;
    const pos = char.charCodeAt(0) - base;
    return String.fromCharCode(base + (25 - pos));
  });
}

// ==================== LEETSPEAK ====================

const LEET_LIGHT: Record<string, string> = {
  'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'l': '1', 'b': '8'
};

const LEET_HEAVY: Record<string, string> = {
  'a': '/-\\', 'b': '|3', 'c': '(', 'd': '|)', 'e': '3', 'f': '|=', 'g': '9',
  'h': '|-|', 'i': '!', 'j': '_|', 'k': '|<', 'l': '|_', 'm': '|\\/|', 'n': '|\\|',
  'o': '0', 'p': '|*', 'q': '0,', 'r': '|2', 's': '$', 't': '+', 'u': '|_|',
  'v': '\\/', 'w': '\\/\\/', 'x': '><', 'y': '`/', 'z': '2'
};

const LEET_LIGHT_REVERSE = Object.fromEntries(
  Object.entries(LEET_LIGHT).map(([k, v]) => [v, k])
);

function leetspeakEncode(input: string, options?: { level?: 'light' | 'heavy' }): string {
  const map = options?.level === 'heavy' ? LEET_HEAVY : LEET_LIGHT;
  return input.toLowerCase().split('').map(char => map[char] || char).join('');
}

function leetspeakDecode(input: string): string {
  // Only light leetspeak is reversible
  let result = input;
  for (const [leet, char] of Object.entries(LEET_LIGHT_REVERSE)) {
    result = result.split(leet).join(char);
  }
  return result;
}

// ==================== BRAILLE ====================

const BRAILLE_MAP: Record<string, string> = {
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓',
  'i': '⠊', 'j': '⠚', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏',
  'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞', 'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭',
  'y': '⠽', 'z': '⠵', ' ': '⠀', '0': '⠚', '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙',
  '5': '⠑', '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊'
};

const BRAILLE_REVERSE = Object.fromEntries(
  Object.entries(BRAILLE_MAP).map(([k, v]) => [v, k])
);

function brailleEncode(input: string, options?: { mode?: 'alphabetic' | 'binary' }): string {
  const mode = options?.mode || 'alphabetic';
  
  if (mode === 'binary') {
    return input.split('').map(char => {
      const code = char.charCodeAt(0);
      let braille = '';
      for (let i = 7; i >= 0; i--) {
        braille += (code >> i) & 1 ? '⠿' : '⠀';
      }
      return braille;
    }).join('');
  }
  
  return input.toLowerCase().split('').map(char => BRAILLE_MAP[char] || char).join('');
}

function brailleDecode(input: string): string {
  const binaryPattern = /^[⠿⠀]+$/;
  
  if (binaryPattern.test(input.replace(/\s/g, ''))) {
    const chars: string[] = [];
    const cleaned = input.replace(/\s/g, '');
    for (let i = 0; i < cleaned.length; i += 8) {
      const byte = cleaned.slice(i, i + 8);
      let value = 0;
      for (const b of byte) {
        value = (value << 1) | (b === '⠿' ? 1 : 0);
      }
      chars.push(String.fromCharCode(value));
    }
    return chars.join('');
  }
  
  return input.split('').map(char => BRAILLE_REVERSE[char] || char).join('');
}

// ==================== HOMOGLYPHS ====================

const HOMOGLYPHS_LIGHT: Record<string, string> = {
  'a': 'а', 'c': 'с', 'e': 'е', 'o': 'о', 'p': 'р', 'x': 'х', 'y': 'у',
  'A': 'А', 'B': 'В', 'C': 'С', 'E': 'Е', 'H': 'Н', 'K': 'К', 'M': 'М',
  'O': 'О', 'P': 'Р', 'T': 'Т', 'X': 'Х'
};

const HOMOGLYPHS_HEAVY: Record<string, string> = {
  ...HOMOGLYPHS_LIGHT,
  'i': 'і', 'j': 'ј', 's': 'ѕ', 'I': 'І', 'J': 'Ј', 'S': 'Ѕ',
  '0': 'О', '1': 'І', '3': 'З', '6': 'б'
};

function homoglyphEncode(input: string, options?: { level?: 'light' | 'heavy' }): string {
  const map = options?.level === 'heavy' ? HOMOGLYPHS_HEAVY : HOMOGLYPHS_LIGHT;
  return input.split('').map(char => map[char] || char).join('');
}

// ==================== ZERO-WIDTH STEGANOGRAPHY ====================

const ZW_SPACE = '\u200B';
const ZW_JOINER = '\u200D';
const ZW_NON_JOINER = '\u200C';

function zeroWidthEncode(carrier: string, secret: string, options?: { density?: number }): string {
  const density = options?.density || 1;
  const secretBinary = Array.from(new TextEncoder().encode(secret))
    .map(b => b.toString(2).padStart(8, '0'))
    .join('');
  
  let encoded = '';
  let secretIndex = 0;
  
  for (let i = 0; i < carrier.length; i++) {
    encoded += carrier[i];
    
    if (secretIndex < secretBinary.length && Math.random() < density) {
      const bit = secretBinary[secretIndex];
      encoded += bit === '1' ? ZW_JOINER : ZW_NON_JOINER;
      secretIndex++;
    }
  }
  
  while (secretIndex < secretBinary.length) {
    const bit = secretBinary[secretIndex];
    encoded += bit === '1' ? ZW_JOINER : ZW_NON_JOINER;
    secretIndex++;
  }
  
  return encoded;
}

function zeroWidthDecode(input: string): string {
  const binary = input.split('').filter(c => c === ZW_JOINER || c === ZW_NON_JOINER)
    .map(c => c === ZW_JOINER ? '1' : '0')
    .join('');
  
  const bytes: number[] = [];
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function zeroWidthReveal(input: string): string {
  return input.replace(/[\u200B\u200C\u200D]/g, match => {
    if (match === ZW_SPACE) return '[ZWSP]';
    if (match === ZW_JOINER) return '[ZWJ]';
    return '[ZWNJ]';
  });
}

function zeroWidthRemove(input: string): string {
  return input.replace(/[\u200B\u200C\u200D]/g, '');
}

// ==================== EMOJI STEGANOGRAPHY ====================

const EMOJI_ALPHABET: Record<string, string> = {
  'a': '🍎', 'b': '🍌', 'c': '🐱', 'd': '🐕', 'e': '🦅', 'f': '🐸', 'g': '🍇',
  'h': '🏠', 'i': '🍦', 'j': '🃏', 'k': '🔑', 'l': '🦁', 'm': '🌙', 'n': '📰',
  'o': '🐙', 'p': '🍕', 'q': '👸', 'r': '🌈', 's': '⭐', 't': '🌲', 'u': '☂️',
  'v': '🎻', 'w': '🐋', 'x': '✖️', 'y': '💛', 'z': '⚡', ' ': '➖',
  '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
  '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣'
};

const EMOJI_ALPHABET_REVERSE = Object.fromEntries(
  Object.entries(EMOJI_ALPHABET).map(([k, v]) => [v, k])
);

function emojiAlphabetEncode(input: string): string {
  return input.toLowerCase().split('').map(char => EMOJI_ALPHABET[char] || char).join('');
}

function emojiAlphabetDecode(input: string): string {
  // Handle multi-codepoint emojis
  const segments = [...input];
  let result = '';
  let i = 0;
  while (i < segments.length) {
    // Try to match longer sequences first (for keycaps like 0️⃣)
    let matched = false;
    for (let len = 3; len >= 1; len--) {
      const seq = segments.slice(i, i + len).join('');
      if (EMOJI_ALPHABET_REVERSE[seq]) {
        result += EMOJI_ALPHABET_REVERSE[seq];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += segments[i];
      i++;
    }
  }
  return result;
}

const BINARY_EMOJI: Record<string, string> = { '0': '⚫', '1': '⚪' };
const BINARY_EMOJI_REVERSE: Record<string, string> = { '⚫': '0', '⚪': '1' };

function binaryEmojiEncode(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map(b => b.toString(2).padStart(8, '0'))
    .join('')
    .split('')
    .map(bit => BINARY_EMOJI[bit])
    .join('');
}

function binaryEmojiDecode(input: string): string {
  const binary = [...input].map(e => BINARY_EMOJI_REVERSE[e] || '').join('');
  const bytes: number[] = [];
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

const BASE64_EMOJI_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  .split('').reduce((acc, char, i) => {
    acc[char] = String.fromCodePoint(0x1F600 + i); // Start from 😀
    return acc;
  }, {} as Record<string, string>);

const BASE64_EMOJI_REVERSE = Object.fromEntries(
  Object.entries(BASE64_EMOJI_MAP).map(([k, v]) => [v, k])
);

function base64EmojiEncode(input: string): string {
  const b64 = base64Encode(input);
  return b64.split('').map(char => BASE64_EMOJI_MAP[char] || char).join('');
}

function base64EmojiDecode(input: string): string {
  const b64 = [...input].map(e => BASE64_EMOJI_REVERSE[e] || e).join('');
  return base64Decode(b64);
}

// Invisible emoji padding (uses variation selectors)
function emojiPaddingEncode(input: string): string {
  const paddingEmojis = ['️', '‍', '🏻', '🏼', '🏽', '🏾', '🏿'];
  return input.split('').map(char => {
    const code = char.charCodeAt(0);
    return char + paddingEmojis[code % paddingEmojis.length];
  }).join('');
}

function emojiPaddingDecode(input: string): string {
  const paddingEmojis = ['️', '‍', '🏻', '🏼', '🏽', '🏾', '🏿'];
  return [...input].filter(char => !paddingEmojis.includes(char)).join('');
}

// Emoji noise injection
const NOISE_EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊'];

function emojiNoiseEncode(input: string, options?: { density?: number }): string {
  const density = options?.density ?? 0.3;
  return input.split('').map(char => {
    if (Math.random() < density) {
      return char + NOISE_EMOJIS[Math.floor(Math.random() * NOISE_EMOJIS.length)];
    }
    return char;
  }).join('');
}

function emojiNoiseDecode(input: string): string {
  return [...input].filter(char => !NOISE_EMOJIS.includes(char)).join('');
}

// Emoji skin tone steganography (uses skin tone modifiers as bits)
const SKIN_TONES = ['🏻', '🏼', '🏽', '🏾', '🏿'];

function emojiSkinToneEncode(input: string): string {
  const baseEmoji = '👋';
  return Array.from(new TextEncoder().encode(input))
    .map(b => {
      // Each byte split into 2 parts (5 levels per skin tone = about 2.3 bits)
      const high = Math.floor(b / 32) % 5;
      const low = b % 5;
      return baseEmoji + SKIN_TONES[high] + baseEmoji + SKIN_TONES[low];
    }).join('');
}

function emojiSkinToneDecode(input: string): string {
  const bytes: number[] = [];
  const chars = [...input];
  
  for (let i = 0; i < chars.length - 3; i++) {
    if (chars[i] === '👋' && chars[i + 2] === '👋') {
      const high = SKIN_TONES.indexOf(chars[i + 1]);
      const low = SKIN_TONES.indexOf(chars[i + 3]);
      if (high !== -1 && low !== -1) {
        bytes.push((high * 32) + low);
        i += 3;
      }
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// ==================== OBFUSCATION ====================

// Case-based encoding (uppercase=1, lowercase=0)
function caseEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const carrier = 'thequickbrownfoxjumpsoverthelazydog'.repeat(Math.ceil(bytes.length * 8 / 35));
  let result = '';
  let bitIndex = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    for (let j = 7; j >= 0; j--) {
      const bit = (byte >> j) & 1;
      const char = carrier[bitIndex];
      result += bit ? char.toUpperCase() : char.toLowerCase();
      bitIndex++;
    }
  }
  
  return result;
}

function caseDecode(input: string): string {
  const onlyAlpha = input.replace(/[^a-zA-Z]/g, '');
  const binary = onlyAlpha.split('').map(c => c === c.toUpperCase() ? '1' : '0').join('');
  const bytes: number[] = [];
  
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Whitespace encoding (tabs vs spaces)
function whitespaceEncode(input: string): string {
  return Array.from(new TextEncoder().encode(input))
    .map(b => b.toString(2).padStart(8, '0'))
    .join('')
    .split('')
    .map(bit => bit === '1' ? '\t' : ' ')
    .join('') + '\n';
}

function whitespaceDecode(input: string): string {
  const binary = input.replace(/[^\t ]/g, '').split('').map(c => c === '\t' ? '1' : '0').join('');
  const bytes: number[] = [];
  
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Punctuation encoding
const PUNCT_MAP: Record<string, string> = { '0': '.', '1': ',' };
const PUNCT_REVERSE: Record<string, string> = { '.': '0', ',': '1' };

function punctuationEncode(input: string): string {
  const binary = Array.from(new TextEncoder().encode(input))
    .map(b => b.toString(2).padStart(8, '0'))
    .join('');
  return binary.split('').map(b => PUNCT_MAP[b]).join('');
}

function punctuationDecode(input: string): string {
  const binary = input.split('').map(c => PUNCT_REVERSE[c] || '').join('');
  const bytes: number[] = [];
  
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Synonym shuffling (simple word substitution)
const SYNONYM_MAP: Record<string, string[]> = {
  'hello': ['hi', 'hey', 'greetings'],
  'world': ['earth', 'globe', 'planet'],
  'good': ['great', 'excellent', 'fine'],
  'bad': ['terrible', 'awful', 'poor'],
  'big': ['large', 'huge', 'massive'],
  'small': ['tiny', 'little', 'mini'],
  'fast': ['quick', 'rapid', 'swift'],
  'slow': ['sluggish', 'gradual', 'leisurely']
};

function synonymShuffle(input: string): string {
  const words = input.split(/\s+/);
  return words.map(word => {
    const lower = word.toLowerCase();
    const synonyms = SYNONYM_MAP[lower];
    if (synonyms && synonyms.length > 0) {
      return synonyms[Math.floor(Math.random() * synonyms.length)];
    }
    return word;
  }).join(' ');
}

// ==================== TEXT UTILITIES ====================

function reverseString(input: string): string {
  return input.split('').reverse().join('');
}

function toUpperCase(input: string): string {
  return input.toUpperCase();
}

function toLowerCase(input: string): string {
  return input.toLowerCase();
}

function md5Hash(input: string): string {
  // Simple hash for demo - in production use crypto library
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ==================== TRANSFORMATIONS REGISTRY ====================

export const transformations: Transformation[] = [
  // ===== BASE ENCODINGS =====
  {
    id: 'base64',
    name: 'Base64',
    category: 'Base Encoding',
    description: 'Standard Base64 encoding/decoding',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: base64Encode,
    decode: base64Decode,
  },
  {
    id: 'base32',
    name: 'Base32',
    category: 'Base Encoding',
    description: 'RFC 4648 compliant Base32 encoding',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: base32Encode,
    decode: base32Decode,
  },
  {
    id: 'base58',
    name: 'Base58',
    category: 'Base Encoding',
    description: 'Bitcoin-style Base58 encoding',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: base58Encode,
    decode: base58Decode,
  },
  {
    id: 'base85',
    name: 'Base85 / ASCII85',
    category: 'Base Encoding',
    description: 'ASCII85 encoding with <~ ~> delimiters',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: base85Encode,
    decode: base85Decode,
  },
  {
    id: 'hex',
    name: 'Hexadecimal',
    category: 'Base Encoding',
    description: 'Hex encoding (Base16)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: hexEncode,
    decode: hexDecode,
  },
  {
    id: 'binary',
    name: 'Binary (8-bit)',
    category: 'Base Encoding',
    description: '8-bit binary representation',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: binaryEncode,
    decode: binaryDecode,
  },
  {
    id: 'binary7',
    name: 'Binary (7-bit)',
    category: 'Base Encoding',
    description: '7-bit binary (ASCII range)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: (input) => binaryEncode(input, { bits: 7 }),
    decode: binaryDecode,
  },
  // ===== WEB ENCODINGS =====
  {
    id: 'url',
    name: 'URL Encode',
    category: 'Web',
    description: 'Percent-encoding for URLs',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: urlEncode,
    decode: urlDecode,
  },
  {
    id: 'html-entity',
    name: 'HTML Entity',
    category: 'Web',
    description: 'HTML numeric character references',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: htmlEntityEncode,
    decode: htmlEntityDecode,
  },
  {
    id: 'unicode-escape',
    name: 'Unicode Escape',
    category: 'Web',
    description: 'JavaScript-style \\uXXXX escapes',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: unicodeEscapeEncode,
    decode: unicodeEscapeDecode,
  },
  // ===== CIPHERS =====
  {
    id: 'rot13',
    name: 'ROT13',
    category: 'Cipher',
    description: 'Caesar cipher with 13-character rotation',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: rot13,
    decode: rot13,
  },
  {
    id: 'rot47',
    name: 'ROT47',
    category: 'Cipher',
    description: 'Rotates ASCII printable characters',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: rot47,
    decode: rot47,
  },
  {
    id: 'caesar',
    name: 'Caesar Cipher',
    category: 'Cipher',
    description: 'Classic shift cipher (default shift: 3)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: caesarCipher,
    decode: caesarDecipher,
  },
  {
    id: 'atbash',
    name: 'Atbash Cipher',
    category: 'Cipher',
    description: 'Hebrew mirror cipher (A↔Z, B↔Y, etc.)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: atbashCipher,
    decode: atbashCipher, // Atbash is self-inverse
  },
  {
    id: 'custom-rot',
    name: 'Custom ROT',
    category: 'Cipher',
    description: 'User-defined rotation shift (default: 5)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: rotN,
    decode: rotNDecode,
  },
  // ===== LEETSPEAK =====
  {
    id: 'leet-light',
    name: 'Leetspeak (Light)',
    category: 'Substitution',
    description: 'Simple letter substitution (a→4, e→3)',
    canEncode: true,
    canDecode: true,
    reversibility: 'partial',
    riskLevel: 'low',
    encode: (input) => leetspeakEncode(input, { level: 'light' }),
    decode: leetspeakDecode,
  },
  {
    id: 'leet-heavy',
    name: 'Leetspeak (Heavy)',
    category: 'Substitution',
    description: 'Complex letter substitution (a→/-\\)',
    canEncode: true,
    canDecode: false,
    reversibility: 'irreversible',
    riskLevel: 'medium',
    encode: (input) => leetspeakEncode(input, { level: 'heavy' }),
  },
  // ===== STEGANOGRAPHY =====
  {
    id: 'braille',
    name: 'Braille Unicode',
    category: 'Steganography',
    description: 'Encode text as Braille Unicode characters',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: brailleEncode,
    decode: brailleDecode,
  },
  {
    id: 'homoglyph',
    name: 'Homoglyph',
    category: 'Steganography',
    description: 'Replace characters with similar-looking Unicode',
    canEncode: true,
    canDecode: false,
    reversibility: 'irreversible',
    riskLevel: 'medium',
    encode: homoglyphEncode,
  },
  {
    id: 'zerowidth-encode',
    name: 'Zero-Width Encode',
    category: 'Steganography',
    description: 'Hide secret message in zero-width characters',
    canEncode: true,
    canDecode: false,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: (input, options) => zeroWidthEncode(options?.carrier as string || 'hidden message: ', input),
  },
  {
    id: 'zerowidth-decode',
    name: 'Zero-Width Decode',
    category: 'Steganography',
    description: 'Extract hidden message from zero-width chars',
    canEncode: false,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    decode: zeroWidthDecode,
  },
  {
    id: 'zerowidth-reveal',
    name: 'Zero-Width Reveal',
    category: 'Steganography',
    description: 'Visualize hidden zero-width characters',
    canEncode: false,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    decode: zeroWidthReveal,
  },
  {
    id: 'zerowidth-remove',
    name: 'Zero-Width Remove',
    category: 'Steganography',
    description: 'Strip all zero-width characters',
    canEncode: false,
    canDecode: true,
    reversibility: 'irreversible',
    riskLevel: 'low',
    decode: zeroWidthRemove,
  },
  // ===== EMOJI STEGANOGRAPHY =====
  {
    id: 'emoji-alphabet',
    name: 'Emoji Alphabet',
    category: 'Emoji',
    description: 'Map letters to themed emojis (A→🍎)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: emojiAlphabetEncode,
    decode: emojiAlphabetDecode,
  },
  {
    id: 'binary-emoji',
    name: 'Binary Emoji',
    category: 'Emoji',
    description: 'Binary as circles (0→⚫, 1→⚪)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: binaryEmojiEncode,
    decode: binaryEmojiDecode,
  },
  {
    id: 'base64-emoji',
    name: 'Base64 → Emoji',
    category: 'Emoji',
    description: 'Base64 characters as face emojis',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: base64EmojiEncode,
    decode: base64EmojiDecode,
  },
  {
    id: 'emoji-padding',
    name: 'Emoji Padding',
    category: 'Emoji',
    description: 'Add invisible emoji modifiers',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: emojiPaddingEncode,
    decode: emojiPaddingDecode,
  },
  {
    id: 'emoji-noise',
    name: 'Emoji Noise',
    category: 'Emoji',
    description: 'Inject random face emojis as noise',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: emojiNoiseEncode,
    decode: emojiNoiseDecode,
  },
  {
    id: 'emoji-skintone',
    name: 'Emoji Skin Tone',
    category: 'Emoji',
    description: 'Encode data in skin tone variations',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: emojiSkinToneEncode,
    decode: emojiSkinToneDecode,
  },
  // ===== OBFUSCATION =====
  {
    id: 'case-encode',
    name: 'Case Encoding',
    category: 'Obfuscation',
    description: 'Encode in letter case (upper=1, lower=0)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: caseEncode,
    decode: caseDecode,
  },
  {
    id: 'whitespace',
    name: 'Whitespace',
    category: 'Obfuscation',
    description: 'Encode as tabs and spaces',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: whitespaceEncode,
    decode: whitespaceDecode,
  },
  {
    id: 'punctuation',
    name: 'Punctuation',
    category: 'Obfuscation',
    description: 'Encode as dots and commas',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: punctuationEncode,
    decode: punctuationDecode,
  },
  {
    id: 'synonym',
    name: 'Synonym Shuffle',
    category: 'Obfuscation',
    description: 'Replace words with random synonyms',
    canEncode: true,
    canDecode: false,
    reversibility: 'irreversible',
    riskLevel: 'high',
    encode: synonymShuffle,
  },
  // ===== TEXT UTILITIES =====
  {
    id: 'reverse',
    name: 'Reverse',
    category: 'Text',
    description: 'Reverse character order',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: reverseString,
    decode: reverseString,
  },
  {
    id: 'uppercase',
    name: 'Uppercase',
    category: 'Text',
    description: 'Convert to uppercase',
    canEncode: true,
    canDecode: false,
    reversibility: 'partial',
    riskLevel: 'low',
    encode: toUpperCase,
  },
  {
    id: 'lowercase',
    name: 'Lowercase',
    category: 'Text',
    description: 'Convert to lowercase',
    canEncode: true,
    canDecode: false,
    reversibility: 'partial',
    riskLevel: 'low',
    encode: toLowerCase,
  },
  // ===== HASH =====
  {
    id: 'hash',
    name: 'Hash (Demo)',
    category: 'Hash',
    description: 'One-way hash function',
    canEncode: true,
    canDecode: false,
    reversibility: 'irreversible',
    riskLevel: 'high',
    encode: md5Hash,
  },
  // ===== NEW CIPHERS (Improvements #1-8) =====
  {
    id: 'vigenere',
    name: 'Vigenère Cipher',
    category: 'Cipher',
    description: 'Polyalphabetic cipher with keyword (default: SECRET)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: vigenereEncode,
    decode: vigenereDecode,
  },
  {
    id: 'xor',
    name: 'XOR Encryption',
    category: 'Cipher',
    description: 'Symmetric XOR cipher with key (output as hex)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: xorEncode,
    decode: xorDecode,
  },
  {
    id: 'aes',
    name: 'AES Encryption',
    category: 'Cipher',
    description: 'AES-256-GCM encryption (simplified demo)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'medium',
    encode: aesEncodeSync,
    decode: aesDecodeSync,
  },
  {
    id: 'morse',
    name: 'Morse Code',
    category: 'Cipher',
    description: 'International Morse code encoding',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: morseEncode,
    decode: morseDecode,
  },
  {
    id: 'bacon',
    name: 'Bacon Cipher',
    category: 'Cipher',
    description: 'Baconian cipher using A/B (steganographic)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: baconEncode,
    decode: baconDecode,
  },
  {
    id: 'railfence',
    name: 'Rail Fence Cipher',
    category: 'Cipher',
    description: 'Transposition cipher with 3 rails',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: railFenceEncode,
    decode: railFenceDecode,
  },
  {
    id: 'affine',
    name: 'Affine Cipher',
    category: 'Cipher',
    description: 'Mathematical cipher (ax + b mod 26)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: affineEncode,
    decode: affineDecode,
  },
  {
    id: 'polybius',
    name: 'Polybius Square',
    category: 'Cipher',
    description: '5x5 grid encoding (row/col coordinates)',
    canEncode: true,
    canDecode: true,
    reversibility: 'reversible',
    riskLevel: 'low',
    encode: polybiusEncode,
    decode: polybiusDecode,
  },
  // ===== CRYPTO HASHES (Improvements #9-10) =====
  {
    id: 'sha256',
    name: 'SHA-256',
    category: 'Hash',
    description: 'SHA-256 cryptographic hash (256-bit)',
    canEncode: true,
    canDecode: false,
    reversibility: 'irreversible',
    riskLevel: 'high',
    encode: sha256Encode,
  },
  {
    id: 'sha512',
    name: 'SHA-512',
    category: 'Hash',
    description: 'SHA-512 cryptographic hash (512-bit)',
    canEncode: true,
    canDecode: false,
    reversibility: 'irreversible',
    riskLevel: 'high',
    encode: sha512Encode,
  },
  {
    id: 'md5',
    name: 'MD5',
    category: 'Hash',
    description: 'MD5 hash (128-bit, legacy)',
    canEncode: true,
    canDecode: false,
    reversibility: 'irreversible',
    riskLevel: 'high',
    encode: md5Encode,
  },
  // ===== ANALYSIS TOOLS (Improvements #21-24) =====
  {
    id: 'frequency',
    name: 'Frequency Analysis',
    category: 'Analysis',
    description: 'Character frequency analysis for cryptanalysis',
    canEncode: true,
    canDecode: false,
    reversibility: 'irreversible',
    riskLevel: 'low',
    encode: frequencyAnalysis,
  },
  {
    id: 'bruteforce-caesar',
    name: 'Brute Force Caesar',
    category: 'Analysis',
    description: 'Try all 25 Caesar/ROT shift values',
    canEncode: false,
    canDecode: true,
    reversibility: 'irreversible',
    riskLevel: 'low',
    decode: bruteForceCaesar,
  },
  {
    id: 'char-stats',
    name: 'Character Statistics',
    category: 'Analysis',
    description: 'Count characters, words, lines, bytes',
    canEncode: true,
    canDecode: false,
    reversibility: 'irreversible',
    riskLevel: 'low',
    encode: characterStats,
  },
];

export function getTransformationsForMode(mode: TransformMode): Transformation[] {
  if (mode === 'encode') {
    return transformations.filter(t => t.canEncode);
  }
  if (mode === 'decode') {
    return transformations.filter(t => t.canDecode);
  }
  return transformations;
}

export function detectPossibleEncodings(input: string): Transformation[] {
  const detected: Transformation[] = [];
  
  // ===== IMPROVEMENT #25: JWT Detection =====
  // JWT format: xxxxx.xxxxx.xxxxx (base64url encoded parts)
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(input)) {
    detected.push(transformations.find(t => t.id === 'jwt-decode')!);
  }
  
  // Check for Base64
  if (/^[A-Za-z0-9+/]+=*$/.test(input) && input.length % 4 === 0) {
    detected.push(transformations.find(t => t.id === 'base64')!);
  }
  
  // Check for Base32
  if (/^[A-Z2-7]+=*$/i.test(input)) {
    detected.push(transformations.find(t => t.id === 'base32')!);
  }
  
  // Check for Base58
  if (/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(input)) {
    detected.push(transformations.find(t => t.id === 'base58')!);
  }
  
  // Check for Base85
  if (input.startsWith('<~') && input.endsWith('~>')) {
    detected.push(transformations.find(t => t.id === 'base85')!);
  }
  
  // Check for Hex
  if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0) {
    detected.push(transformations.find(t => t.id === 'hex')!);
  }
  
  // Check for Binary
  if (/^[01\s]+$/.test(input)) {
    detected.push(transformations.find(t => t.id === 'binary')!);
  }
  
  // Check for URL encoded
  if (/%[0-9A-Fa-f]{2}/.test(input)) {
    detected.push(transformations.find(t => t.id === 'url')!);
  }
  
  // Check for HTML entities
  if (/&#\d+;|&#x[0-9a-fA-F]+;|&\w+;/.test(input)) {
    detected.push(transformations.find(t => t.id === 'html-entity')!);
  }
  
  // Check for Unicode escapes
  if (/\\u[0-9a-fA-F]{4}/.test(input)) {
    detected.push(transformations.find(t => t.id === 'unicode-escape')!);
  }
  
  // Check for Braille
  if (/[\u2800-\u28FF]/.test(input)) {
    detected.push(transformations.find(t => t.id === 'braille')!);
  }
  
  // Check for zero-width characters
  if (/[\u200B\u200C\u200D]/.test(input)) {
    detected.push(transformations.find(t => t.id === 'zerowidth-decode')!);
    detected.push(transformations.find(t => t.id === 'zerowidth-reveal')!);
  }
  
  // Check for binary emoji
  if (/^[⚫⚪]+$/.test(input)) {
    detected.push(transformations.find(t => t.id === 'binary-emoji')!);
  }
  
  // Check for emoji alphabet (using Array.some for proper emoji handling)
  const emojiAlphabetChars = ['🍎', '🍌', '🐱', '🐕', '🦅', '🐸', '🍇', '🏠', '🍦', '🃏', '🔑', '🦁', '🌙', '📰', '🐙', '🍕', '👸', '🌈', '⭐', '🌲', '☂️', '🎻', '🐋', '✖️', '💛', '⚡'];
  if (emojiAlphabetChars.some(emoji => input.includes(emoji))) {
    detected.push(transformations.find(t => t.id === 'emoji-alphabet')!);
  }
  
  // Check for punctuation encoding
  if (/^[.,]+$/.test(input) && input.length >= 8) {
    detected.push(transformations.find(t => t.id === 'punctuation')!);
  }
  
  // Check for whitespace encoding
  if (/^[\t ]+\n?$/.test(input) && input.length >= 8) {
    detected.push(transformations.find(t => t.id === 'whitespace')!);
  }
  
  // Check for skin tone steganography
  const skinTones = ['🏻', '🏼', '🏽', '🏾', '🏿'];
  if (input.includes('👋') && skinTones.some(tone => input.includes(tone))) {
    detected.push(transformations.find(t => t.id === 'emoji-skintone')!);
  }
  
  // ===== NEW DETECTION: Morse Code =====
  // Morse uses dots, dashes, spaces, and slashes
  if (/^[.\-\s/]+$/.test(input) && input.includes('.') && (input.includes('-') || input.includes('/'))) {
    detected.push(transformations.find(t => t.id === 'morse')!);
  }
  
  // ===== NEW DETECTION: Bacon Cipher =====
  // Bacon uses only A and B in groups of 5
  if (/^[AB\s]+$/i.test(input) && input.replace(/\s/g, '').length % 5 === 0) {
    detected.push(transformations.find(t => t.id === 'bacon')!);
  }
  
  // ===== NEW DETECTION: Polybius =====
  // Polybius uses pairs of digits 1-5
  if (/^[\d\s]+$/.test(input) && /[1-5]{2}/.test(input)) {
    detected.push(transformations.find(t => t.id === 'polybius')!);
  }
  
  // ===== IMPROVEMENT #22: Suggest Brute Force for short encrypted text =====
  // If input looks like it could be a simple cipher (all letters, no obvious pattern)
  if (/^[A-Za-z\s]+$/.test(input) && input.length >= 10 && input.length <= 500) {
    detected.push(transformations.find(t => t.id === 'bruteforce-caesar')!);
  }
  
  return detected.filter(Boolean);
}

// ===== IMPROVEMENT #27: Detection with Confidence Scores =====
export interface DetectionResult {
  transformation: Transformation;
  confidence: number; // 0-100
  reason: string;
}

export function detectWithConfidence(input: string): DetectionResult[] {
  const results: DetectionResult[] = [];
  
  // JWT Detection - High confidence if format matches exactly
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(input)) {
    const parts = input.split('.');
    if (parts.length === 3 && parts[0].length > 10 && parts[1].length > 10) {
      results.push({
        transformation: transformations.find(t => t.id === 'jwt-decode')!,
        confidence: 95,
        reason: 'Matches JWT format (header.payload.signature)'
      });
    }
  }
  
  // Base64 - Check if decodes to valid content
  if (/^[A-Za-z0-9+/]+=*$/.test(input) && input.length % 4 === 0 && input.length >= 4) {
    let confidence = 60;
    const t = transformations.find(t => t.id === 'base64')!;
    try {
      const decoded = t.decode!(input);
      // If decoded contains mostly printable chars, higher confidence
      const printableRatio = (decoded.match(/[\x20-\x7E]/g) || []).length / decoded.length;
      if (printableRatio > 0.8) confidence = 90;
      else if (printableRatio > 0.5) confidence = 75;
    } catch {
      confidence = 40;
    }
    results.push({
      transformation: t,
      confidence,
      reason: 'Matches Base64 character set with valid padding'
    });
  }
  
  // Hex - Even length, all hex chars
  if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0 && input.length >= 2) {
    const confidence = input.length > 8 ? 80 : 50;
    results.push({
      transformation: transformations.find(t => t.id === 'hex')!,
      confidence,
      reason: 'Even number of hexadecimal characters'
    });
  }
  
  // Morse Code
  if (/^[.\-\s/]+$/.test(input) && input.includes('.')) {
    const hasDashes = input.includes('-');
    const hasSlashes = input.includes('/');
    let confidence = 50;
    if (hasDashes && hasSlashes) confidence = 90;
    else if (hasDashes) confidence = 75;
    results.push({
      transformation: transformations.find(t => t.id === 'morse')!,
      confidence,
      reason: 'Contains Morse code characters (. - /)'
    });
  }
  
  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}

// ===== IMPROVEMENT #28: Multi-layer Detection =====
export function detectMultiLayer(input: string, maxDepth: number = 3): string[] {
  const layers: string[] = [];
  let current = input;
  let depth = 0;
  
  while (depth < maxDepth) {
    const detected = detectPossibleEncodings(current);
    if (detected.length === 0) break;
    
    // Try the first detected encoding
    const firstMatch = detected[0];
    if (!firstMatch.decode) break;
    
    try {
      const decoded = firstMatch.decode(current);
      if (decoded === current || decoded.length === 0) break;
      
      layers.push(`Layer ${depth + 1}: ${firstMatch.name}`);
      current = decoded;
      depth++;
    } catch {
      break;
    }
  }
  
  if (layers.length > 0) {
    layers.push(`Final: ${current.slice(0, 100)}${current.length > 100 ? '...' : ''}`);
  }
  
  return layers;
}

