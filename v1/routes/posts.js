import express from 'express';
import * as postController from '../controllers/postController.js';
import { authenticate, requireAdmin, requireAuthor, requireAuthorOrAdmin, optionalAuthenticate } from '../middleware/protect.js';
import { validatePost } from '../middleware/validation.js';

const router = express.Router();

router.post('/create', authenticate, requireAuthorOrAdmin, validatePost, postController.createPost);

router.put('/update/:id', authenticate, validatePost, postController.updatePost);

router.delete('/delete/:id', authenticate, requireAdmin, postController.deletePost);

// Optional authentication for viewing draft posts - allows authors/admins to see their drafts
router.get('/', optionalAuthenticate, postController.getPosts);
// Optional authentication for viewing draft posts - allows authors/admins to view their own drafts
router.get('/:slug', optionalAuthenticate, postController.getPostBySlug);
router.get('/:postId/related', postController.getRelatedPosts);

export default router;