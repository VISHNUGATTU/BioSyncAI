import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true, trim: true, index: true },
  otp: {
    code: { type: String, select: false }, // SECURITY: Hidden by default
    expiresAt: { type: Date, select: false }
  },

  firstName: { type: String, trim: true, maxLength: 50 },
  lastName: { type: String, trim: true, maxLength: 50 },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer Not to Say'] },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
  profilePicture: { type: String },

  address: {
    houseNumber: String,
    street: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    },
    deliveryInstructions: { type: String, maxLength: 200 }
  },

  lifestyle: {
    dietPreference: { type: String, enum: ['Veg', 'Non-Veg', 'Vegan', 'Keto', 'Paleo', 'Unspecified'], default: 'Unspecified' },
    smokingHabit: { type: String, enum: ['Non-smoker', 'Occasional', 'Regular'], default: 'Non-smoker' },
    alcoholConsumption: { type: String, enum: ['None', 'Occasional', 'Regular'], default: 'None' },
    activityLevel: { type: String, enum: ['Sedentary', 'Lightly Active', 'Active', 'Very Active'], default: 'Sedentary' }
  },

  wearableSync: {
    deviceType: { type: String, enum: ['Smart Watch', 'Smart Ring', 'None'], default: 'None' },
    deviceBrand: { type: String },
    lastSyncTimestamp: { type: Date },
    syncToken: { type: String, select: false } // SECURITY: Hide third-party tokens
  },

  emergencyContact: {
    name: { type: String, trim: true },
    relation: { type: String, trim: true },
    phoneNumber: { type: String, trim: true }
  },

  vitalsStatus: { type: String, enum: ['Pending', 'Manual', 'PDF_Scanned', 'Lab_Verified'], default: 'Pending' },
  accountStatus: { type: String, enum: ['Active', 'Suspended', 'Banned'], default: 'Active', index: true },
  suspensionReason: { type: String, trim: true },
  strikeCount: { type: Number, default: 0, min: 0 },
  fcmToken: { type: String, select: false }, // Only needed for backend push logic
  lastActive: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; delete ret.otp; return ret; } }
});

export default mongoose.model('User', userSchema);