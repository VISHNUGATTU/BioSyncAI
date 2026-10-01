import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  
  type: {
    type: String,
    enum: [
      'Appointments', 
      'Health', 
      'Reports', 
      'Report',
      'AI', 
      'Payments', 
      'System', 
      'Announcement', 
      'Test_Reminder', 
      'System_Alert', 
      'Emergency', 
      'Report_Ready',
      'Report_Generated',
      'Dispatch'
    ],
    default: 'System',
    trim: true
  },
  
  targetAudience: { 
    type: String, 
    enum: ['All', 'Users', 'LabAssistants', 'Doctors', 'Specific'], 
    default: 'Specific',
    trim: true 
  },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, index: true }, 
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  isRead: { type: Boolean, default: false }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

notificationSchema.index({ targetUserId: 1, isRead: 1 });
notificationSchema.index({ targetAudience: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);