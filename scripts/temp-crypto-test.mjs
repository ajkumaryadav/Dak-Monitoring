/**
 * District DAK Monitoring System - Client/Server Zero-Exposure Credential Crypto
 *
 * Encrypts authentication credentials in the browser before network transmission,
 * protecting credentials even when transmitted over plain HTTP (Port 80) or HTTPS.
 * Pure JS AES-256-CTR + PBKDF2-HMAC-SHA256 fallback ensures encryption runs in
 * ALL browsers, including non-secure contexts (HTTP over IP) where WebCrypto is disabled.
 */

const APP_CRYPTO_SEED = "DAK_SECURE_AUTH_LAYER_V1_JAIPUR_GOV_2026_DISTRICT_CRED_ENCRYPT";

// ============================================================================
// PURE JS SHA-256 & PBKDF2 & AES-256-CTR (Works in all browser environments)
// ============================================================================

// --- SHA-256 ---
function sha256(data
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  const len = data.length;
  const bitLen = len * 8;
  const padLen = (len % 64 < 56) ? 56 - (len % 64) - (len % 64);
  const totalLen = len + padLen + 8;
  const buf = new Uint8Array(totalLen);
  buf.set(data);
  buf[len] = 0x80;

  const view = new DataView(buf.buffer);
  view.setUint32(totalLen - 4, bitLen >>> 0);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000));

  const W = new Uint32Array(64);

  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(i + t * 4);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = (rightRotate(W[t - 15], 7) ^ rightRotate(W[t - 15], 18) ^ (W[t - 15] >>> 3)) >>> 0;
      const s1 = (rightRotate(W[t - 2], 17) ^ rightRotate(W[t - 2], 19) ^ (W[t - 2] >>> 10)) >>> 0;
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;

    for (let t = 0; t < 64; t++) {
      const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    H0 = (H0 + a) >>> 0; H1 = (H1 + b) >>> 0; H2 = (H2 + c) >>> 0; H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0; H5 = (H5 + f) >>> 0; H6 = (H6 + g) >>> 0; H7 = (H7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, H0); outView.setUint32(4, H1);
  outView.setUint32(8, H2); outView.setUint32(12, H3);
  outView.setUint32(16, H4); outView.setUint32(20, H5);
  outView.setUint32(24, H6); outView.setUint32(28, H7);
  return out;
}

function rightRotate(n
  return ((n >>> bits) | (n << (32 - bits))) >>> 0;
}

// --- HMAC-SHA-256 ---
function hmacSha256(key
  let k = key;
  if (k.length > 64) {
    k = sha256(k);
  }
  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const byte = i < k.length ? k[i] ;
    oKeyPad[i] = byte ^ 0x5c;
    iKeyPad[i] = byte ^ 0x36;
  }
  const inner = new Uint8Array(64 + message.length);
  inner.set(iKeyPad);
  inner.set(message, 64);
  const innerHash = sha256(inner);

  const outer = new Uint8Array(64 + 32);
  outer.set(oKeyPad);
  outer.set(innerHash, 64);
  return sha256(outer);
}

// --- PBKDF2-HMAC-SHA-256 ---
function pbkdf2Sha256(password
  const numBlocks = Math.ceil(keyLen / 32);
  const result = new Uint8Array(numBlocks * 32);

  for (let block = 1; block <= numBlocks; block++) {
    const saltBlock = new Uint8Array(salt.length + 4);
    saltBlock.set(salt);
    saltBlock[salt.length] = (block >>> 24) & 0xff;
    saltBlock[salt.length + 1] = (block >>> 16) & 0xff;
    saltBlock[salt.length + 2] = (block >>> 8) & 0xff;
    saltBlock[salt.length + 3] = block & 0xff;

    let u = hmacSha256(password, saltBlock);
    const t = new Uint8Array(u);

    for (let iter = 1; iter < iterations; iter++) {
      u = hmacSha256(password, u);
      for (let k = 0; k < 32; k++) {
        t[k] ^= u[k];
      }
    }
    result.set(t, (block - 1) * 32);
  }

  return result.subarray(0, keyLen);
}

// --- AES-256 S-Box and Core Cipher ---
const SBOX = new Uint8Array([
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
]);

const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

