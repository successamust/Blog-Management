import { validationResult } from 'express-validator';
import Post from '../models/post.js';
import Category from '../models/category.js';
import { deleteImage } from '../utils/imageUpload.js';

export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const includeDrafts = req.query.includeDrafts === 'true' || req.query.includeDrafts === true;
    const status = req.query.status;
    const author = req.query.author;
    const tags = req.query.tags;

    let query = {};

    if (includeDrafts && req.user) {
      if (req.user.role === 'admin') {
        query = {};
      } else if (req.user.role === 'author') {
        query = {
          $or: [
            { isPublished: true },
            { 
              isPublished: false,
              author: req.user._id
            }
          ]
        };
      } else {
        query = { isPublished: true };
      }
    } else {
      query = { isPublished: true };
    }

    if (author) {
      const User = (await import('../models/user.js')).default;
      const authorUser = await User.findOne({ 
        username: { $regex: new RegExp(`^${author}$`, 'i') } 
      }).select('_id');
      
      if (authorUser) {
        query.author = authorUser._id;
      } else {
        return res.json({
          posts: [],
          currentPage: page,
          totalPages: 0,
          totalPosts: 0
        });
      }
    }

    if (tags) {
      const tagArray = typeof tags === 'string' 
        ? tags.split(',').map(tag => tag.trim().toLowerCase())
        : Array.isArray(tags) 
          ? tags.map(tag => String(tag).trim().toLowerCase())
          : [String(tags).trim().toLowerCase()];
      
      query.tags = { $in: tagArray };
    }

    if (status && status !== 'all') {
      if (status === 'published') {
        if (query.$or) {
          query = { ...query, isPublished: true };
        } else {
          query.isPublished = true;
        }
      } else if (status === 'draft') {
        if (req.user && req.user.role === 'author') {
          query = {
            isPublished: false,
            author: req.user._id,
            ...(author && { author: query.author }),
            ...(tags && { tags: query.tags })
          };
        } else if (req.user && req.user.role === 'admin') {
          query = { 
            isPublished: false,
            ...(author && { author: query.author }),
            ...(tags && { tags: query.tags })
          };
        } else {
          query = { _id: null };
        }
      }
    }

    if (query.isPublished === true || (!query.isPublished && !includeDrafts)) {
      query.$or = [
        { scheduledAt: null },
        { scheduledAt: { $lte: new Date() } },
        { scheduledAt: { $exists: false } }
      ];
    }

    const posts = await Post.find(query)
      .populate('author', 'username profilePicture email bio authorProfile')
      .populate('category', 'name slug color')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPostBySlug = async (req, res) => {
  try {
    let post = await Post.findOne({ 
      slug: req.params.slug, 
      isPublished: true 
    }).populate('author', 'username profilePicture');

    if (!post && req.user) {
      post = await Post.findOne({ 
        slug: req.params.slug 
      }).populate('author', 'username profilePicture');

      if (post && !post.isPublished) {
        const postAuthorId = post.author?._id?.toString() || 
                            post.author?.toString() || 
                            post.author?._id || 
                            post.author;
        const userId = req.user._id?.toString() || req.user._id || req.user.id?.toString() || req.user.id;
        const isAuthor = postAuthorId && userId && String(postAuthorId) === String(userId);
        const isAdmin = req.user.role === 'admin';
        
        if (!isAuthor && !isAdmin) {
          return res.status(404).json({ message: 'Post not found' });
        }
      }
    }

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.isPublished) {
      post.viewCount += 1;
      await post.save();
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, excerpt, featuredImage, tags, isPublished, category, scheduledAt } = req.body;

    // Validate scheduledAt
    let finalIsPublished = isPublished;
    let finalPublishedAt = isPublished ? new Date() : null;
    let finalScheduledAt = null;

    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ message: 'Invalid scheduled date' });
      }
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ message: 'Scheduled date must be in the future' });
      }
      finalScheduledAt = scheduledDate;
      finalIsPublished = false; // Don't publish if scheduled
      finalPublishedAt = null;
    }

    const post = new Post({
      title,
      content,
      excerpt,
      featuredImage,
      tags,
      category,
      isPublished: finalIsPublished,
      scheduledAt: finalScheduledAt,
      author: req.user._id,
      publishedAt: finalPublishedAt
    });

    await post.save();
    await post.populate('author', 'username profilePicture');

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isCollaborator = post.collaborators?.some(
      collab => {
        const collabUserId = collab.user?._id || collab.user;
        return collabUserId && collabUserId.toString() === req.user._id.toString();
      }
    );
    
    if (!req.user.isAdmin() && !isAuthor && !isCollaborator) {
      return res.status(403).json({ 
        message: 'Access denied. Only post author, collaborators, or admin can update this post.' 
      });
    }

    const { scheduledAt, isPublished } = req.body;

    // Handle scheduled posts
    if (scheduledAt !== undefined) {
      if (scheduledAt === null) {
        post.scheduledAt = null;
      } else {
        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
          return res.status(400).json({ message: 'Invalid scheduled date' });
        }
        if (scheduledDate <= new Date()) {
          return res.status(400).json({ message: 'Scheduled date must be in the future' });
        }
        post.scheduledAt = scheduledDate;
        post.isPublished = false; // Don't publish if scheduled
        post.publishedAt = null;
      }
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'scheduledAt') {
        if (key === 'isPublished' && scheduledAt) {
          // Don't allow publishing if scheduled
          return;
        }
        post[key] = req.body[key];
      }
    });

    if (req.body.isPublished && !post.publishedAt && !post.scheduledAt) {
      post.publishedAt = new Date();
    }

    await post.save();
    await post.populate('author', 'username profilePicture');
    await post.populate('category', 'name slug color');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin privileges required to delete posts' 
      });
    }

    const featuredImage = post.featuredImage;

    await Post.findByIdAndDelete(req.params.id);
    
    if (featuredImage) {
      setTimeout(() => cleanupOrphanedImage(featuredImage), 5000);
    }

    res.json({ 
      message: 'Post deleted successfully' 
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      message: 'Failed to delete post'
    });
  }
};

