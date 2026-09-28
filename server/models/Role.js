import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  permissions: {
    dashboard: { type: Boolean, default: false },
    users: { type: Boolean, default: false },
    roles: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    settings: { type: Boolean, default: false }
  },
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Role', roleSchema);
