import User from '../models/user.js';
import { validationResult } from 'express-validator';

// Promote user to admin
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

    // Promote user
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

// Demote admin to user
export const demoteFromAdmin = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Prevent self-demotion
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

    // Demote user
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