import wearableBridgeService from '../services/wearableBridgeService.js';

export async function syncWearableTelemetry(req, res) {
  try {
    const result = await wearableBridgeService.ingestSmartwatchBatch(req.user._id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function streamAmbulation(req, res) {
  try {
    const { steps = 0 } = req.body;
    const progress = await wearableBridgeService.streamAmbulationSteps(req.user._id, steps);
    res.status(200).json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getActiveAmbulation(req, res) {
  try {
    const progress = await wearableBridgeService.getLiveAmbulationStatus(req.user._id);
    res.status(200).json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

