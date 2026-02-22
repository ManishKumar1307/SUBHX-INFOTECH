const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const crypto = require('crypto');

class TokenService {
  generateTokens(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      name: user.name
    };

    const accessToken = jwt.sign(
      payload, 
      process.env.JWT_ACCESS_SECRET, 
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
      payload, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );

    const tokenId = crypto.randomBytes(16).toString('hex');

    return { accessToken, refreshToken, tokenId };
  }

  async storeRefreshToken(userId, refreshToken, tokenId) {
    try {
      console.log('📝 Attempting to store refresh token...');
      const redisClient = getRedisClient();
      const key = `refresh:${userId}:${tokenId}`;
      
      console.log('Redis client type:', redisClient?.constructor?.name);
      console.log('Key to store:', key);
      
      if (redisClient) {
        const result = await redisClient.setEx(
          key, 
          7 * 24 * 60 * 60, // 7 days in seconds
          refreshToken
        );
        console.log(`Token stored successfully for user ${userId}`, result);
        
        // Verify it was stored
        const verifyToken = await redisClient.get(key);
        console.log(`🔍 Verification - Token in Redis:`, verifyToken ? 'Present' : 'Missing');
        
        return result;
      } else {
        console.warn('❌ No Redis client available for storing token');
      }
    } catch (error) {
      console.error('❌ Error storing refresh token:', error);
      // Continue even if storage fails - token will still be valid from JWT
    }
  }

  async verifyRefreshToken(userId, tokenId, refreshToken) {
    try {
      const redisClient = getRedisClient();
      
      if (!redisClient) {
        // If no Redis, just verify JWT
        try {
          jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
          return true;
        } catch {
          return false;
        }
      }

      const key = `refresh:${userId}:${tokenId}`;
      const storedToken = await redisClient.get(key);
      
      if (!storedToken || storedToken !== refreshToken) {
        return false;
      }

      try {
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        return true;
      } catch (error) {
        return false;
      }
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      return false;
    }
  }

  async revokeRefreshToken(userId, tokenId) {
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        const key = `refresh:${userId}:${tokenId}`;
        await redisClient.del(key);
      }
    } catch (error) {
      console.error('Error revoking refresh token:', error);
    }
  }

  async revokeAllUserTokens(userId) {
    try {
      const redisClient = getRedisClient();
      if (redisClient) {
        const pattern = `refresh:${userId}:*`;
        const keys = await redisClient.keys(pattern);
        
        if (keys && keys.length > 0) {
          for (const key of keys) {
            await redisClient.del(key);
          }
        }
      }
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
    }
  }

  async blacklistAccessToken(token, expiryTime) {
    try {
      const redisClient = getRedisClient();
      if (redisClient && expiryTime > 0) {
        await redisClient.setEx(
          `blacklist:${token}`,
          expiryTime,
          'blacklisted'
        );
      }
    } catch (error) {
      console.error('Error blacklisting access token:', error);
    }
  }
}

module.exports = new TokenService();