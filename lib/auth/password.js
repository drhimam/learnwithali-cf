// lib/auth/password.js
// Uses Web Crypto API — available in both Cloudflare Workers (edge) and Node.js 15+
// PBKDF2-SHA-256 with 100k iterations and a random 16-byte salt

const ITERATIONS = 100_000;
const KEY_BITS = 256; // 32 bytes

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_BITS
  );
  return new Uint8Array(bits);
}

const toHex = (buf) =>
  Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const fromHex = (hex) => {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
};

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  return `pbkdf2:${toHex(salt)}:${toHex(key)}`;
}

export async function comparePassword(password, hash) {
  if (!hash) return false;
  const parts = hash.split(':');
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;
  const salt = fromHex(parts[1]);
  const expected = fromHex(parts[2]);
  const actual = await deriveKey(password, salt);
  // Constant-time comparison to prevent timing attacks
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
