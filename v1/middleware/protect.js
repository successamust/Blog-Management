import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied: insufficient permissions' 
      });
    }
    next();
  };
};

export const requireAdmin = async (req, res, next) => {
    try {
      const currentUser = await User.findById(req.user._id);
      
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({
          message: 'Admin privileges required'
        });
      }
  
      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      res.status(500).json({
        message: 'Server error during admin verification'
      });
    }
  };