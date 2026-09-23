import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// ==========================================
// 1. MEMORY STORAGE (AI Processing & Cloudinary)
// ==========================================
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB Limit for high-resolution food images & PDF lab results
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF files are allowed.'), false);
    }
  }
});

// ==========================================
// 2. DISK STORAGE (Adapted for Serverless / Ephemeral Cloud)
// ==========================================
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Utilize the OS temporary directory to bypass cloud read-only filesystem restrictions
    const folder = path.join(os.tmpdir(), file.fieldname === 'resume' ? 'resumes' : 'reports');
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Sanitize file name to prevent directory traversal
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${cleanFileName}`);
  }
});

export const diskUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB Limit
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
  }
});