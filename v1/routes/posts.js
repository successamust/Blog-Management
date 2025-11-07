import express from 'express';
import { body } from 'express-validator';
import * as postController from '../controllers/postController.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';

const router = express.Router();


// @route   POST /api/posts
// @desc    Create a new post
// @access  Private/Admin
router.post('/create', [
  authenticate,
  requireAdmin,
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required')
], postController.createPost);

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private/Admin
router.put('/update/:id', [
  authenticate,
  requireAdmin,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty')
], postController.updatePost);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private/Admin
router.delete('/delete/:id', [
  authenticate, 
  requireAdmin
], postController.deletePost);


// @route   GET /api/posts
// @desc    Get all published posts
// @access  Public
router.get('/', postController.getPosts);

// @route   GET /api/posts/:slug
// @desc    Get single post by slug
// @access  Public
router.get('/:slug', postController.getPostBySlug);

export default router;