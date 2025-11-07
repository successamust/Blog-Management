import express from 'express';
import { body } from 'express-validator';
import {
  subscribe,
  unsubscribe,
  sendNewsletterToSubscribers,
  notifyNewPost,
  getSubscriberStats,
  getAllSubscribers
} from '../controllers/newsletterController.js';
import { authenticate, authorize } from '../middleware/protect.js';

const router = express.Router();

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post('/subscribe', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
], subscribe);

// @route   POST /api/newsletter/unsubscribe
// @desc    Unsubscribe from newsletter
// @access  Public
router.post('/unsubscribe', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
], unsubscribe);

// @route   POST /api/newsletter/send
// @desc    Send newsletter to all subscribers
// @access  Private/Admin
router.post('/send', [
  authenticate,
  authorize('admin'),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject must be less than 200 characters'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long')
], sendNewsletterToSubscribers);

// @route   POST /api/newsletter/notify-new-post/:postId
// @desc    Send new post notification to subscribers
// @access  Private/Admin
router.post('/notify-new-post/:postId', [
  authenticate,
  authorize('admin')
], notifyNewPost);

// @route   GET /api/newsletter/stats
// @desc    Get subscriber statistics
// @access  Private/Admin
router.get('/stats', [
  authenticate,
  authorize('admin')
], getSubscriberStats);

// @route   GET /api/newsletter/subscribers
// @desc    Get all subscribers with pagination
// @access  Private/Admin
router.get('/subscribers', [
  authenticate,
  authorize('admin')
], getAllSubscribers);

export default router;