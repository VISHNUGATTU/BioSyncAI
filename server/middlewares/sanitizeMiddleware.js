/**
 * BioSync AI - Defensive Security Middleware
 * Module: sanitizeMiddleware.js
 * 
 * Provides defense-in-depth protection against:
 * 1. NoSQL Injection ($gt, $ne, $where, $regex, $or, etc.)
 * 2. Prototype Pollution (__proto__, constructor, prototype)
 * 3. Null Byte Poisoning (\0)
 * 4. Dangerous Object Key Traversals (. notation injection)
 */

const DANGEROUS_PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively cleans an object in-place without reassigning read-only Express 5 getters.
 */
function sanitizeInPlace(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 20) return;

  for (const key of Object.keys(obj)) {
    // 1. Block prototype pollution and NoSQL operators
    if (DANGEROUS_PROTO_KEYS.has(key) || key.startsWith('$') || key.includes('.')) {
      console.warn(`[SecurityAlert] Blocked malicious key: "${key}"`);
      delete obj[key];
      continue;
    }

    const val = obj[key];
    if (typeof val === 'string') {
      obj[key] = val.replace(/\0/g, '').trim();
    } else if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (typeof val[i] === 'string') {
          val[i] = val[i].replace(/\0/g, '').trim();
        } else if (typeof val[i] === 'object' && val[i] !== null) {
          sanitizeInPlace(val[i], depth + 1);
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      sanitizeInPlace(val, depth + 1);
    }
  }
}

/**
 * Express middleware to sanitize body, query parameters, and URL params in-place.
 */
export const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      sanitizeInPlace(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      sanitizeInPlace(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      sanitizeInPlace(req.params);
    }
    next();
  } catch (error) {
    console.error('[SecurityAlert] Sanitization error:', error.message);
    res.status(400).json({
      success: false,
      message: 'Malformed or malicious request payload rejected.'
    });
  }
};

export default sanitizeInput;
