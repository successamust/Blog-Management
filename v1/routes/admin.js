import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/promote/:userId', adminController.promoteToAdmin);
router.post('/demote/:userId', adminController.demoteFromAdmin);

export default router;