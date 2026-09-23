import mongoose from 'mongoose';

const memberApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  experience: { type: String },
  resumePath: { type: String }, // We will store the path to the saved file
  status: { 
    type: String, 
    enum: ['Pending', 'Reviewed', 'Accepted', 'Rejected'], 
    default: 'Pending' 
  }
}, { timestamps: true });

export default mongoose.model('MemberApplication', memberApplicationSchema);