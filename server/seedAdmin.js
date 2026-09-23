
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

// Connect to your MongoDB URI (Ensure your .env has MONGO_URI)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/biosync')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Define the schema exactly as it is in your project
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['SuperAdmin', 'Support_Staff', 'Data_Analyst'], default: 'SuperAdmin' },
  lastLogin: { type: Date }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function seedAdmin() {
  try {
    const email = 'admin@biosyncai.com';
    const plainTextPassword = 'Admin123';

    // 1. Delete the old corrupted admin record if it exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('⚠️ Old Admin found. Deleting record to ensure schema compliance...');
      await Admin.deleteOne({ email });
    }

    // 2. Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainTextPassword, salt);

    // 3. Create the new Admin using the strict schema rules
    await Admin.create({
      name: 'System Admin',
      email: email,
      password: hashedPassword,
      role: 'SuperAdmin' // Perfectly matches your enum
    });

    console.log('✅ SuperAdmin created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${plainTextPassword}`);
    
  } catch (error) {
    console.error('❌ Seeding Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seedAdmin();