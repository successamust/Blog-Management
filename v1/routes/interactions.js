import express from 'express';
import * as interactionController from '../controllers/interactionController.js';
import { authenticate } from '../middleware/protect.js';

const router = express.Router();

router.get('/me/likes', authenticate, interactionController.getUserLikedPosts);
router.get('/me/bookmarks', authenticate, interactionController.getUserBookmarkedPosts);
router.post('/:postId/like', authenticate, interactionController.likePost);
router.post('/:postId/dislike', authenticate, interactionController.dislikePost);
router.post('/:postId/share', interactionController.sharePost);
router.post('/:postId/bookmark', authenticate, interactionController.bookmarkPost);
router.get('/:postId/interactions', interactionController.getPostInteractions);


export default router;