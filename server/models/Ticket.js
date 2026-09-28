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
    enum: [
      'Appointment',
      'Payment',
      'Lab_Assistant',
      'Food_Analysis',
      'AI_Issue',
      'Login_OTP',
      'PDF_Upload',
      'Technical_Issue',
      'Account',
      'Complaint',
      'Support',
      'Feedback',
      'Billing_Issue',
      'Other'
    ],
    default: 'Support',
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
    enum: ['Open', 'In_Progress', 'Resolved', 'Escalated', 'Reopened', 'Closed'],
    default: 'Open',
    trim: true
  },

  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId },
    senderRole: { 
      type: String, 
      enum: ['User', 'LabAssistant', 'Admin', 'Support_Staff', 'SuperAdmin', 'System'], 
      default: 'User' 
    },
    senderName: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],

  resolutionNotes: [{
    note: { type: String, trim: true },
    addedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],

  resolvedAt: { type: Date }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

ticketSchema.index({ user: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1 });

export default mongoose.model('Ticket', ticketSchema);