import mongoose from 'mongoose';

const labAssistantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },

  employeeId: { type: String, unique: true, sparse: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup: { type: String },
  backgroundVerified: { type: Boolean, default: false },
  drivingLicense: { type: String },
  vehicleType: {
    type: String,
    enum: ['Two-Wheeler', 'Four-Wheeler', 'None']
  },
  vehicleNumber: { type: String, trim: true, uppercase: true },

  assignedZones: [{ type: String, index: true }],
  status: {
    type: String,
    enum: ['Available', 'On_Route', 'Collecting', 'Off_Duty'],
    default: 'Off_Duty',
    index: true
  },
  shiftTiming: {
    start: String,
    end: String
  },

  currentLocation: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    heading: { type: Number, min: 0, max: 360 },
    lastUpdated: { type: Date }
  },

  inventory: {
    bloodCollectionTubes: { type: Number, default: 0, min: 0 },
    urineContainers: { type: Number, default: 0, min: 0 },
    icePacks: { type: Number, default: 0, min: 0 }
  },

  performance: {
    totalCollectionsCompleted: { type: Number, default: 0, min: 0 },
    cancelledAppointments: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 5.0, min: 1.0, max: 5.0 },
    reviews: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      date: { type: Date, default: Date.now }
    }]
  }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; delete ret.password; return ret; } }
});

// INDEX: Speeds up finding available assistants in a specific zone
labAssistantSchema.index({ status: 1, assignedZones: 1 });

export default mongoose.model('LabAssistant', labAssistantSchema);