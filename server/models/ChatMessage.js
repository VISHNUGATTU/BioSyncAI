import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    biomarkerContext: {
      glucoseFasting: { type: Number },
      glucosePostPrandial: { type: Number },
      hba1c: { type: Number },
      systolic: { type: Number },
      diastolic: { type: Number },
      restingHeartRate: { type: Number },
      hrv: { type: Number },
      oxygenSaturationSpO2: { type: Number },
      cholesterolTotal: { type: Number },
      ldl: { type: Number },
      hdl: { type: Number },
      triglycerides: { type: Number },
      activeConditions: [String],
    },
    suggestedActions: [
      {
        title: { type: String },
        actionType: { type: String, enum: ['NAVIGATE_SCAN', 'NAVIGATE_WEARABLE', 'NAVIGATE_VITALS', 'NAVIGATE_BOOKING', 'INFO'] },
        payload: { type: String },
      },
    ],
    modelUsed: {
      type: String,
      default: 'gemini-2.5-flash',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ user: 1, createdAt: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
