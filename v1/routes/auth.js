import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';
import * as passwordController from '../controllers/passwordController.js';
import { validateRegistration, validateLogin, validatePasswordReset } from '../middleware/validation.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/register', /* authLimiter, */ validateRegistration, authController.register); // RATE LIMITER COMMENTED OUT FOR TESTING

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', /* authLimiter, */ validateLogin, authController.login); // RATE LIMITER COMMENTED OUT FOR TESTING

router.get('/me', authenticate, authController.getMe);
router.get('/allusers', [authenticate, requireAdmin], authController.getAllUsers);
router.get('/stats', [authenticate, requireAdmin], authController.getUserStats);
router.get('/profile/:userId', authController.getUserProfile);

router.put('/update/:userId', authenticate, authController.updateUserProfile);

router.delete('/delete/:userId', authenticate, authController.deleteUser);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', /* passwordResetLimiter, */ validatePasswordReset, passwordController.forgotPassword); // RATE LIMITER COMMENTED OUT FOR TESTING

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', /* passwordResetLimiter, */ validatePasswordReset, passwordController.resetPassword); // RATE LIMITER COMMENTED OUT FOR TESTING

router.post('/change-password', authenticate, validatePasswordReset, passwordController.changePassword);

router.get('/validate-reset-token', passwordController.validateResetToken);
export default router;