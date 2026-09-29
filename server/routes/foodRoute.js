import express from 'express';
import { 
  scanAndAnalyzeFood, 
  confirmConsumption, 
  getFoodHistory,
  getUnconfirmedScan,
  logDirectMeal
} from '../controllers/foodController.js';
import { authUser } from '../middlewares/authUser.js';
import { memoryUpload } from '../configs/multer.js';

const foodRouter = express.Router();

foodRouter.post('/scan', authUser, memoryUpload.single('foodImage'), scanAndAnalyzeFood);
foodRouter.get('/unconfirmed', authUser, getUnconfirmedScan);
foodRouter.put('/:id/confirm', authUser, confirmConsumption);
foodRouter.get('/history', authUser, getFoodHistory);
foodRouter.post('/log', authUser, logDirectMeal);

export default foodRouter;