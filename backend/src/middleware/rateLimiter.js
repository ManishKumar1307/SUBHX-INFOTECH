const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis');

// Memory store fallback for when Redis is unavailable
const createRateLimiter = (windowMs, maxRequests) => {
  // Try to use Redis store if available
  let store = null;
  
  try {
    const redisClient = getRedisClient();
    if (redisClient) {
      const RedisStore = require('rate-limit-redis');
      store = new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: 'rl:'
      });
      console.log('Using Redis store for rate limiting');
    }
  } catch (error) {
    console.warn('Redis store not available, using memory store:', error.message);
  }

  return rateLimit({
    store: store, // If null, uses default memory store
    windowMs: windowMs || 15 * 60 * 1000, // 15 minutes default
    max: maxRequests || 100, // Limit each IP to 100 requests per windowMs
    message: {
      status: 429,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Stricter limits for auth endpoints
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    status: 429,
    message: 'Too many authentication attempts, please try again later.'
  },
  keyGenerator: (req) => {
    // Use IP as key, but also include email in login attempts to be smarter
    return req.ip;
  }
});

module.exports = { createRateLimiter, authRateLimiter };