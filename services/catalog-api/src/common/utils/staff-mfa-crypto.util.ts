import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';

export type EncryptedBlobV1 = {
  v: 1;
  iv: string;
  tag: string;
  data: string;
};

export function parseStaffMfaEncryptionKey(raw: string | undefined): Buffer {
  if (!raw?.trim()) {
    throw new Error('STAFF_MFA_ENCRYPTION_KEY is not configured');
  }
  const trimmed = raw.trim();
  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    key = Buffer.from(trimmed, 'hex');
  } else {
    key = Buffer.from(trimmed, 'base64');
  }
  if (key.length !== 32) {
    throw new Error('STAFF_MFA_ENCRYPTION_KEY must decode to 32 bytes');
  }
  return key;
}

export function encryptStaffMfaSecret(plaintext: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob: EncryptedBlobV1 = {
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: enc.toString('base64'),
  };
  return JSON.stringify(blob);
}

export function decryptStaffMfaSecret(ciphertext: string, key: Buffer): string {
  const parsed = JSON.parse(ciphertext) as EncryptedBlobV1;
  if (parsed.v !== 1) {
    throw new Error('Unsupported MFA secret encryption version');
  }
  const iv = Buffer.from(parsed.iv, 'base64');
  const tag = Buffer.from(parsed.tag, 'base64');
  const data = Buffer.from(parsed.data, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function hashRecoveryCode(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex');
}

export function normalizeRecoveryCodeInput(input: string): string {
  return input.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
}

export function safeCompareHash(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, 'hex');
  const b = Buffer.from(bHex, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function generateRecoveryCodePlain(): string {
  const raw = randomBytes(9).toString('hex').toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 18)}`;
}
