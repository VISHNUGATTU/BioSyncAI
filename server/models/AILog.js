import mongoose from 'mongoose';

const aiLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  interactionType: { 
    type: String, 
    enum: ['Food_Scan', 'Symptom_Analysis', 'Report_Analysis', 'Trajectory_Prediction'],
    index: true 
  },
  
  inputDataSummary: { type: String },
  aiOutputSummary: { type: String }, 
  
  confidenceScore: { type: Number, min: 0, max: 1 },
  status: { 
    type: String, 
    enum: ['Success', 'Failed', 'Flagged_For_Review'],
    index: true
  },
  
  userRating: { type: Number, min: 1, max: 5 } 
}, { timestamps: true });

// INDEX: Speeds up dashboard AI failure analysis
aiLogSchema.index({ status: 1, createdAt: -1 });
aiLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('AILog', aiLogSchema);