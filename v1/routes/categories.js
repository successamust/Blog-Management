import express from 'express';
import { body } from 'express-validator';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate, requireAdmin } from '../middleware/protect.js';

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/stats', categoryController.getCategoryStats);
router.get('/:slug', categoryController.getCategoryBySlug);
router.get('/:slug/posts', categoryController.getPostsByCategory);

router.post('/create', [
  authenticate,
  requireAdmin,
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name must be less than 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
], categoryController.createCategory);

router.put('/update/:categoryId', [
  authenticate,
  requireAdmin,
  body('name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category name must be less than 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
], categoryController.updateCategory);

router.delete('/delete/:categoryId', [
  authenticate,
  requireAdmin
], categoryController.deleteCategory);

export default router;