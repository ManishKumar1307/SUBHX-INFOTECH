const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisUrl = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    
    console.log(`🔌 Connecting to Redis at ${redisUrl}`);

    const client = redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: false
      }
    });

    client.on('error', (err) => {
      console.log('Redis error:', err.message);
    });

    client.on('connect', () => {
      console.log('Redis socket connected');
    });

    client.on('ready', () => {
      console.log('Redis client ready');
    });

    await client.connect();
    
    // Test connection
    const pong = await client.ping();
    console.log(`Redis ping: ${pong}`);
    
    redisClient = client;
    
    // Verify it's working by setting a test key
    await client.setEx('test:connection', 60, 'working');
    const testValue = await client.get('test:connection');
    console.log(`Redis test write/read: ${testValue}`);
    
    return client;

  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error; // Throw error instead of falling back to mock
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };