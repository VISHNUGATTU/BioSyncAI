import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // ensures consistent login
    },

    password: {
      type: String,
      required: true,
    },

    accessLevel: {
      type: String,
      enum: ['superadmin', 'moderator', 'analyst'],
      default: 'moderator',
    },

    // 🔒 SECURITY: Disable admin without deleting
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔐 PRE-SAVE HOOK: Hash password
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return ;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 METHOD: Compare password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ EXPORT (ES Modules)
const Admin = mongoose.model('Admin', adminSchema);
export default Admin;