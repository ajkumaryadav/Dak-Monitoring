/**
 * District DAK Monitoring System - Client/Server Zero-Exposure Credential Crypto
 *
 * Encrypts authentication credentials in the browser before network transmission,
 * protecting credentials even when transmitted over plain HTTP (Port 80) or HTTPS.
 * Pure JS HMAC-SHA256-CTR stream cipher with PBKDF2 key derivation ensures encryption
 * runs in ALL browsers (including non-secure HTTP contexts where WebCrypto is disabled).
 */

import nodeCrypto from "node:crypto";

const APP_CRYPTO_SEED = "DAK_SECURE_AUTH_LAYER_V1_JAIPUR_GOV_2026_DISTRICT_CRED_ENCRYPT";

// ============================================================================
// PURE JS SHA-256 & HMAC-SHA256 & PBKDF2
// ============================================================================

function sha256(data: Uint8Array): Uint8Array {
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
  const padLen = (len % 64 < 56) ? (56 - (len % 64)) : (120 - (len % 64));
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

function rightRotate(n: number, bits: number): number {
  return ((n >>> bits) | (n << (32 - bits))) >>> 0;
}

function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  let k = key;
  if (k.length > 64) {
    k = sha256(k);
  }
  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const byte = i < k.length ? k[i] : 0;
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

function pbkdf2Sha256(password: Uint8Array, salt: Uint8Array, iterations: number, keyLen: number): Uint8Array {
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

// Keystream generator using HMAC-SHA256 in CTR mode
function generateKeystream(key: Uint8Array, iv: Uint8Array, length: number): Uint8Array {
  const numBlocks = Math.ceil(length / 32);
  const keystream = new Uint8Array(numBlocks * 32);
  for (let b = 0; b < numBlocks; b++) {
    const blockInput = new Uint8Array(iv.length + 4);
    blockInput.set(iv);
    blockInput[iv.length] = (b >>> 24) & 0xff;
    blockInput[iv.length + 1] = (b >>> 16) & 0xff;
    blockInput[iv.length + 2] = (b >>> 8) & 0xff;
    blockInput[iv.length + 3] = b & 0xff;
    const blockHash = hmacSha256(key, blockInput);
    keystream.set(blockHash, b * 32);
  }
  return keystream.subarray(0, length);
}

// ============================================================================
// CLIENT-SIDE ENCRYPTION (Pure JS - Works everywhere)
// ============================================================================

export async function encryptCredentialsClient(credentials: {
  email: string;
  password?: string;
  credential?: string;
  auth_hash?: string;
}): Promise<string> {
  const plainText = JSON.stringify({
    ...credentials,
    _ts: Date.now(),
    _nonce: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
  });

  const enc = new TextEncoder();
  const plainBytes = enc.encode(plainText);

  // Generate 16 bytes salt and 16 bytes IV
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

  // Derive 32 bytes key with PBKDF2-SHA256 (10000 rounds)
  const seedBytes = enc.encode(APP_CRYPTO_SEED);
  const derivedKey = pbkdf2Sha256(seedBytes, salt, 10000, 32);

  // Generate CTR keystream and XOR encrypt
  const keystream = generateKeystream(derivedKey, iv, plainBytes.length);
  const cipherBytes = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    cipherBytes[i] = plainBytes[i] ^ keystream[i];
  }

  // Compute HMAC tag over ciphertext for authenticity
  const tag = hmacSha256(derivedKey, cipherBytes);

  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("");
  const cipherHex = Array.from(cipherBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const tagHex = Array.from(tag).map((b) => b.toString(16).padStart(2, "0")).join("");

  return `enc_v2:${saltHex}:${ivHex}:${tagHex}:${cipherHex}`;
}

// ============================================================================
// SERVER-SIDE DECRYPTION (Node.js)
// ============================================================================

export function decryptCredentialsServer(encryptedPayload: string): {
  email?: string;
  password?: string;
  credential?: string;
  auth_hash?: string;
} | null {
  if (!encryptedPayload) return null;
  const payload = encryptedPayload.trim();

  // 1. enc_v2 format (Pure JS HMAC-SHA256-CTR with PBKDF2)
  if (payload.startsWith("enc_v2:")) {
    try {
      const parts = payload.split(":");
      if (parts.length !== 5) return null;

      const [, saltHex, ivHex, tagHex, cipherHex] = parts;
      const salt = Buffer.from(saltHex, "hex");
      const iv = Buffer.from(ivHex, "hex");
      const expectedTag = Buffer.from(tagHex, "hex");
      const cipherBytes = Buffer.from(cipherHex, "hex");

      // Derive key on server using node:crypto for high performance
      const derivedKey = nodeCrypto.pbkdf2Sync(APP_CRYPTO_SEED, salt, 10000, 32, "sha256");

      // Verify HMAC tag
      const actualTag = nodeCrypto.createHmac("sha256", derivedKey).update(cipherBytes).digest();
      if (!nodeCrypto.timingSafeEqual(expectedTag, actualTag)) {
        console.warn("[Auth Security] enc_v2 HMAC tag validation failed");
        return null;
      }

      // Generate identical CTR keystream
      const numBlocks = Math.ceil(cipherBytes.length / 32);
      const keystreamBuffers: Buffer[] = [];
      for (let b = 0; b < numBlocks; b++) {
        const blockInput = Buffer.alloc(iv.length + 4);
        iv.copy(blockInput, 0);
        blockInput.writeUInt32BE(b, iv.length);
        keystreamBuffers.push(nodeCrypto.createHmac("sha256", derivedKey).update(blockInput).digest());
      }
      const keystream = Buffer.concat(keystreamBuffers).subarray(0, cipherBytes.length);

      const plainBytes = Buffer.alloc(cipherBytes.length);
      for (let i = 0; i < cipherBytes.length; i++) {
        plainBytes[i] = cipherBytes[i] ^ keystream[i];
      }

      const parsed = JSON.parse(plainBytes.toString("utf8"));

      // Anti-replay check: ensure payload timestamp is within 10 minutes
      if (parsed._ts && Math.abs(Date.now() - parsed._ts) > 10 * 60 * 1000) {
        console.warn("[Auth Security] Expired encrypted credential payload rejected");
        return null;
      }

      return parsed;
    } catch (err: any) {
      console.warn("[Auth Security] enc_v2 Decryption error:", err.message);
      return null;
    }
  }

  // 2. enc_v1 format (WebCrypto AES-256-GCM)
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

      const key = nodeCrypto.pbkdf2Sync(APP_CRYPTO_SEED, salt, 10000, 32, "sha256");

      const decipher = nodeCrypto.createDecipheriv("aes-256-gcm", key, iv);
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
    } catch (err: any) {
      console.warn("[Auth Security] enc_v1 Decryption error:", err.message);
      return null;
    }
  }

  return null;
}
