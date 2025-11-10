import User from '../models/user.js';
import { validationResult } from 'express-validator';

export const applyForAuthor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, bio, expertise, website } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    
    if (user.authorApplication.status === 'pending') {
      return res.status(400).json({
        message: 'You already have a pending author application'
      });
    }

    if (user.role === 'author' || user.role === 'admin') {
      return res.status(400).json({
        message: 'You are already an author'
      });
    }

    user.authorApplication = {
      status: 'pending',
      message,
      submittedAt: new Date()
    };

    if (bio || expertise || website) {
      user.authorProfile = {
        bio,
        expertise: expertise || [],
        website
      };
    }

    await user.save();

    res.json({
      message: 'Author application submitted successfully. It will be reviewed by our team.',
      application: user.authorApplication
    });
  } catch (error) {
    console.error('Apply for author error:', error);
    res.status(500).json({
      message: 'Failed to submit author application'
    });
  }
};

export const getAuthorApplications = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    const applications = await User.find({
      'authorApplication.status': status
    })
      .select('username email authorApplication authorProfile createdAt')
      .sort({ 'authorApplication.submittedAt': 1 });

    res.json({
      applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Get author applications error:', error);
    res.status(500).json({
      message: 'Failed to fetch author applications'
    });
  }
};

export const reviewAuthorApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, feedback } = req.body;
    const adminId = req.user._id;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    const user = await User.findById(applicationId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (user.authorApplication.status !== 'pending') {
      return res.status(400).json({
        message: 'Application has already been reviewed'
      });
    }

    user.authorApplication.status = status;
    user.authorApplication.reviewedAt = new Date();
    user.authorApplication.reviewedBy = adminId;
    
    
    if (feedback) {
      user.authorApplication.message = user.authorApplication.message 
        ? `${user.authorApplication.message}\n\nAdmin Feedback: ${feedback}`
        : `Admin Feedback: ${feedback}`;
    }

    if (status === 'approved') {
      user.role = 'author';
      user.isVerifiedAuthor = true;
    }

    await user.save();

    res.json({
      message: `Application ${status} successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        authorApplication: user.authorApplication
      }
    });
  } catch (error) {
    console.error('Review author application error:', error);
    res.status(500).json({
      message: 'Failed to review author application',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

export const promoteToAuthor = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    if (user.role === 'author') {
      return res.status(400).json({ 
        message: 'User is already an author' 
      });
    }

    user.role = 'author';
    user.isVerifiedAuthor = true;
    user.authorApplication = {
      status: 'approved',
      submittedAt: new Date(),
      reviewedAt: new Date(),
      reviewedBy: req.user._id
    };

    await user.save();

    res.json({
      message: 'User promoted to author successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Promote to author error:', error);
    res.status(500).json({ 
      message: 'Failed to promote user to author'
    });
  }
};