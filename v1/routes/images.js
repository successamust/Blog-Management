import express from 'express';
import * as imageController from '../controllers/imageController.js';
import { uploadImage as uploadMiddleware } from '../utils/imageUpload.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/upload', uploadMiddleware, imageController.uploadImage);
router.get('/', imageController.getImageInfo);
router.delete('/delete', imageController.deleteImageFromCloudinary);

export default router;