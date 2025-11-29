import Post from '../models/post.js';
import User from '../models/user.js';
import CollaborationInvitation from '../models/collaborationInvitation.js';
import { sendCollaborationInvitation } from '../services/emailService.js';
import mongoose from 'mongoose';

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const inviteCollaborator = async (req, res) => {
  try {
    const { postId } = req.params;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ 
        message: 'Email and role are required' 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    if (!isValidObjectId(postId)) {
      return res.status(400).json({ 
        message: 'Invalid post ID' 
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

    const isAuthor = post.author.toString() === req.user._id.toString();
    if (!req.user.isAdmin() && !isAuthor) {
      return res.status(403).json({ 
        message: 'Only post author or admin can invite collaborators' 
      });
    }

    const invitedUser = await User.findOne({ email: email.toLowerCase() });
    if (!invitedUser) {
      return res.status(400).json({ 
        message: 'Unable to send invitation. Please verify the email address.' 
      });
    }

    const isCollaborator = post.collaborators?.some(
      collab => collab.user.toString() === invitedUser._id.toString()
    );
    if (isCollaborator) {
      return res.status(400).json({ 
        message: 'User is already a collaborator on this post' 
      });
    }

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

    const invitation = new CollaborationInvitation({
      post: postId,
      email: email.toLowerCase(),
      role,
      invitedBy: req.user._id
    });
    await invitation.save();

    try {
      await sendCollaborationInvitation(email, {
        postTitle: post.title,
        inviterName: req.user.username,
        role,
        invitationId: invitation._id
      });
    } catch (emailError) {
      // Email sending failed, but invitation was created
    }

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to send invitation',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(invitationId)) {
      return res.status(400).json({ message: 'Invalid invitation ID' });
    }

    const invitation = await CollaborationInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

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

    const post = await Post.findById(invitation.post);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

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

    if (!post.collaborators) {
      post.collaborators = [];
    }
    post.collaborators.push({
      user: userId,
      role: invitation.role,
      joinedAt: new Date()
    });
    await post.save();

    invitation.status = 'accepted';
    await invitation.save();

    res.json({
      message: 'Invitation accepted successfully',
      post: await Post.findById(post._id).populate('collaborators.user', 'username email')
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to accept invitation',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

export const rejectInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(invitationId)) {
      return res.status(400).json({ message: 'Invalid invitation ID' });
    }

    const invitation = await CollaborationInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

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
    res.status(500).json({ 
      message: 'Failed to reject invitation',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

export const getPostCollaborators = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

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
    res.status(500).json({ 
      message: 'Failed to fetch collaborators',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

export const removeCollaborator = async (req, res) => {
  try {
    const { postId, userId } = req.params;

    if (!isValidObjectId(postId) || !isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid post ID or user ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin();
    const isRemovingSelf = userId === req.user._id.toString();

    if (!isAdmin && !isAuthor && !isRemovingSelf) {
      return res.status(403).json({ 
        message: 'Only post author, admin, or the collaborator themselves can remove collaborators' 
      });
    }

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
    res.status(500).json({ 
      message: 'Failed to remove collaborator',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

export const getUserInvitations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const includeSent = req.query.include === 'sent';
    
    const receivedInvitations = await CollaborationInvitation.find({
      email: user.email.toLowerCase(),
      status: 'pending'
    })
      .populate('post', 'title slug')
      .populate('invitedBy', 'username email')
      .sort({ createdAt: -1 })
      .lean();

    let sentInvitations = [];

    if (includeSent) {
      sentInvitations = await CollaborationInvitation.find({
        invitedBy: req.user._id,
        email: { $ne: user.email.toLowerCase() }
      })
        .populate('post', 'title slug')
        .sort({ createdAt: -1 })
        .lean();
    }

    const allInvitations = [
      ...receivedInvitations.map(inv => ({ ...inv, type: 'received' })),
      ...sentInvitations.map(inv => ({ ...inv, type: 'sent' }))
    ];

    res.json({
      invitations: allInvitations
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch invitations',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

export const getPostInvitations = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isOwner = post.author.toString() === userId.toString();
    const isCollaborator = post.collaborators?.some(
      collab => collab.user.toString() === userId.toString()
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ 
        message: 'You do not have permission to view invitations for this post' 
      });
    }

    const invitations = await CollaborationInvitation.find({ post: postId })
      .populate('post', 'title slug')
      .populate('invitedBy', 'username email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      invitations: invitations.map(inv => ({
        _id: inv._id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        post: inv.post,
        sender: inv.invitedBy,
        invitedBy: inv.invitedBy,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invitations' });
  }
};

export const getSentInvitations = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Only the post owner can view sent invitations' 
      });
    }

    const invitations = await CollaborationInvitation.find({ 
      post: postId,
      invitedBy: userId
    })
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      invitations: invitations.map(inv => ({
        _id: inv._id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        post: inv.post,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sent invitations' });
  }
};

export const getMySentInvitations = async (req, res) => {
  try {
    const userId = req.user._id;

    const invitations = await CollaborationInvitation.find({
      invitedBy: userId
    })
      .populate('post', 'title slug')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      invitations: invitations.map(inv => ({
        _id: inv._id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        post: inv.post,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sent invitations' });
  }
};

export const revokeInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user._id;

    if (!invitationId || !isValidObjectId(invitationId)) {
      return res.status(400).json({ message: 'Invalid invitation ID' });
    }

    const invitation = await CollaborationInvitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (!invitation.invitedBy) {
      return res.status(400).json({ 
        message: 'Invalid invitation: missing sender information' 
      });
    }

    const invitedById = invitation.invitedBy.toString ? invitation.invitedBy.toString() : String(invitation.invitedBy);
    const userIdStr = userId.toString ? userId.toString() : String(userId);

    if (invitedById !== userIdStr) {
      return res.status(403).json({ 
        message: 'Only the sender can revoke an invitation' 
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot revoke invitation that is already ${invitation.status}` 
      });
    }

    invitation.status = 'revoked';
    await invitation.save();

    res.json({
      message: 'Invitation revoked successfully',
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        post: invitation.post,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to revoke invitation',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

