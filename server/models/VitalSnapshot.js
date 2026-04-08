import mongoose from 'mongoose';

const vitalSnapshotSchema = new mongoose.Schema(
  {
    // 🔗 Link to User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },

    // 🧬 Core Biological Metrics
    glucoseLevel: {
      type: Number,
      required: true, // e.g., 98 mg/dL
    },

    metabolicState: {
      type: String,
      enum: ['Resting', 'Active', 'Elevated', 'Fat-Burning'],
      default: 'Resting',
    },

    weight: {
      type: Number, // track weight over time
    },

    // 🧠 Context for AI
    notes: {
      type: String,
      trim: true, // e.g., "Feeling dizzy"
    },
  },
  { timestamps: true } // auto adds createdAt, updatedAt
);

// ⚡ OPTIONAL (Highly Recommended for analytics)
vitalSnapshotSchema.index({ user: 1, createdAt: -1 });

// ✅ EXPORT (ES Modules)
const VitalSnapshot = mongoose.model('VitalSnapshot', vitalSnapshotSchema);
export default VitalSnapshot;