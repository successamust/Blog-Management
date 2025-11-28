import express from 'express';
import * as pollController from '../controllers/pollController.js';
import { authenticate, optionalAuthenticate } from '../middleware/protect.js';

const router = express.Router();

router.post('/', authenticate, pollController.createPoll);
router.get('/post/:postId', optionalAuthenticate, pollController.getPollByPost);
router.post('/:pollId/vote', authenticate, pollController.voteOnPoll);
router.get('/:pollId/results', optionalAuthenticate, pollController.getPollResults);

export default router;

