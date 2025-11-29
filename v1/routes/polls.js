import express from 'express';
import * as pollController from '../controllers/pollController.js';
import { authenticate, optionalAuthenticate } from '../middleware/protect.js';

const router = express.Router();

// Get all polls (with optional filters)
router.get('/', optionalAuthenticate, pollController.getAllPolls);

// Create poll
router.post('/', authenticate, pollController.createPoll);

// Get poll by post
router.get('/post/:postId', optionalAuthenticate, pollController.getPollByPost);

// Get poll by ID
router.get('/:pollId', optionalAuthenticate, pollController.getPollById);

// Update poll
router.put('/:pollId', authenticate, pollController.updatePoll);
router.patch('/:pollId', authenticate, pollController.updatePoll);

// Delete poll
router.delete('/:pollId', authenticate, pollController.deletePoll);

// Vote on poll
router.post('/:pollId/vote', authenticate, pollController.voteOnPoll);

// Get poll results
router.get('/:pollId/results', optionalAuthenticate, pollController.getPollResults);

// Get poll analytics
router.get('/:pollId/analytics', authenticate, pollController.getPollAnalytics);

// Export poll results
router.get('/:pollId/export', authenticate, pollController.exportPollResults);

export default router;

