import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  labAssistant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabAssistant'
  },

  ticketType: {
    type: String,
    enum: ['Complaint', 'Support', 'Feedback', 'Billing_Issue'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
    trim: true
  },

  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  attachments: [{ type: String, trim: true }],

  status: {
    type: String,
    enum: ['Open', 'In_Progress', 'Resolved', 'Closed'],
    default: 'Open',
    trim: true
  },
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  resolutionNotes: { type: String, trim: true },
  resolvedAt: { type: Date }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

ticketSchema.index({ status: 1, priority: 1 });

export default mongoose.model('Ticket', ticketSchema);