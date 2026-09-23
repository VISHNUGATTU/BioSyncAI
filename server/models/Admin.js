import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxLength: 100
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    index: true // Speeds up login queries
  },
  password: { 
    type: String, 
    required: true,
    select: false // SECURITY: Never return password by default
  },
  role: { 
    type: String, 
    enum: ['SuperAdmin', 'Support_Staff', 'Data_Analyst'], 
    default: 'SuperAdmin' 
  },
  lastLogin: { 
    type: Date 
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

export default mongoose.model('Admin', adminSchema);