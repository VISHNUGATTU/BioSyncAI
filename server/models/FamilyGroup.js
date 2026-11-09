import mongoose from 'mongoose';

const familyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // e.g. "Reddy Family Wellness"
  headUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  members: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    nickname: { type: String, trim: true },
    relation: {
      type: String,
      enum: ['Self', 'Grandfather', 'Grandmother', 'Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Sibling', 'Other'],
      required: true
    },
    age: { type: Number, min: 1, max: 120 },
    clinicalConditions: [{
      type: String,
      enum: [
        'Type_2_Diabetes',
        'Type_1_Diabetes',
        'Prediabetes',
        'Hypertension',
        'Dyslipidemia',
        'CKD',
        'PCOS',
        'Fatty_Liver_MASLD',
        'Hypothyroidism',
        'None'
      ]
    }],
    metabolicTargets: {
      maxPostprandialGlucose: { type: Number, default: 140 },
      maxSodiumPerMeal_mg: { type: Number, default: 600 },
      maxCarbsPerMeal_g: { type: Number, default: 50 },
      minProteinPerMeal_g: { type: Number, default: 20 },
      isPotassiumRestricted: { type: Boolean, default: false }
    },
    defaultPortionWeightFraction: { type: Number, default: 0.25, min: 0.05, max: 1.0 }
  }],
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active',
    index: true
  }
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

export default mongoose.model('FamilyGroup', familyGroupSchema);

