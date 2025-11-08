import express from 'express';
import { validateAuthorApplication } from '../middleware/validation.js';
import * as authorController from '../controllers/authorController.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';

const router = express.Router();

// User routes
router.post('/apply', authenticate, validateAuthorApplication, authorController.applyForAuthor);


router.get('/applications', authenticate, requireAdmin, authorController.getAuthorApplications);
router.post('/applications/:applicationId/review', authenticate, requireAdmin, authorController.reviewAuthorApplication);
router.post('/users/:userId/promote', authenticate, requireAdmin, authorController.promoteToAuthor);

export default router;