import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true, default: 'Pathology & Laboratory Medicine' },
  email: { type: String, required: true, unique: true, sparse: true },
  phone: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['doctor', 'pathologist'], default: 'doctor' },
  licenseNumber: { type: String, default: 'MCI-DOC-77291' },
  hospitalAffiliation: { type: String, default: 'BioSync Central Diagnostic Laboratory' },
  rating: { type: Number, default: 5.0 },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
  currentLocation: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    address: { type: String, trim: true },
    zone: { type: String, trim: true },
    lastUpdated: { type: Date, default: Date.now }
  },
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; delete ret.password; return ret; } }
});

export default mongoose.model('Doctor', doctorSchema);
