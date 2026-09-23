import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
}, { timestamps: true });

export default mongoose.model('Doctor', doctorSchema);
