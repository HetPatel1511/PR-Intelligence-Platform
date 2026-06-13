import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

import { env } from '../config/env.js';

/**
 * Authenticated encryption for secrets we must store but never expose
 * (currently the GitHub access token).
 *
 * AES-256-GCM gives confidentiality + integrity: a tampered ciphertext fails to
 * decrypt rather than silently returning garbage. The 32-byte key is derived
 * from `TOKEN_ENCRYPTION_KEY` with scrypt and a per-record random salt, so the
 * env value can be any passphrase. Output format (all base64, `:`-joined):
 *
 *   salt : iv : authTag : ciphertext
 */
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // 96-bit nonce is the GCM recommendation.

function deriveKey(salt: Buffer): Buffer {
  return scryptSync(env.TOKEN_ENCRYPTION_KEY, salt, KEY_LENGTH);
}

export function encrypt(plaintext: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [salt, iv, authTag, ciphertext].map((b) => b.toString('base64')).join(':');
}

export function decrypt(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted payload format');
  }

  const salt = Buffer.from(parts[0]!, 'base64');
  const iv = Buffer.from(parts[1]!, 'base64');
  const authTag = Buffer.from(parts[2]!, 'base64');
  const ciphertext = Buffer.from(parts[3]!, 'base64');
  const key = deriveKey(salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
