/**
 * BioSync AI - Hardened File Upload Security Configuration
 * Module: multer.js
 * 
 * Protects against:
 * 1. Trojan Horses & Web Shells disguised as media (.php, .exe, .sh, .py, .bat, .dll)
 * 2. MIME-type spoofing / polyglot payloads via magic-byte header inspection
 * 3. Path traversal attacks (../../etc/passwd) via cryptographic file renaming
 * 4. Double extension evasion (e.g., invoice.pdf.exe)
 * 5. Denial of Service via oversized files
 */

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Strict Allowed Extensions & MIME Mappings
const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);
const ALLOWED_DOC_EXTS = new Set(['.pdf', '.doc', '.docx']);

const BLOCKED_EXECUTABLE_EXTS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js', '.mjs', '.cjs',
  '.py', '.php', '.phtml', '.php3', '.php4', '.php5', '.phps', '.jsp', '.asp',
  '.aspx', '.html', '.htm', '.svg', '.dll', '.so', '.wasm', '.jar', '.war',
  '.cgi', '.pl', '.com', '.scr', '.hta', '.msi'
]);

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const ALLOWED_DOC_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

/**
 * Validates file extension, flags double-extension evasion,
 * and ensures no executable extensions are present.
 */
function validateSafeFileName(originalName, allowedExts) {
  if (!originalName || typeof originalName !== 'string') {
    return { valid: false, reason: 'Invalid or missing filename.' };
  }

  // Reject null bytes and path traversal attempts
  if (originalName.includes('\0') || originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    return { valid: false, reason: 'Malicious path traversal or null byte detected in filename.' };
  }

  const lowerName = originalName.toLowerCase();
  const ext = path.extname(lowerName);

  // Check against blacklisted executable extensions
  if (BLOCKED_EXECUTABLE_EXTS.has(ext)) {
    return { valid: false, reason: `Dangerous file type detected (${ext}). Executables and scripts are prohibited.` };
  }

  // Check against double extension evasion (e.g., photo.exe.jpg or invoice.php.png)
  const parts = lowerName.split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length - 1; i++) {
      const intermediateExt = `.${parts[i]}`;
      if (BLOCKED_EXECUTABLE_EXTS.has(intermediateExt)) {
        return { valid: false, reason: `Double extension evasion attempt blocked: ${intermediateExt}` };
      }
    }
  }

  // Verify extension is in whitelist
  if (!allowedExts.has(ext)) {
    return { valid: false, reason: `File extension ${ext} is not allowed.` };
  }

  return { valid: true, cleanExt: ext };
}

/**
 * Verifies magic byte headers to prevent disguised malware / Trojan polyglots.
 */
export function verifyMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 8) return false;

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47
    );
  }

  // WEBP: RIFF .... WEBP
  if (mimeType === 'image/webp') {
    const isRiff = buffer.slice(0, 4).toString('ascii') === 'RIFF';
    const isWebp = buffer.slice(8, 12).toString('ascii') === 'WEBP';
    return isRiff && isWebp;
  }

  // PDF: %PDF (25 50 44 46)
  if (mimeType === 'application/pdf') {
    return buffer.slice(0, 4).toString('ascii') === '%PDF';
  }

  // DOCX / ZIP: PK.. (50 4B 03 04)
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  }

  // DOC (legacy compound binary): D0 CF 11 E0
  if (mimeType === 'application/msword') {
    return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
  }

  return true;
}

// ==========================================
// 1. MEMORY STORAGE (AI Processing & Cloudinary)
// ==========================================
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB strict limit
    files: 1, // Only 1 file per upload request to prevent zip bomb/DoS
  },
  fileFilter: (req, file, cb) => {
    const check = validateSafeFileName(file.originalname, new Set([...ALLOWED_IMAGE_EXTS, '.pdf']));
    if (!check.valid) {
      return cb(new Error(check.reason), false);
    }

    if (ALLOWED_IMAGE_MIMES.has(file.mimetype) || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Invalid MIME type: ${file.mimetype}. Only JPEG, PNG, WEBP, and PDF files are allowed.`), false);
    }
  }
});

// ==========================================
// 2. DISK STORAGE (Ephemeral Isolated Temp Storage)
// ==========================================
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = path.join(os.tmpdir(), file.fieldname === 'resume' ? 'biosync_resumes' : 'biosync_reports');
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Generate cryptographically random filename with sanitized extension to prevent path traversal
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}_${crypto.randomBytes(12).toString('hex')}${ext}`;
    cb(null, safeName);
  }
});

export const diskUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB Limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const check = validateSafeFileName(file.originalname, ALLOWED_DOC_EXTS);
    if (!check.valid) {
      return cb(new Error(check.reason), false);
    }

    if (ALLOWED_DOC_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid document type. Only PDF and Word documents are permitted.'), false);
    }
  }
});