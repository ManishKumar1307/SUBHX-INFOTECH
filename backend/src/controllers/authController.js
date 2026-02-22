const jwt = require('jsonwebtoken'); // IMPORTANT: Add this line
const userService = require('../services/userService');
const tokenService = require('../services/tokenService');
const { logger } = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // Create user
      const user = await userService.createUser({ name, email, password });

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        message: 'User registered successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await userService.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate tokens
      const { accessToken, refreshToken, tokenId } = tokenService.generateTokens(user);

      // Store refresh token
      await tokenService.storeRefreshToken(user._id, refreshToken, tokenId);

      // Update last login
      await userService.updateLastLogin(user._id);

      logger.info(`User logged in: ${email}`);

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Set tokenId in cookie for logout
      res.cookie('tokenId', tokenId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      console.log('Login successful - Cookies set:', {
        refreshToken: refreshToken ? 'set' : 'not set',
        tokenId: tokenId ? 'set' : 'not set'
      });

      res.json({
        message: 'Login successful',
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUser(req, res, next) {
    try {
      const user = await userService.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const tokenId = req.cookies?.tokenId;
      
      console.log('Logout attempt - Headers:', {
        authorization: req.headers['authorization'] ? 'present' : 'missing'
      });
      console.log('Logout attempt - Cookies:', { 
        refreshToken: refreshToken ? 'present' : 'missing', 
        tokenId: tokenId ? 'present' : 'missing' 
      });
      console.log('Logout attempt - User:', req.user ? req.user.userId : 'not authenticated');
      
      if (refreshToken && tokenId && req.user) {
        // Revoke refresh token
        await tokenService.revokeRefreshToken(req.user.userId, tokenId);
        console.log(`Refresh token revoked for user ${req.user.userId}`);

        // Blacklist access token
        const authHeader = req.headers['authorization'];
        const accessToken = authHeader && authHeader.split(' ')[1];
        
        if (accessToken) {
          try {
            // Get token expiry from JWT
            const decoded = jwt.decode(accessToken);
            if (decoded && decoded.exp) {
              const expiryTime = decoded.exp - Math.floor(Date.now() / 1000);
              if (expiryTime > 0) {
                await tokenService.blacklistAccessToken(accessToken, expiryTime);
                console.log('Access token blacklisted');
              }
            }
          } catch (decodeError) {
            console.log(' Error decoding token:', decodeError.message);
          }
        }
      } else {
        console.log(' Missing data for logout:', {
          hasRefreshToken: !!refreshToken,
          hasTokenId: !!tokenId,
          hasUser: !!req.user
        });
      }

      // Clear cookies
      res.clearCookie('refreshToken');
      res.clearCookie('tokenId');

      logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('❌ Logout error:', error);
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const tokenId = req.cookies?.tokenId;

      if (!refreshToken || !tokenId) {
        return res.status(401).json({ message: 'Refresh token required' });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Check if token exists in Redis
      const isValid = await tokenService.verifyRefreshToken(
        decoded.userId, 
        tokenId, 
        refreshToken
      );

      if (!isValid) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Generate new tokens
      const user = await userService.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Revoke old refresh token
      await tokenService.revokeRefreshToken(decoded.userId, tokenId);

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken, tokenId: newTokenId } = 
        tokenService.generateTokens(user);

      // Store new refresh token
      await tokenService.storeRefreshToken(user._id, newRefreshToken, newTokenId);

      // Set new cookies
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.cookie('tokenId', newTokenId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({ accessToken });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Refresh token expired' });
      }
      next(error);
    }
  }
}

module.exports = new AuthController();