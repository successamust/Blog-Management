import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/protect.js';

const router = express.Router();

router.use(authenticate);

router.get('/', dashboardController.getUserDashboard);
router.get('/posts', dashboardController.getUserPosts);
router.get('/comments', dashboardController.getUserComments);
router.get('/likes', dashboardController.getUserLikedPosts);
router.get('/history', dashboardController.getReadingHistory);

export default router;