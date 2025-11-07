import express from 'express';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import newsletterRoutes from './routes/newsletter.js';
import adminRoutes from './routes/admin.js';
import interactionsRoutes from './routes/interactions.js';
import commentsRoutes from './routes/comments.js';
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/posts', postsRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/admin', adminRoutes);
router.use('/interactions', interactionsRoutes);
router.use('/comments', commentsRoutes);
export default router;