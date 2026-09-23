import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  appointmentType: { 
    type: String, 
    enum: ['Lab_Collection', 'Doctor_Consultation'], 
    required: true,
    trim: true 
  },
  
  labAssistant: { type: mongoose.Schema.Types.ObjectId, ref: 'LabAssistant' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  
  scheduledDate: { type: Date, required: true },
  timeSlot: { type: String, required: true, trim: true },
  
  status: {
    type: String,
    enum: ['Booked', 'Confirmed', 'Assistant_Assigned', 'On_The_Way', 'Arrived', 'Sample_Collected', 'In_Progress', 'Completed', 'Cancelled', 'No_Show'],
    default: 'Booked',
    trim: true
  },
  
  cancellationReason: { type: String, trim: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  
  address: {
    houseNumber: { type: String, trim: true },
    street: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  collectionOTP: { type: String, trim: true }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

appointmentSchema.index({ user: 1, scheduledDate: -1 });
appointmentSchema.index({ status: 1 });

export default mongoose.model('Appointment', appointmentSchema);