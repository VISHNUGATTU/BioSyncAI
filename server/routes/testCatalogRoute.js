import express from 'express';
import { createTest, getTests, updateTest, getAdminTests } from '../controllers/testCatalogController.js';
import { authAdmin } from '../middlewares/authAdmin.js';
import { authUser } from '../middlewares/authUser.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';
import { auditLogger } from '../middlewares/auditMiddleware.js';

const testCatalogRouter = express.Router();

// Users can view available tests to book them
testCatalogRouter.get('/', authUser, getTests);
// Only SuperAdmins can view all tests (including inactive ones) via admin route
testCatalogRouter.get('/admin', authAdmin, authorizeRoles('SuperAdmin'), getAdminTests);

// Only SuperAdmins can create or modify test catalog data
testCatalogRouter.post('/', authAdmin, authorizeRoles('SuperAdmin'), auditLogger('TestCatalog'), createTest);

testCatalogRouter.put('/:id', authAdmin, authorizeRoles('SuperAdmin'), auditLogger('TestCatalog'), updateTest);

export default testCatalogRouter;