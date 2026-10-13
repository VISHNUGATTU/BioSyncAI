import TestCatalog from '../models/TestCatalog.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import memoryCache from '../services/cacheService.js';

export const createTest = asyncHandler(async (req, res) => {
  const test = await TestCatalog.create(req.body);
  memoryCache.invalidateTag('testCatalog');
  res.status(201).json({ success: true, data: test });
});

export const getTests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;

  const cacheKey = `tests:active:p${page}:l${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const tests = await TestCatalog.find({ isActive: true })
    .skip(startIndex)
    .limit(limit)
    .lean();
    
  const payload = { success: true, count: tests.length, data: tests, tests };
  memoryCache.set(cacheKey, payload, 600, ['testCatalog']);

  res.status(200).json(payload);
});

export const updateTest = asyncHandler(async (req, res) => {
  const test = await TestCatalog.findByIdAndUpdate(
    req.params.id, 
    { $set: req.body }, 
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  
  memoryCache.invalidateTag('testCatalog');
  res.status(200).json({ success: true, data: test });
});

export const getAdminTests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;

  const tests = await TestCatalog.find({})
    .skip(startIndex)
    .limit(limit)
    .lean();
    
  res.status(200).json({ success: true, count: tests.length, data: tests });
});