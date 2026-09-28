import mongoose from 'mongoose';

const sampleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  testCatalog: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCatalog' },
  labAssistant: { type: mongoose.Schema.Types.ObjectId, ref: 'LabAssistant' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },

  barcode: { type: String, unique: true, sparse: true, trim: true },
  
  status: {
    type: String,
    enum: [
      'Requested', 
      'Assigned', 
      'Sample_Collected', 
      'At_Laboratory', 
      'Processing', 
      'Report_Generated', 
      'Delivered'
    ],
    default: 'Requested',
    trim: true
  },
  
  collectionTime: { type: Date },
  labProcessingStartTime: { type: Date },
  reportGenerationTime: { type: Date },
  
  resultsDone: { type: Boolean, default: false },
  resultsStatus: { 
    type: String, 
    enum: ['Res yet to be obtained', 'Results Ready', 'Results Entered'],
    default: 'Res yet to be obtained' 
  },
  
  turnaroundTimeHours: { type: Number, min: 0 },
  resultPdfUrl: { type: String, trim: true },
  evidenceImageUrl: { type: String, trim: true },
  specimens: {
    blood: { collected: { type: Boolean, default: false }, barcode: String, photoUrl: String },
    urine: { collected: { type: Boolean, default: false }, barcode: String, photoUrl: String },
    stool: { collected: { type: Boolean, default: false }, barcode: String, photoUrl: String }
  },
  structuredResults: [{
    biomarker: { type: String },
    value: { type: Number },
    isCritical: { type: Boolean, default: false }
  }],
  testResults: [{
    name: { type: String },
    value: { type: String },
    unit: { type: String },
    referenceRange: { type: String },
    status: { type: String }
  }],
  doctorRemarks: { type: String, trim: true },
  verifiedBy: { type: String, trim: true },
  verifiedAt: { type: Date },
  doctorLicense: { type: String, trim: true }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

sampleSchema.index({ labAssistant: 1, status: 1 });
sampleSchema.index({ doctor: 1, status: 1 });

export default mongoose.model('Sample', sampleSchema);