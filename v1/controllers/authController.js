import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/user.js';
import { sendUserWelcomeEmail } from '../services/emailService.js';

const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = generateToken(user._id);

    try {
        await sendUserWelcomeEmail({
          username: user.username,
          email: user.email,
          role: user.role
        });
        console.log('✅ User welcome email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send welcome email, but user was created:', emailError.message);
      }

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -__v')
      .populate({
        path: 'likedPosts',
        select: 'title slug excerpt publishedAt',
        match: { isPublished: true }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found'       });
    }

    const userPosts = await Post.find({ author: req.params.userId, isPublished: true });
    const postStats = {
      totalPosts: userPosts.length,
      totalLikes: userPosts.reduce((sum, post) => sum + post.likes.length, 0),
      totalViews: userPosts.reduce((sum, post) => sum + (post.viewCount || 0), 0),
      totalShares: userPosts.reduce((sum, post) => sum + (post.shares || 0), 0)
    };

    res.json({
      user,
      statistics: postStats
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user profile',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email } = req.body;
    const userId = req.params.userId;

    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only update your own profile.' 
      });
    }

    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ email }, { username }] }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username or email already exists' 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own account.' 
      });
    }

    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Post.deleteMany({ author: userId });

    res.json({ 
      message: 'User account deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousMonthUsers = await User.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    const growthPercentage = previousMonthUsers > 0 
      ? ((newUsers / previousMonthUsers) * 100).toFixed(1)
      : '0';

    res.json({
      totalUsers,
      adminUsers,
      regularUsers,
      newUsers,
      growthPercentage: `${growthPercentage}%`,
      stats: {
        total: totalUsers,
        admins: adminUsers,
        users: regularUsers,
        recent: newUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user statistics',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const promoteToAdmin = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const targetUser = await User.findById(req.params.userId);
      
      if (!targetUser) {
        return res.status(404).json({ 
          message: 'User not found' 
        });
      }
  
      if (targetUser.role === 'admin') {
        return res.status(400).json({ 
          message: 'User is already an admin' 
        });
      }
  
      targetUser.role = 'admin';
      await targetUser.save();
  
      res.json({
        message: 'User promoted to admin successfully',
        user: {
          id: targetUser._id,
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role
        }
      });
    } catch (error) {
      console.error('Promote to admin error:', error);
      res.status(500).json({ 
        message: 'Failed to promote user to admin'
      });
    }
  };
  
export const demoteFromAdmin = async (req, res) => {
    try {
      const targetUser = await User.findById(req.params.userId);
      
      if (!targetUser) {
        return res.status(404).json({ 
          message: 'User not found' 
        });
      }
  
      if (targetUser._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ 
          message: 'You cannot demote yourself' 
        });
      }
  
      if (targetUser.role !== 'admin') {
        return res.status(400).json({ 
          message: 'User is not an admin' 
        });
      }
  
      targetUser.role = 'user';
      await targetUser.save();
  
      res.json({
        message: 'User demoted to regular user successfully',
        user: {
          id: targetUser._id,
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role
        }
      });
    } catch (error) {
      console.error('Demote from admin error:', error);
      res.status(500).json({ 
        message: 'Failed to demote user'
      });
    }
  }; 