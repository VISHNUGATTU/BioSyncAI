import express from 'express';
import {
  syncWearableTelemetry,
  streamAmbulation,
  getActiveAmbulation
} from '../controllers/wearableController.js';
import { authUser } from '../middlewares/authUser.js';

const wearableRouter = express.Router();

wearableRouter.post('/sync', authUser, syncWearableTelemetry);
wearableRouter.post('/stream-ambulation', authUser, streamAmbulation);
wearableRouter.get('/active-ambulation', authUser, getActiveAmbulation);

export default wearableRouter;