const cleanupOrphanedImage = async (imageUrl) => {
  try {
    const postsUsingImage = await Post.findOne({ 
      featuredImage: imageUrl 
    });

    if (!postsUsingImage) {
      await deleteImage(imageUrl);
      console.log('Cleaned up orphaned image:', imageUrl);
    }
  } catch (error) {
    console.error('Image cleanup error:', error);
  }
};

export const getRelatedPosts = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .select('tags category');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const relatedPosts = await Post.find({
      _id: { $ne: post._id },
      isPublished: true,
      $or: [
        { tags: { $in: post.tags } },
        { category: post.category }
      ]
    })
      .populate('author', 'username profilePicture')
      .populate('category', 'name slug color')
      .select('title slug excerpt featuredImage likes viewCount publishedAt')
      .sort({ engagementRate: -1, publishedAt: -1 })
      .limit(6);

    res.json({
      relatedPosts,
      count: relatedPosts.length
    });
  } catch (error) {
    console.error('Get related posts error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch related posts'
    });
  }
};

export const bulkDeletePosts = async (req, res) => {
  try {
    const { postIds } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ message: 'postIds array is required' });
    }

    // Check permissions - only admin or post authors can delete
    if (req.user.role !== 'admin') {
      const posts = await Post.find({ _id: { $in: postIds } }).select('author');
      const unauthorized = posts.some(post => 
        post.author.toString() !== req.user._id.toString()
      );
      if (unauthorized) {
        return res.status(403).json({ 
          message: 'You can only delete your own posts' 
        });
      }
    }

    const result = await Post.deleteMany({ _id: { $in: postIds } });

    res.json({
      message: `Successfully deleted ${result.deletedCount} post(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete posts error:', error);
    res.status(500).json({ 
      message: 'Failed to delete posts',
      error: error.message 
    });
  }
};

export const bulkUpdatePosts = async (req, res) => {
  try {
    const { postIds, updates } = req.body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ message: 'postIds array is required' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ message: 'updates object is required' });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      const posts = await Post.find({ _id: { $in: postIds } }).select('author collaborators');
      const unauthorized = posts.some(post => {
        const isAuthor = post.author.toString() === req.user._id.toString();
        const isCollaborator = post.collaborators?.some(
          collab => {
            const collabUserId = collab.user?._id || collab.user;
            return collabUserId && collabUserId.toString() === req.user._id.toString();
          }
        );
        return !isAuthor && !isCollaborator;
      });
      if (unauthorized) {
        return res.status(403).json({ 
          message: 'You can only update posts you authored or are collaborating on' 
        });
      }
    }

    // Remove fields that shouldn't be bulk updated
    const allowedFields = ['category', 'status', 'isPublished', 'tags'];
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'status') {
          filteredUpdates.isPublished = updates.status === 'published';
          if (updates.status === 'published') {
            filteredUpdates.publishedAt = new Date();
          }
        } else {
          filteredUpdates[key] = updates[key];
        }
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const result = await Post.updateMany(
      { _id: { $in: postIds } },
      { $set: filteredUpdates }
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} post(s)`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update posts error:', error);
    res.status(500).json({ 
      message: 'Failed to update posts',
      error: error.message 
    });
  }
};