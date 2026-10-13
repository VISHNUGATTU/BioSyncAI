import mongoose from 'mongoose';

/**
 * BioSync AI - Downsampled Time-Series IoT Biometric Telemetry Schema
 * 
 * Aggregates 1-Second continuous streams (CGM, PPG, IMU) into 1-minute
 * downsampled analytical rollups for long-term physiological trend modeling,
 * Kalman recalibration, and clinical reporting.
 */
const ioTTelemetrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  deviceId: {
    type: String,
    default: 'biosync-smartwatch-01',
    trim: true,
  },
  bucketStartTime: {
    type: Date,
    required: true,
    index: true,
  },
  bucketEndTime: {
    type: Date,
    required: true,
  },
  sampleCount: {
    type: Number,
    default: 1,
  },

  // Hemodynamic & Cardiac Metrics
  heartRate: {
    min: { type: Number },
    max: { type: Number },
    mean: { type: Number },
  },
  spo2: {
    min: { type: Number },
    max: { type: Number },
    mean: { type: Number },
  },
  bloodPressure: {
    systolicMean: { type: Number },
    diastolicMean: { type: Number },
  },

  // Glycemic Continuous Kinematics (CGM dG/dt)
  glucose: {
    start: { type: Number },
    end: { type: Number },
    min: { type: Number },
    max: { type: Number },
    mean: { type: Number },
    rateOfChangePerMinute: { type: Number }, // dG/dt in mg/dL/min
  },

  // Physical Activity & Thermal State
  skinTemperature: {
    mean: { type: Number },
  },
  stepCount: {
    type: Number,
    default: 0,
  },

  // Anomaly & Quality Metrics
  anomaliesDetected: {
    type: Number,
    default: 0,
  },
  signalQualityIndex: {
    type: Number, // 0 - 100%
    default: 98,
  },
}, {
  timestamps: true,
});

ioTTelemetrySchema.index({ user: 1, bucketStartTime: -1 });

export default mongoose.model('IoTTelemetry', ioTTelemetrySchema);
