import express from 'express';
import * as interactionController from '../controllers/interactionController.js';
import { authenticate } from '../middleware/protect.js';

const router = express.Router();

router.post('/:postId/like', authenticate, interactionController.likePost);
router.post('/:postId/dislike', authenticate, interactionController.dislikePost);
router.post('/:postId/share', interactionController.sharePost);
router.get('/:postId/interactions', interactionController.getPostInteractions);
router.get('/me/likes', authenticate, interactionController.getUserLikedPosts);

export default router;