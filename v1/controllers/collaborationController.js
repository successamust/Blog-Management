import Post from '../models/post.js';
import User from '../models/user.js';
import CollaborationInvitation from '../models/collaborationInvitation.js';
import { sendCollaborationInvitation } from '../services/emailService.js';

export const inviteCollaborator = async (req, res) => {
  try {
    const { postId } = req.params;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ 
        message: 'Email and role are required' 
      });
    }

    const validRoles = ['co-author', 'editor', 'reviewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is post author or admin
    const isAuthor = post.author.toString() === req.user._id.toString();
    if (!req.user.isAdmin() && !isAuthor) {
      return res.status(403).json({ 
        message: 'Only post author or admin can invite collaborators' 
      });
    }

    // Check if user exists
    const invitedUser = await User.findOne({ email: email.toLowerCase() });
    if (!invitedUser) {
      return res.status(404).json({ 
        message: 'User with this email not found. They must register first.' 
      });
    }

    // Check if already a collaborator
    const isCollaborator = post.collaborators?.some(
      collab => collab.user.toString() === invitedUser._id.toString()
    );
    if (isCollaborator) {
      return res.status(400).json({ 
        message: 'User is already a collaborator on this post' 
      });
    }

    // Check for existing pending invitation
    const existingInvitation = await CollaborationInvitation.findOne({
      post: postId,
      email: email.toLowerCase(),
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({ 
        message: 'Invitation already sent to this email' 
      });
    }

    // Create invitation
    const invitation = new CollaborationInvitation({
      post: postId,
      email: email.toLowerCase(),
      role,
      invitedBy: req.user._id
    });
    await invitation.save();

    // Send email notification
    try {
      await sendCollaborationInvitation(email, {
        postTitle: post.title,
        inviterName: req.user.username,
        role,
        invitationId: invitation._id
      });
    } catch (emailError) {
      console.error('Failed to send collaboration invitation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation
    });
  } catch (error) {
    console.error('Invite collaborator error:', error);
    res.status(500).json({ 
      message: 'Failed to send invitation',
      error: error.message 
    });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    const invitation = await CollaborationInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if invitation is for this user's email
    const user = await User.findById(userId);
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({ 
        message: 'This invitation is not for you' 
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        message: `Invitation is already ${invitation.status}` 
      });
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    // Add collaborator to post
    const post = await Post.findById(invitation.post);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already a collaborator
    const isCollaborator = post.collaborators?.some(
      collab => collab.user.toString() === userId.toString()
    );
    if (isCollaborator) {
      invitation.status = 'accepted';
      await invitation.save();
      return res.json({ 
        message: 'You are already a collaborator',
        post 
      });
    }

    // Add collaborator
    if (!post.collaborators) {
      post.collaborators = [];
    }
    post.collaborators.push({
      user: userId,
      role: invitation.role,
      joinedAt: new Date()
    });
    await post.save();

    // Update invitation
    invitation.status = 'accepted';
    await invitation.save();

    res.json({
      message: 'Invitation accepted successfully',
      post: await Post.findById(post._id).populate('collaborators.user', 'username email')
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ 
      message: 'Failed to accept invitation',
      error: error.message 
    });
  }
};

export const rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    const invitation = await CollaborationInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if invitation is for this user's email
    const user = await User.findById(userId);
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({ 
        message: 'This invitation is not for you' 
      });
    }

    invitation.status = 'rejected';
    await invitation.save();

    res.json({
      message: 'Invitation rejected'
    });
  } catch (error) {
    console.error('Reject invitation error:', error);
    res.status(500).json({ 
      message: 'Failed to reject invitation',
      error: error.message 
    });
  }
};

export const getPostCollaborators = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('author', 'username email profilePicture')
      .populate('collaborators.user', 'username email profilePicture')
      .select('author collaborators');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      author: post.author,
      collaborators: post.collaborators || []
    });
  } catch (error) {
    console.error('Get post collaborators error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch collaborators',
      error: error.message 
    });
  }
};

export const removeCollaborator = async (req, res) => {
  try {
    const { postId, userId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check permissions
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin();
    const isRemovingSelf = userId === req.user._id.toString();

    if (!isAdmin && !isAuthor && !isRemovingSelf) {
      return res.status(403).json({ 
        message: 'Only post author, admin, or the collaborator themselves can remove collaborators' 
      });
    }

    // Remove collaborator
    if (post.collaborators) {
      post.collaborators = post.collaborators.filter(
        collab => collab.user.toString() !== userId
      );
      await post.save();
    }

    res.json({
      message: 'Collaborator removed successfully',
      post
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ 
      message: 'Failed to remove collaborator',
      error: error.message 
    });
  }
};

export const getUserInvitations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const invitations = await CollaborationInvitation.find({
      email: user.email.toLowerCase(),
      status: 'pending'
    })
      .populate('post', 'title slug')
      .populate('invitedBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      invitations
    });
  } catch (error) {
    console.error('Get user invitations error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch invitations',
      error: error.message 
    });
  }
};

