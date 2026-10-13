import crypto from 'crypto';

/**
 * BioSync AI - Field-Level Protected Health Information (PHI) Authenticated Encryption
 * 
 * Implements AES-256-GCM authenticated envelope encryption for HIPAA & GDPR compliance.
 * Each encryption operation utilizes:
 * - A cryptographically random 96-bit (12-byte) initialization vector (IV).
 * - A 128-bit (16-byte) GCM authentication tag for tamper resistance and integrity guarantee.
 * - Wire format: `aes256gcm:ivHex:tagHex:cipherHex`
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

// Derives a 32-byte (256-bit) master encryption key deterministically
const getDerivedMasterKey = () => {
  const secretSource = process.env.PHI_ENCRYPTION_KEY || process.env.JWT_SECRET || 'BioSyncAI-Production-HIPAA-Master-Encryption-Secret-Key-Entropy-9921';
  return crypto.createHash('sha256').update(secretSource).digest();
};

/**
 * Encrypts a plaintext string or object into an authenticated AES-256-GCM string
 */
export const encryptField = (plainValue) => {
  if (plainValue === undefined || plainValue === null) return plainValue;

  const textToEncrypt = typeof plainValue === 'object' ? JSON.stringify(plainValue) : String(plainValue);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const key = getDerivedMasterKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `aes256gcm:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts an authenticated AES-256-GCM string back into plaintext
 */
export const decryptField = (cipherPayload) => {
  if (!cipherPayload || typeof cipherPayload !== 'string') return cipherPayload;

  // Check if string matches format `aes256gcm:iv:tag:cipher`
  const parts = cipherPayload.split(':');
  if (parts.length !== 4 || parts[0] !== 'aes256gcm') {
    // Value was not encrypted or is plaintext
    return cipherPayload;
  }

  try {
    const [, ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const key = getDerivedMasterKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Attempt JSON parse if it was a serialized object
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error('[Encryption] Field decryption authentication failure:', err.message);
    throw new Error('Integrity check failed: Encrypted field has been corrupted or tampered with.');
  }
};

/**
 * Helper to check if a value is encrypted
 */
export const isEncrypted = (val) => {
  return typeof val === 'string' && val.startsWith('aes256gcm:') && val.split(':').length === 4;
};

/**
 * Deep encrypts specified sensitive fields in an object
 */
export const encryptSensitiveFields = (obj, fields = ['address', 'emergencyContact', 'medicalNotes', 'doctorRemarks']) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };

  for (const field of fields) {
    if (clone[field] !== undefined && clone[field] !== null && !isEncrypted(clone[field])) {
      clone[field] = encryptField(clone[field]);
    }
  }
  return clone;
};

/**
 * Deep decrypts specified sensitive fields in an object
 */
export const decryptSensitiveFields = (obj, fields = ['address', 'emergencyContact', 'medicalNotes', 'doctorRemarks']) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };

  for (const field of fields) {
    if (clone[field] && isEncrypted(clone[field])) {
      clone[field] = decryptField(clone[field]);
    }
  }
  return clone;
};
