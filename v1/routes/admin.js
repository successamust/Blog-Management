import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate } from '../middleware/protect.js';
import { requireAdmin } from '../middleware/protect.js';

const router = express.Router();

// All routes require admin privileges
router.use(authenticate);
router.use(requireAdmin);

// @route   POST /api/admin/users/:userId/promote
// @desc    Promote user to admin
// @access  Private/Admin
router.post('/promote/:userId', adminController.promoteToAdmin);

// @route   POST /api/admin/users/:userId/demote
// @desc    Demote admin to regular user
// @access  Private/Admin
router.post('/demote/:userId', adminController.demoteFromAdmin);

export default router;