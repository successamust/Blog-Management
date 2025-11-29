import express from 'express';
import * as templateController from '../controllers/templateController.js';
import { authenticate, optionalAuthenticate } from '../middleware/protect.js';

const router = express.Router();

// Get all templates (defaults + user's custom templates)
router.get('/', optionalAuthenticate, templateController.getAllTemplates);

// Initialize default templates (admin only)
router.post('/initialize-defaults', authenticate, templateController.initializeDefaults);

// Use template (increment usage count)
router.post('/:templateId/use', optionalAuthenticate, templateController.useTemplate);

// Get template by ID
router.get('/:templateId', optionalAuthenticate, templateController.getTemplateById);

// Create template (authenticated users only)
router.post('/', authenticate, templateController.createTemplate);

// Update template
router.put('/:templateId', authenticate, templateController.updateTemplate);
router.patch('/:templateId', authenticate, templateController.updateTemplate);

// Delete template
router.delete('/:templateId', authenticate, templateController.deleteTemplate);

export default router;

