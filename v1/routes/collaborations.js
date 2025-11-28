import express from 'express';
import * as collaborationController from '../controllers/collaborationController.js';
import { authenticate } from '../middleware/protect.js';

const router = express.Router();

router.get('/me/invitations', authenticate, collaborationController.getUserInvitations);
router.get('/me/invitations/sent', authenticate, collaborationController.getMySentInvitations);
router.post('/invitations/:invitationId/accept', authenticate, collaborationController.acceptInvitation);
router.post('/invitations/:invitationId/reject', authenticate, collaborationController.rejectInvitation);
router.post('/invitations/:invitationId/revoke', authenticate, collaborationController.revokeInvitation);
router.post('/:postId/invite', authenticate, collaborationController.inviteCollaborator);
router.get('/:postId/collaborators', collaborationController.getPostCollaborators);
router.get('/:postId/invitations', authenticate, collaborationController.getPostInvitations);
router.get('/:postId/invitations/sent', authenticate, collaborationController.getSentInvitations);
router.delete('/:postId/collaborators/:userId', authenticate, collaborationController.removeCollaborator);

export default router;