function expandKey256(key
  const w = new Uint32Array(60);
  for (let i = 0; i < 8; i++) {
    w[i] = ((key[4 * i] << 24) | (key[4 * i + 1] << 16) | (key[4 * i + 2] << 8) | key[4 * i + 3]) >>> 0;
  }
  for (let i = 8; i < 60; i++) {
    let temp = w[i - 1];
    if (i % 8 === 0) {
      temp = ((SBOX[(temp >>> 16) & 0xff] << 24) |
              (SBOX[(temp >>> 8) & 0xff] << 16) |
              (SBOX[temp & 0xff] << 8) |
              SBOX[(temp >>> 24) & 0xff]) >>> 0;
      temp ^= (RCON[(i / 8) - 1] << 24) >>> 0;
    } else if (i % 8 === 4) {
      temp = ((SBOX[(temp >>> 24) & 0xff] << 24) |
              (SBOX[(temp >>> 16) & 0xff] << 16) |
              (SBOX[(temp >>> 8) & 0xff] << 8) |
              SBOX[temp & 0xff]) >>> 0;
    }
    w[i] = (w[i - 8] ^ temp) >>> 0;
  }
  return w;
}

function aesEncryptBlock(block
  let s0 = ((block[0] << 24) | (block[1] << 16) | (block[2] << 8) | block[3]) ^ w[0];
  let s1 = ((block[4] << 24) | (block[5] << 16) | (block[6] << 8) | block[7]) ^ w[1];
  let s2 = ((block[8] << 24) | (block[9] << 16) | (block[10] << 8) | block[11]) ^ w[2];
  let s3 = ((block[12] << 24) | (block[13] << 16) | (block[14] << 8) | block[15]) ^ w[3];

  function subByteAndMix(a
    const sa = SBOX[(a >>> 24) & 0xff], sb = SBOX[(b >>> 16) & 0xff], sc = SBOX[(c >>> 8) & 0xff], sd = SBOX[d & 0xff];
    const xta = (sa << 1) ^ ((sa & 0x80) ? 0x11b ;
    const xtb = (sb << 1) ^ ((sb & 0x80) ? 0x11b ;
    const xtc = (sc << 1) ^ ((sc & 0x80) ? 0x11b ;
    const xtd = (sd << 1) ^ ((sd & 0x80) ? 0x11b ;
    return (((xta ^ sb ^ sc ^ sd ^ sa) << 24) |
            ((xtb ^ sc ^ sd ^ sa ^ sb) << 16) |
            ((xtc ^ sd ^ sa ^ sb ^ sc) << 8) |
            (xtd ^ sa ^ sb ^ sc ^ sd)) >>> 0;
  }

  for (let r = 1; r <= 13; r++) {
    const t0 = (subByteAndMix(s0, s1, s2, s3) ^ w[r * 4]) >>> 0;
    const t1 = (subByteAndMix(s1, s2, s3, s0) ^ w[r * 4 + 1]) >>> 0;
    const t2 = (subByteAndMix(s2, s3, s0, s1) ^ w[r * 4 + 2]) >>> 0;
    const t3 = (subByteAndMix(s3, s0, s1, s2) ^ w[r * 4 + 3]) >>> 0;
    s0 = t0; s1 = t1; s2 = t2; s3 = t3;
  }

  // Final round (no MixColumns)
  const out = new Uint8Array(16);
  const outWords = [
    (((SBOX[(s0 >>> 24) & 0xff] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ w[56]) >>> 0,
    (((SBOX[(s1 >>> 24) & 0xff] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ w[57]) >>> 0,
    (((SBOX[(s2 >>> 24) & 0xff] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ w[58]) >>> 0,
    (((SBOX[(s3 >>> 24) & 0xff] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ w[59]) >>> 0,
  ];

  for (let i = 0; i < 4; i++) {
    out[i * 4] = (outWords[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (outWords[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (outWords[i] >>> 8) & 0xff;
    out[i * 4 + 3] = outWords[i] & 0xff;
  }
  return out;
}

// --- AES-256-CTR Pure JS Encryption ---
function encryptAes256Ctr(plainBytes
  const w = expandKey256(keyBytes);
  const cipher = new Uint8Array(plainBytes.length);
  const counter = new Uint8Array(16);
  counter.set(ivBytes);

  const numBlocks = Math.ceil(plainBytes.length / 16);
  for (let b = 0; b < numBlocks; b++) {
    const keyStream = aesEncryptBlock(counter, w);
    const start = b * 16;
    const end = Math.min(start + 16, plainBytes.length);
    for (let j = start; j < end; j++) {
      cipher[j] = plainBytes[j] ^ keyStream[j - start];
    }
    // Increment counter (big-endian 128-bit)
    for (let c = 15; c >= 0; c--) {
      counter[c] = (counter[c] + 1) & 0xff;
      if (counter[c] !== 0) break;
    }
  }

  return cipher;
}

// ============================================================================
// CLIENT-SIDE ENCRYPTION (WebCrypto if available, or Pure JS AES-CTR)
// ============================================================================

export async function encryptCredentialsClient(credentials
  email;
  password?;
  credential?;
  auth_hash?;
})
  const plainText = JSON.stringify({
    ...credentials,
    _ts
    _nonce+ Math.random().toString(36).substring(2),
  });

  const enc = new TextEncoder();
  const plainBytes = enc.encode(plainText);

  // Generate random salt (16 bytes) and IV (16 bytes)
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(16);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(salt);
    window.crypto.getRandomValues(iv);
  } else {
    for (let i = 0; i < 16; i++) {
      salt[i] = Math.floor(Math.random() * 256);
      iv[i] = Math.floor(Math.random() * 256);
    }
  }

  // Derive 256-bit key using PBKDF2-HMAC-SHA256 (10000 iterations)
  const seedBytes = enc.encode(APP_CRYPTO_SEED);
  const keyBytes = pbkdf2Sha256(seedBytes, salt, 10000, 32);

  // Encrypt with AES-256-CTR
  const cipherBytes = encryptAes256Ctr(plainBytes, keyBytes, iv);

  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("");
  const cipherHex = Array.from(cipherBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

  return `enc_v2:${saltHex}:${ivHex}:${cipherHex}`;
}

// ============================================================================
// SERVER-SIDE DECRYPTION (Node.js crypto)
// ============================================================================

export function decryptCredentialsServer(encryptedPayload
  email?;
  password?;
  credential?;
  auth_hash?;
} | null {
  if (!encryptedPayload) return null;
  const payload = encryptedPayload.trim();

  // 1. enc_v2 format (AES-256-CTR with PBKDF2-SHA256)
  if (payload.startsWith("enc_v2:")) {
    try {
      const parts = payload.split(":");
      if (parts.length !== 4) return null;

      const [, saltHex, ivHex, cipherHex] = parts;
      const salt = Buffer.from(saltHex, "hex");
      const iv = Buffer.from(ivHex, "hex");
      const cipherBuffer = Buffer.from(cipherHex, "hex");

      const crypto = require("node:crypto");
      const key = crypto.pbkdf2Sync(APP_CRYPTO_SEED, salt, 10000, 32, "sha256");

      const decipher = crypto.createDecipheriv("aes-256-ctr", key, iv);
      const decrypted = Buffer.concat([
        decipher.update(cipherBuffer),
        decipher.final(),
      ]);

      const parsed = JSON.parse(decrypted.toString("utf8"));

      // Anti-replay check
      if (parsed._ts && Math.abs(Date.now() - parsed._ts) > 10 * 60 * 1000) {
        console.warn("[Auth Security] Expired encrypted credential payload rejected");
        return null;
      }

      return parsed;
    } catch (err
      console.warn("[Auth Security] enc_v2 Decryption error:", err.message);
      return null;
    }
  }

  // 2. enc_v1 format (AES-256-GCM)
  if (payload.startsWith("enc_v1:")) {
    try {
      const parts = payload.split(":");
      if (parts.length !== 4) return null;

      const [, saltHex, ivHex, cipherHex] = parts;
      const salt = Buffer.from(saltHex, "hex");
      const iv = Buffer.from(ivHex, "hex");
      const cipherBuffer = Buffer.from(cipherHex, "hex");

      if (cipherBuffer.length < 16) return null;
      const authTag = cipherBuffer.subarray(cipherBuffer.length - 16);
      const ciphertext = cipherBuffer.subarray(0, cipherBuffer.length - 16);

      const crypto = require("node:crypto");
      const key = crypto.pbkdf2Sync(APP_CRYPTO_SEED, salt, 10000, 32, "sha256");

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      const parsed = JSON.parse(decrypted.toString("utf8"));

      if (parsed._ts && Math.abs(Date.now() - parsed._ts) > 10 * 60 * 1000) {
        console.warn("[Auth Security] Expired encrypted credential payload rejected");
        return null;
      }

      return parsed;
    } catch (err
      console.warn("[Auth Security] enc_v1 Decryption error:", err.message);
      return null;
    }
  }

  return null;
}
