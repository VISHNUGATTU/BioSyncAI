import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
    trim: true
  },
  module: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  stackTrace: { type: String, trim: true },

  endpointCalled: { type: String, trim: true },
  method: { type: String, trim: true },
  executionTimeMs: { type: Number, min: 0 },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: { type: String, trim: true },
  userAgent: { type: String, trim: true },
  osVersion: { type: String, trim: true }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

systemLogSchema.index({ level: 1, createdAt: -1 });

export default mongoose.model('SystemLog', systemLogSchema);