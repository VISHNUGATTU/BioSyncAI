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
      'Delivered',
      'Rejected',
      'Failed'
    ],
    default: 'Requested',
    trim: true
  },
  
  rejectionReason: { type: String, trim: true },
  rejectionNotes: { type: String, trim: true },
  rejectionType: { type: String, trim: true },
  exceptionReportedAt: { type: Date },
  
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
  doctorLicense: { type: String, trim: true },

  // Critical Panic Breaches & Dual-Signoff Escalation
  isCriticalPanic: { type: Boolean, default: false },
  criticalAnomalies: [{
    biomarker: { type: String },
    value: { type: Number },
    panicThreshold: { type: String },
    severity: { type: String, enum: ['WARNING', 'PANIC_CRITICAL', 'EMERGENCY_STAT'], default: 'PANIC_CRITICAL' },
    flaggedAt: { type: Date, default: Date.now }
  }],
  requiresDualSignoff: { type: Boolean, default: false },
  secondaryDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  secondaryVerifiedBy: { type: String, trim: true },
  secondaryVerifiedAt: { type: Date },
  secondaryDoctorLicense: { type: String, trim: true },
  secondaryDoctorRemarks: { type: String, trim: true },

  // Cyber-Physical Chain-of-Custody Cryptographic Hash Ledger (Patent Claim 5)
  custodyLedger: [{
    index: { type: Number, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    milestone: { 
      type: String, 
      enum: [
        'CUSTODY_INITIALIZED',
        'PHLEBOTOMIST_ASSIGNED',
        'PATIENT_OTP_VERIFIED',
        'SPECIMEN_COLLECTED',
        'COLD_CHAIN_DEPARTURE',
        'COLD_CHAIN_CHECKPOINT',
        'CENTRAL_LAB_RECEIVED',
        'ANALYZER_INDUCTION',
        'CRITICAL_ANOMALY_ESCALATION',
        'PATHOLOGIST_INITIAL_REVIEW',
        'DUAL_PATHOLOGIST_AUTHORIZED',
        'REPORT_RELEASED'
      ],
      required: true
    },
    actorId: { type: String },
    actorRole: { type: String },
    barcode: { type: String },
    gpsCoordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    temperatureCelsius: { type: Number },
    coldChainCompliant: { type: Boolean, default: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    previousHash: { type: String, required: true },
    blockHash: { type: String, required: true }
  }]
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

sampleSchema.index({ labAssistant: 1, status: 1 });
sampleSchema.index({ doctor: 1, status: 1 });

export default mongoose.model('Sample', sampleSchema);