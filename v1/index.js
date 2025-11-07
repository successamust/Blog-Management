import express from 'express';
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import newsletterRoutes from './routes/newsletter.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/posts', postsRoutes);
router.use('/newsletter', newsletterRoutes);

export default router;