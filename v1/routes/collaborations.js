import express from 'express';
import * as collaborationController from '../controllers/collaborationController.js';
import { authenticate } from '../middleware/protect.js';

const router = express.Router();

router.get('/me/invitations', authenticate, collaborationController.getUserInvitations);
router.post('/invitations/:invitationId/accept', authenticate, collaborationController.acceptInvitation);
router.post('/invitations/:invitationId/reject', authenticate, collaborationController.rejectInvitation);
router.post('/:postId/invite', authenticate, collaborationController.inviteCollaborator);
router.get('/:postId/collaborators', collaborationController.getPostCollaborators);
router.delete('/:postId/collaborators/:userId', authenticate, collaborationController.removeCollaborator);

export default router;

