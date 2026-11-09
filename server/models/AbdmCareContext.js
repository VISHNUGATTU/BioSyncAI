import mongoose from 'mongoose';

/**
 * ABDM Care Context Model
 * 
 * Compliant with Ayushman Bharat Digital Mission (ABDM) Milestone 2 (M2)
 * Care-Context linking specifications.
 * Tracks clinical encounter units (Diagnostic Reports, Metabolic Twin Vitals, In-Silico Plans)
 * linked to a patient's national ABHA ID.
 */
const abdmCareContextSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  patientAbhaAddress: { 
    type: String, 
    trim: true, 
    index: true 
  },
  patientAbhaNumber: { 
    type: String, 
    trim: true, 
    index: true 
  },
  careContextReference: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    index: true 
  },
  careContextType: { 
    type: String, 
    enum: ['DIAGNOSTIC_REPORT', 'METABOLIC_TWIN_VITALS', 'IN_SILICO_MEAL_PLAN'],
    required: true,
    index: true
  },
  displayName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  sampleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Sample' 
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FoodOrder' 
  },
  isLinked: { 
    type: Boolean, 
    default: false,
    index: true
  },
  linkToken: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['DISCOVERED', 'OTP_PENDING', 'LINKED', 'DELINKED'], 
    default: 'DISCOVERED',
    index: true
  },
  hipId: { 
    type: String, 
    default: 'IN3610001899' 
  },
  fhirBundleId: { 
    type: String 
  },
  lastSyncTimestamp: { 
    type: Date, 
    default: Date.now 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  }
}, {
  timestamps: true
});

export default mongoose.model('AbdmCareContext', abdmCareContextSchema);

