import express from 'express';
import { body } from 'express-validator';
import * as commentController from '../controllers/commentController.js';
import { authenticate } from '../middleware/protect.js';

const router = express.Router();

// @route   GET /api/posts/:postId/comments
// @desc    Get comments for a post
// @access  Public
router.get('/:postId/comments', commentController.getPostComments);

// @route   POST /api/posts/:postId/comments
// @desc    Create a new comment
// @access  Private
router.post('/create/:postId', [
  authenticate,
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters')
], commentController.createComment);

// @route   PUT /api/comments/:commentId
// @desc    Update a comment
// @access  Private
router.put('/update/:commentId', [
  authenticate,
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters')
], commentController.updateComment);

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/delete/:commentId', authenticate, commentController.deleteComment);

// @route   POST /api/comments/:commentId/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/like/:commentId', authenticate, commentController.likeComment);

export default router;