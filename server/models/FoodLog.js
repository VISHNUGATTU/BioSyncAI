import mongoose from 'mongoose';

const foodLogSchema = new mongoose.Schema(
  {
    // 🔗 Link to User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },

    foodName: {
      type: String,
      required: true,
      trim: true,
    },

    // 🍎 RAW DATA (AI input)
    macros: {
      calories: { type: Number },
      carbs: { type: Number },   // important for glucose
      protein: { type: Number },
      fat: { type: Number },
      fiber: { type: Number },   // helps offset carbs
    },

    // 🤖 AI VERDICT (UI output)
    verdict: {
      type: String,
      required: true,
      enum: ['OPTIMAL', 'MODERATE', 'SPIKE'],
    },

    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    estimatedGlucoseImpact: {
      type: Number, // e.g. 15
    },

    mitigationPlan: {
      type: String, // e.g. "Take a 10-minute walk"
    },

    // 👤 USER INTERACTION
    symptomsLogged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ EXPORT (ESM)
const FoodLog = mongoose.model('FoodLog', foodLogSchema);
export default FoodLog;