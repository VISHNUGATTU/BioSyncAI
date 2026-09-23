import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50, // Optimal pool size for high-concurrency mobile requests
      minPoolSize: 10, // Keeps hot connections alive
      serverSelectionTimeoutMS: 5000, // Fail fast if DB is unreachable
      socketTimeoutMS: 45000, // Close inactive sockets
      autoIndex: process.env.NODE_ENV !== 'production', // Build indexes in dev only to boost prod perf
    });

    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);

    // Lifecycle monitoring
    mongoose.connection.on('error', (err) => {
      console.error(`[DB] Runtime MongoDB Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected. Attempting reconnection...');
    });

    // Graceful Shutdown
    const gracefulExit = async () => {
      await mongoose.connection.close();
      console.log('[DB] MongoDB connection closed due to app termination');
      process.exit(0);
    };

    process.on('SIGINT', gracefulExit);
    process.on('SIGTERM', gracefulExit);

  } catch (error) {
    console.error(`[DB] Connection Fatal Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;