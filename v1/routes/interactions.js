import express from 'express';
import * as interactionController from '../controllers/interactionController.js';
import { authenticate } from '../middleware/protect.js';

const router = express.Router();

// @route   POST /api/posts/:postId/like
// @desc    Like or unlike a post
// @access  Private
router.post('/:postId/like', authenticate, interactionController.likePost);

// @route   POST /api/posts/:postId/dislike
// @desc    Dislike or undislike a post
// @access  Private
router.post('/:postId/dislike', authenticate, interactionController.dislikePost);

// @route   POST /api/posts/:postId/share
// @desc    Share a post
// @access  Public
router.post('/:postId/share', interactionController.sharePost);

// @route   GET /api/posts/:postId/interactions
// @desc    Get post interactions
// @access  Public
router.get('/:postId/interactions', interactionController.getPostInteractions);

// @route   GET /api/users/me/likes
// @desc    Get user's liked posts
// @access  Private
router.get('/me/likes', authenticate, interactionController.getUserLikedPosts);

export default router;