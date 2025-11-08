import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';

const router = express.Router();

router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], authController.login);

router.get('/me', authenticate, authController.getMe);
router.get('/allusers', [authenticate, requireAdmin], authController.getAllUsers);
router.get('/stats', [authenticate, requireAdmin], authController.getUserStats);
router.get('/profile/:userId', authController.getUserProfile);

router.put('update/:userId', [
  authenticate,
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email')
], authController.updateUserProfile);

router.delete('/delete/:userId', authenticate, authController.deleteUser);

export default router;