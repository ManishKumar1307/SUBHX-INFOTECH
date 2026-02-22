// Load environment variables FIRST
require('dotenv').config({ path: './.env' });

console.log('\n Starting server...');
console.log('Environment:');
console.log(`   PORT: ${process.env.PORT}`);
console.log(`   MONGODB: ${process.env.MONGODB_URI ? 'CONNECTED' : 'NOT CONNECTED'}`);
console.log(`   REDIS: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT} ${process.env.REDIS_PASSWORD ? '(with password)' : '(no password)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}\n`);

const app = require('./src/app');
const connectDB = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected');

    // Connect to Redis
    try {
      await connectRedis();
    } catch (error) {
      console.log(' Using mock Redis (fallback)');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`\nServer is running!`);
      console.log(`Local: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log(`Auth API: http://localhost:${PORT}/api/auth\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();