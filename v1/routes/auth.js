import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';
import * as passwordController from '../controllers/passwordController.js';
import { validateRegistration, validateLogin, validatePasswordReset } from '../middleware/validation.js';

const router = express.Router();

router.post('/register', validateRegistration, authController.register);

router.post('/login', validateLogin, authController.login);

router.get('/me', authenticate, authController.getMe);
router.get('/allusers', [authenticate, requireAdmin], authController.getAllUsers);
router.get('/stats', [authenticate, requireAdmin], authController.getUserStats);
router.get('/profile/:userId', authController.getUserProfile);

router.put('/update/:userId', authenticate, authController.updateUserProfile);

router.delete('/delete/:userId', authenticate, authController.deleteUser);

router.post('/forgot-password', validatePasswordReset, passwordController.forgotPassword);

router.post('/reset-password', validatePasswordReset, passwordController.resetPassword);

router.post('/change-password', authenticate, validatePasswordReset, passwordController.changePassword);

router.get('/validate-reset-token', passwordController.validateResetToken);
export default router;