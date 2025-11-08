import express from 'express';
import { body } from 'express-validator';
import * as commentController from '../controllers/commentController.js';
import { authenticate } from '../middleware/protect.js';

const router = express.Router();

router.get('/:postId/comments', commentController.getPostComments);

router.post('/create/:postId', [
  authenticate,
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters')
], commentController.createComment);

router.put('/update/:commentId', [
  authenticate,
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters')
], commentController.updateComment);

router.delete('/delete/:commentId', authenticate, commentController.deleteComment);
router.post('/like/:commentId', authenticate, commentController.likeComment);

export default router;