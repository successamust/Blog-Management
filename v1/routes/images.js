import express from 'express';
import * as imageController from '../controllers/imageController.js';
import { uploadImage as uploadMiddleware } from '../utils/imageUpload.js';
import { authenticate, requireAuthorOrAdmin } from '../middleware/protect.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.post('/upload', /* uploadLimiter, */ uploadMiddleware, imageController.uploadImage); // RATE LIMITER COMMENTED OUT FOR TESTING

router.get('/', imageController.getImageInfo);

router.delete('/delete', imageController.deleteImageFromCloudinary);

export default router;