const User = require('../models/User');

class UserService {
  async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      
      // Return user without password
      const userObject = user.toObject();
      delete userObject.password;
      
      return userObject;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  async findByEmail(email) {
    return await User.findOne({ email }).select('+password');
  }

  async findById(userId) {
    return await User.findById(userId).select('-password');
  }

  async updateLastLogin(userId) {
    return await User.findByIdAndUpdate(
      userId, 
      { lastLogin: new Date() },
      { new: true }
    ).select('-password');
  }
}

module.exports = new UserService();