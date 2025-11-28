import { validationResult } from 'express-validator';
import Subscriber from '../models/subscriber.js';
import Post from '../models/post.js';
import { sendNewsletter, sendWelcomeEmail, sendNewPostNotification } from '../services/emailService.js';

export const subscribe = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({ message: 'This email is already subscribed to our newsletter' });
      } else {
        existingSubscriber.isActive = true;
        existingSubscriber.subscriptionDate = new Date();
        await existingSubscriber.save();
        
        try {
          await sendWelcomeEmail(email);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
        
        return res.json({ 
          message: 'Subscription reactivated successfully! Welcome back!' 
        });
      }
    }

    const subscriber = new Subscriber({ email });
    await subscriber.save();
    
    try {
      await sendWelcomeEmail(email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({ 
      message: 'Successfully subscribed to our newsletter! Check your email for a welcome message.' 
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }
    
    res.status(500).json({ 
      message: 'Failed to subscribe. Please try again later.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.query;

    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      return res.status(400).json({ message: 'Email not found in our subscription list' });
    }

    if (!subscriber.isActive) {
      return res.status(400).json({ message: 'This email is already unsubscribed' });
    }

    subscriber.isActive = false;
    await subscriber.save();

    res.json({ 
      message: 'Successfully unsubscribed from our newsletter. Sorry to see you go!' 
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ 
      message: 'Failed to unsubscribe. Please try again later.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const sendNewsletterToSubscribers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ 
        message: 'Both subject and content are required' 
      });
    }

    const subscribers = await Subscriber.find({ isActive: true });
    
    if (subscribers.length === 0) {
      return res.status(400).json({ 
        message: 'No active subscribers found' 
      });
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers...`);

    const result = await sendNewsletter(subscribers, subject, content);

    res.json({
      message: 'Newsletter sent successfully!',
      stats: {
        totalSubscribers: subscribers.length,
        successful: result.successful,
        failed: result.failed,
        successRate: `${((result.successful / subscribers.length) * 100).toFixed(1)}%`
      },
      details: process.env.NODE_ENV === 'production' ? undefined : result.results
    });
  } catch (error) {
    console.error('Send newsletter error:', error);
    res.status(500).json({ 
      message: 'Failed to send newsletter. Please try again later.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const notifyNewPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate('author', 'username profilePicture');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.isPublished) {
      return res.status(400).json({ 
        message: 'Cannot send notifications for unpublished posts' 
      });
    }

    const subscribers = await Subscriber.find({ isActive: true });
    
    if (subscribers.length === 0) {
      return res.status(400).json({ 
        message: 'No active subscribers to notify' 
      });
    }

    console.log(`Notifying ${subscribers.length} subscribers about new post: ${post.title}`);

    const result = await sendNewPostNotification(subscribers, post);

    res.json({
      message: 'New post notifications sent successfully!',
      post: {
        title: post.title,
        slug: post.slug
      },
      stats: {
        totalSubscribers: subscribers.length,
        successful: result.successful,
        failed: result.failed,
        successRate: `${((result.successful / subscribers.length) * 100).toFixed(1)}%`
      }
    });
  } catch (error) {
    console.error('Notify new post error:', error);
    res.status(500).json({ 
      message: 'Failed to send post notifications. Please try again later.',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getSubscriberStats = async (req, res) => {
  try {
    const totalSubscribers = await Subscriber.countDocuments();
    const activeSubscribers = await Subscriber.countDocuments({ isActive: true });
    const inactiveSubscribers = await Subscriber.countDocuments({ isActive: false });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubscribers = await Subscriber.countDocuments({
      subscriptionDate: { $gte: thirtyDaysAgo }
    });

    res.json({
      totalSubscribers,
      activeSubscribers,
      inactiveSubscribers,
      engagementRate: totalSubscribers > 0 ? 
        `${((activeSubscribers / totalSubscribers) * 100).toFixed(1)}%` : '0%',
      recentSubscribers,
      stats: {
        total: totalSubscribers,
        active: activeSubscribers,
        inactive: inactiveSubscribers,
        recent: recentSubscribers
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch subscriber statistics',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getNewsletterArchive = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get newsletters from sent emails or create archive from posts
    // For now, we'll return a list based on posts that triggered newsletters
    const Post = (await import('../models/post.js')).default;
    
    const newsletters = await Post.find({
      isPublished: true,
      publishedAt: { $exists: true }
    })
      .select('title excerpt featuredImage publishedAt')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({
      isPublished: true,
      publishedAt: { $exists: true }
    });

    // Format as newsletters
    const formattedNewsletters = newsletters.map(post => ({
      _id: post._id,
      subject: post.title,
      content: post.excerpt || '',
      body: post.excerpt || '',
      sentAt: post.publishedAt,
      createdAt: post.publishedAt,
      recipientCount: 0 // Would need to track this
    }));

    res.json({
      newsletters: formattedNewsletters,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNewsletters: total
      }
    });
  } catch (error) {
    console.error('Get newsletter archive error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch newsletter archive',
      error: error.message 
    });
  }
};

export const getAllSubscribers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const subscribers = await Subscriber.find()
      .sort({ subscriptionDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Subscriber.countDocuments();

    res.json({
      subscribers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSubscribers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all subscribers error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch subscribers',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};