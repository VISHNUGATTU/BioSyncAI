import mongoose from 'mongoose';

const testCatalogSchema = new mongoose.Schema({
  testName: { type: String, required: true, unique: true, trim: true },
  testCode: { type: String, required: true, unique: true, trim: true }, 
  category: { type: String, required: true, trim: true },
  
  pricing: {
    basePrice: { type: Number, required: true, min: 0 },
    taxPercentage: { type: Number, default: 0, min: 0 }
  },

  sampleType: { 
    type: String, 
    enum: ['Blood', 'Urine', 'Saliva', 'Stool', 'Swab'], 
    required: true,
    trim: true 
  },
  preparationInstructions: { type: String, default: 'No special preparation required.', trim: true },
  fastingRequired: { type: Boolean, default: false },
  
  referenceRanges: [{
    biomarker: { type: String, trim: true },
    unit: { type: String, trim: true },
    minNormal: Number,
    maxNormal: Number,
    genderSpecific: { type: String, enum: ['Male', 'Female', 'All'], default: 'All' }
  }],
  
  reportTemplateId: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

export default mongoose.model('TestCatalog', testCatalogSchema);