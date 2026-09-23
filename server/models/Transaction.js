import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR', trim: true },
  
  status: {
    type: String,
    enum: ['Pending', 'Success', 'Failed', 'Refunded'],
    default: 'Pending',
    trim: true
  },
  
  paymentGateway: { type: String, trim: true },
  gatewayTransactionId: { type: String, unique: true, sparse: true, trim: true },
  
  revenueType: {
    type: String,
    enum: ['Lab_Test', 'Consultation', 'Subscription'],
    trim: true
  }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

transactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);