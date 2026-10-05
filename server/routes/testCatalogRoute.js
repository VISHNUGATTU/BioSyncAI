import express from 'express';
import { createTest, getTests, updateTest, getAdminTests } from '../controllers/testCatalogController.js';
import { authAdmin } from '../middlewares/authAdmin.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';
import { auditLogger } from '../middlewares/auditMiddleware.js';

const testCatalogRouter = express.Router();

// Available tests catalog (public read for patients and booking)
testCatalogRouter.get('/', getTests);

// Admin portal tests view (accessible to all authenticated administrative staff)
testCatalogRouter.get(
  '/admin',
  authAdmin,
  getAdminTests
);

// Admin test creation & modification (SuperAdmin, Operations_Manager, Admin)
testCatalogRouter.post(
  '/',
  authAdmin,
  authorizeRoles('SuperAdmin', 'Operations_Manager', 'Admin'),
  auditLogger('TestCatalog'),
  createTest
);

testCatalogRouter.put(
  '/:id',
  authAdmin,
  authorizeRoles('SuperAdmin', 'Operations_Manager', 'Admin'),
  auditLogger('TestCatalog'),
  updateTest
);

export default testCatalogRouter;