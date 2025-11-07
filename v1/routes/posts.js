import express from 'express';
import { body } from 'express-validator';
import { 
  getPosts, 
  getPostBySlug, 
  createPost, 
  updatePost, 
  deletePost 
} from '../controllers/postController.js';
import { authenticate, authorize } from '../middleware/protect.js';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all published posts
// @access  Public
router.get('/', getPosts);

// @route   GET /api/posts/:slug
// @desc    Get single post by slug
// @access  Public
router.get('/:slug', getPostBySlug);

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private/Admin
router.post('/', [
  authenticate,
  authorize('admin'),
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required')
], createPost);

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private/Admin
router.put('/:id', [
  authenticate,
  authorize('admin'),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty')
], updatePost);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private/Admin
router.delete('/:id', [
  authenticate, 
  authorize('admin')
], deletePost);

export default router;