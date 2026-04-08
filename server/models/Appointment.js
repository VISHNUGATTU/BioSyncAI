import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledDate: { type: Date, required: true },
  
  // ✅ UPGRADED: Structured Address Schema
  address: {
    houseNo: { type: String, required: true },
    street: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    phone: { type: String, required: true }
  },

  status: { 
    type: String, 
    enum: ['PENDING', 'ASSISTANT_DISPATCHED', 'SAMPLES_COLLECTED', 'PROCESSING_LABS', 'COMPLETED'],
    default: 'PENDING'
  },
  labResultsRaw: { type: Object } 
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);