import mongoose from 'mongoose';

const sampleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  testCatalog: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCatalog', required: true },
  labAssistant: { type: mongoose.Schema.Types.ObjectId, ref: 'LabAssistant' },

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
  
  turnaroundTimeHours: { type: Number, min: 0 },
  resultPdfUrl: { type: String, trim: true },
  evidenceImageUrl: { type: String, trim: true }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

sampleSchema.index({ labAssistant: 1, status: 1 });

export default mongoose.model('Sample', sampleSchema);