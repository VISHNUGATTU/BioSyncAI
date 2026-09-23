import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  
  type: {
    type: String,
    enum: ['Announcement', 'Test_Reminder', 'System_Alert', 'Emergency', 'Report_Ready'],
    trim: true
  },
  
  targetAudience: { type: String, enum: ['All', 'Users', 'LabAssistants', 'Doctors', 'Specific'], trim: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId }, 
  
  isRead: { type: Boolean, default: false }
}, { 
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

notificationSchema.index({ targetUserId: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);