import express from 'express';
import { body } from 'express-validator';
import * as newsletterController from '../controllers/newsletterController.js';
import { authenticate, authorize, requireAdmin } from '../middleware/protect.js';
import { newsletterLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/subscribe', [
  newsletterLimiter,
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
], newsletterController.subscribe);

router.post('/unsubscribe', [
  newsletterLimiter,
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
], newsletterController.unsubscribe);

router.post('/send', [
  authenticate,
  requireAdmin,
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
], newsletterController.sendNewsletterToSubscribers);

router.post('/notify-new-post/:postId', [
  authenticate,
  requireAdmin
], newsletterController.notifyNewPost);

router.get('/stats', [
  authenticate,
  requireAdmin
], newsletterController.getSubscriberStats);

router.get('/subscribers', [
  authenticate,
  requireAdmin
], newsletterController.getAllSubscribers);

export default router;