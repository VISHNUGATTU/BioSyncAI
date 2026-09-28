import mongoose from 'mongoose';

const userDraftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  draftType: {
    type: String,
    enum: ['health_setup', 'appointment_booking', 'food_scan', 'pdf_upload', 'profile_edit'],
    required: true,
  },
  step: {
    type: Number,
    default: 1,
    min: 1,
  },
  totalSteps: {
    type: Number,
    default: 1,
    min: 1,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  lastSaved: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

// Ensure a user has at most one active draft per draftType
userDraftSchema.index({ user: 1, draftType: 1 }, { unique: true });

export default mongoose.model('UserDraft', userDraftSchema);
