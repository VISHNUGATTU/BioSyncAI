import express from 'express';
import { scanAndAnalyzeFood, confirmConsumption, getFoodHistory } from '../controllers/foodController.js';
import { authUser } from '../middlewares/authUser.js';
import { memoryUpload } from '../configs/multer.js';

const foodRouter = express.Router();
foodRouter.post('/scan', authUser, memoryUpload.single('foodImage'), scanAndAnalyzeFood);
foodRouter.put('/:id/confirm', authUser, confirmConsumption);
foodRouter.get('/history', authUser, getFoodHistory);
export default foodRouter;