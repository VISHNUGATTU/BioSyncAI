import express from 'express';
import {
  getRestaurants,
  getRestaurantMenu,
  simulateCart,
  createFoodOrder,
  getMyOrders,
  getOrderById,
  getFamilyGroup,
  createOrUpdateFamilyGroup,
  allocateFamilyMeal,
  getKdsOrders,
  updateKdsOrderStatus,
  getClinicalSurveillanceData,
  verifyStationPlating,
  auditStationOil,
} from '../controllers/foodOrderController.js';
import { authUser } from '../middlewares/authUser.js';

const foodOrderRouter = express.Router();

// Restaurant discovery (Public or authenticated)
foodOrderRouter.get('/restaurants', getRestaurants);
foodOrderRouter.get('/restaurants/:id/menu', authUser, getRestaurantMenu);

// In-Silico Cart Simulation & Ordering (Authenticated)
foodOrderRouter.post('/simulate-cart', authUser, simulateCart);
foodOrderRouter.post('/order', authUser, createFoodOrder);
foodOrderRouter.get('/orders/my-orders', authUser, getMyOrders);
foodOrderRouter.get('/orders/:id', authUser, getOrderById);

// Joint Family Wellness Group Allocation
foodOrderRouter.get('/family-group', authUser, getFamilyGroup);
foodOrderRouter.post('/family-group', authUser, createOrUpdateFamilyGroup);
foodOrderRouter.post('/family-group/allocate-meal', authUser, allocateFamilyMeal);

// Kitchen Display System (KDS) & Operations
foodOrderRouter.get('/admin/kds-orders', getKdsOrders);
foodOrderRouter.put('/admin/orders/:id/status', updateKdsOrderStatus);

// Cyber-Physical Hardware Workstation Endpoints
foodOrderRouter.post('/hardware/verify-gravimetric-plating', verifyStationPlating);
foodOrderRouter.post('/hardware/audit-oil-quality', auditStationOil);

// Clinical Nutrition Surveillance & Doctor Auditing
foodOrderRouter.get('/admin/clinical-surveillance', getClinicalSurveillanceData);

export default foodOrderRouter;

