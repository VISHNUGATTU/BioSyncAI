import mongoose from 'mongoose';

const foodLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  imageUrl: { type: String, required: true },
  recognizedItemName: { type: String, required: true, trim: true },
  barcodeUPC: { type: String, trim: true },
  aiConfidenceScore: { type: Number, min: 0, max: 1 }, // Ensure valid percentage

  mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink'] },
  source: { type: String, enum: ['Home_Cooked', 'Restaurant', 'Packaged_Processed'] },
  moodPostConsumption: { type: String, enum: ['Energetic', 'Sluggish', 'Bloated', 'Normal'] },

  nutrients: {
    calories: { type: Number, min: 0 },
    carbohydrates: { type: Number, min: 0 },
    proteins: { type: Number, min: 0 },
    fats: { type: Number, min: 0 },
    sugar: { type: Number, min: 0 },
    fiber: { type: Number, min: 0 },
    sodium: { type: Number, min: 0 },
    cholesterol: { type: Number, min: 0 }
  },

  consumedQuantity: { type: Number, min: 0.1, default: 1 },
  servingUnit: { type: String, default: 'serving' },
  servingSize: { type: String, trim: true, default: '1 standard portion' },
  isConfirmed: { type: Boolean, default: false },

  candidates: [{
    name: { type: String, trim: true },
    confidence: { type: Number, min: 0, max: 1 }
  }],
  confidenceLevel: { type: String, enum: ['High', 'Medium', 'Low'], default: 'High' },
  userDecision: {
    type: String,
    enum: ['Consume', 'Consume_Smaller_Portion', 'Replace', 'Do_Not_Consume'],
    default: 'Consume'
  },
  disclaimer: {
    type: String,
    default: 'AI-generated estimate, not a medical diagnosis.'
  },

  predictedImpact: {
    glucoseSpike: { type: Number },
    bpSpikeSystolic: { type: Number },
    aiWarningMessage: { type: String },
    aiAlternativeSuggestions: [{ type: String }]
  }
}, { timestamps: true });

// INDEX: Speeds up frontend history rendering
foodLogSchema.index({ user: 1, isConfirmed: 1, createdAt: -1 });

export default mongoose.model('FoodLog', foodLogSchema);