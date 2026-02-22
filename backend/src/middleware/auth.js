const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Check if token is blacklisted
    const redisClient = getRedisClient();
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token has been revoked' });
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Access token expired' });
        }
        return res.status(403).json({ message: 'Invalid token' });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticateToken };