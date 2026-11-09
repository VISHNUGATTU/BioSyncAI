import IoTTelemetry from '../models/IoTTelemetry.js';
import FoodOrder from '../models/FoodOrder.js';
import Vitals from '../models/Vitals.js';
import axios from 'axios';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

class WearableBridgeService {
  /**
   * Ingests and downsamples streaming smartwatch telemetry from budget devices (boAt, Noise, Fire-Boltt).
   */
  async ingestSmartwatchBatch(userId, payload) {
    const {
      deviceId = 'biosync-smartwatch-01',
      heartRate,
      spo2 = 98,
      steps = 0,
      ptt_ms,
      glucose,
      skinTempC = 36.5,
      rrIntervals = []
    } = payload;

    const now = new Date();
    const oneMinAgo = new Date(now.getTime() - 60000);

    let estimatedBP = null;
    if (ptt_ms) {
      try {
        const bpRes = await axios.post(`${AI_ENGINE_URL}/api/v1/hemodynamics/estimate-cuffless-bp`, {
          ptt_ms,
          heart_rate_bpm: heartRate || 72,
          baseline_sbp: 120,
          baseline_dbp: 80
        }, { timeout: 2500 });
        estimatedBP = bpRes.data;
      } catch {
        // Analytical Moens-Korteweg fallback
        const pwv = 0.65 / (ptt_ms / 1000.0);
        const sbp = Math.round(100 + (pwv - 6.0) * 12);
        estimatedBP = { estimatedSystolicBP: sbp, estimatedDiastolicBP: Math.round(sbp * 0.66) };
      }
    }

    // Persist downsampled IoT Telemetry bucket
    const telemetryDoc = await IoTTelemetry.create({
      user: userId,
      deviceId,
      bucketStartTime: oneMinAgo,
      bucketEndTime: now,
      sampleCount: 60,
      heartRate: {
        min: heartRate ? heartRate - 3 : 70,
        max: heartRate ? heartRate + 4 : 76,
        mean: heartRate || 72
      },
      spo2: {
        min: spo2 - 1,
        max: spo2,
        mean: spo2
      },
      bloodPressure: {
        systolicMean: estimatedBP?.estimatedSystolicBP || 120,
        diastolicMean: estimatedBP?.estimatedDiastolicBP || 80
      },
      glucose: {
        mean: glucose || 105,
        rateOfChangePerMinute: 0.2
      },
      skinTemperature: {
        mean: skinTempC
      },
      stepCount: steps
    });

    // Check ambulation burn progress if user has active Cheat Mode order
    const ambulationProgress = await this.streamAmbulationSteps(userId, steps);

    return {
      success: true,
      telemetryId: telemetryDoc._id,
      hemodynamics: estimatedBP,
      ambulationProgress
    };
  }

  /**
   * Tracks real-time walking step count against active postprandial ambulation target.
   */
  async streamAmbulationSteps(userId, currentSteps) {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    // Look for active Cheat Mode order in the last 4 hours
    const activeOrder = await FoodOrder.findOne({
      user: userId,
      orderMode: 'CHEAT_MODE_OVERRIDE',
      createdAt: { $gte: fourHoursAgo }
    }).sort({ createdAt: -1 });

    if (!activeOrder || !activeOrder.mitigationPlan) {
      return {
        hasActiveMitigation: false,
        message: 'No active postprandial Cheat Mode order requiring ambulation burn.'
      };
    }

    const targetSteps = activeOrder.mitigationPlan.targetStepsToBurnExcursion || 2500;
    const completedSteps = Math.min(targetSteps, Math.max(0, currentSteps));
    const remainingSteps = Math.max(0, targetSteps - completedSteps);
    const percentComplete = Number(((completedSteps / targetSteps) * 100).toFixed(1));
    const isAchieved = completedSteps >= targetSteps;

    // Burned glucose estimation: ~110 steps burns ~0.38g glucose
    const burnedGrams = Number(((completedSteps / 110.0) * 0.38).toFixed(2));

    return {
      hasActiveMitigation: true,
      orderNumber: activeOrder.orderNumber,
      orderTimestamp: activeOrder.createdAt,
      targetSteps,
      completedSteps,
      remainingSteps,
      percentComplete,
      isMitigationAchieved: isAchieved,
      estimatedBurnedSurplusGlucose_g: burnedGrams,
      statusMessage: isAchieved 
        ? 'Target Achieved! Postprandial glucose spike successfully neutralized via GLUT4 muscular uptake.' 
        : `Keep walking! ${remainingSteps} steps remaining to suppress the forecasted glucose excursion.`
    };
  }

  /**
   * Fetches live ambulation mitigation status.
   */
  async getLiveAmbulationStatus(userId) {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const activeOrder = await FoodOrder.findOne({
      user: userId,
      orderMode: 'CHEAT_MODE_OVERRIDE',
      createdAt: { $gte: fourHoursAgo }
    }).sort({ createdAt: -1 });

    if (!activeOrder) {
      return { hasActiveOrder: false };
    }

    // Get latest step count from IoT Telemetry
    const latestTelemetry = await IoTTelemetry.findOne({ user: userId }).sort({ bucketStartTime: -1 });
    const currentSteps = latestTelemetry?.stepCount || 850;

    return this.streamAmbulationSteps(userId, currentSteps);
  }
}

import { ayurPharmaScreen } from './ayurPharmaService.js';

export { ayurPharmaScreen };
export const wearableBridgeService = new WearableBridgeService();
export default wearableBridgeService;

