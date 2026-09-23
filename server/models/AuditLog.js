import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actorModel: { type: String, enum: ['Admin', 'Doctor', 'LabAssistant', 'User', 'System'], required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  action: { 
    type: String, 
    enum: ['Viewed', 'Updated', 'Created', 'Deleted', 'Assigned', 'Status_Change'], 
    required: true 
  },
  
  targetModel: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  details: { type: String },
  ipAddress: { type: String }
}, { timestamps: true });

// INDEX: Allows admins to instantly pull the history of a specific document (e.g., a specific Sample)
auditLogSchema.index({ targetModel: 1, targetId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);