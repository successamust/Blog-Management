import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], authController.login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, authController.getMe);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', [authenticate, requireAdmin], authController.getAllUsers);

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats', [authenticate, requireAdmin], authController.getUserStats);

// @route   GET /api/users/:userId
// @desc    Get user profile
// @access  Public
router.get('/profile/:userId', authController.getUserProfile);

// @route   PUT /api/users/:userId
// @desc    Update user profile
// @access  Private
router.put('update/:userId', [
  authenticate,
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email')
], authController.updateUserProfile);

// @route   DELETE /api/users/:userId
// @desc    Delete user account
// @access  Private
router.delete('/delete/:userId', authenticate, authController.deleteUser);

export default router;