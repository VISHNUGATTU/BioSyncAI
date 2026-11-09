import { seedMassiveDataset } from './seedMassiveDataset.js';
import mongoose from 'mongoose';

seedMassiveDataset()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\n❌ FATAL SEEDING ERROR:', err);
    if (mongoose.connection) await mongoose.connection.close();
    process.exit(1);
  });
