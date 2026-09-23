import TestCatalog from '../models/TestCatalog.js';
import asyncHandler from '../middlewares/asyncHandler.js';

export const createTest = asyncHandler(async (req, res) => {
  const test = await TestCatalog.create(req.body);
  res.status(201).json({ success: true, data: test });
});

export const getTests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;

  const tests = await TestCatalog.find({ isActive: true })
    .skip(startIndex)
    .limit(limit)
    .lean();
    
  res.status(200).json({ success: true, count: tests.length, data: tests });
});

export const updateTest = asyncHandler(async (req, res) => {
  const test = await TestCatalog.findByIdAndUpdate(
    req.params.id, 
    { $set: req.body }, 
    { new: true, runValidators: true }
  ).lean();

  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  
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