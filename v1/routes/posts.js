import express from 'express';
import { body } from 'express-validator';
import * as postController from '../controllers/postController.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';

const router = express.Router();

router.post('/create', [
  authenticate,
  requireAdmin,
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required')
], postController.createPost);

router.put('/update/:id', [
  authenticate,
  requireAdmin,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty')
], postController.updatePost);

router.delete('/delete/:id', [
  authenticate, 
  requireAdmin
], postController.deletePost);

router.get('/', postController.getPosts);
router.get('/:slug', postController.getPostBySlug);
router.get('/:postId/related', postController.getRelatedPosts);

export default router;