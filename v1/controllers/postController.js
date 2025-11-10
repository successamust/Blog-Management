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

    // Build query based on user role and parameters
    let query = {};

    // If user is authenticated and wants to include drafts
    if (includeDrafts && req.user) {
      if (req.user.role === 'admin') {
        // Admins can see all posts (published and drafts)
        // No filter needed - show all
        query = {};
      } else if (req.user.role === 'author') {
        // Authors can see all published posts AND their own draft posts
        query = {
          $or: [
            { isPublished: true }, // All published posts (from any author)
            { 
              isPublished: false,
              author: req.user._id // Their own drafts only
            }
          ]
        };
      } else {
        // Regular users can only see published posts
        query = { isPublished: true };
      }
    } else {
      // Default: only published posts for public access
      query = { isPublished: true };
    }

    // Handle status filter if provided
    if (status && status !== 'all') {
      if (status === 'published') {
        // Filter to only published posts
        if (query.$or) {
          // If we have an $or query, replace it with just published posts
          query = { isPublished: true };
        } else {
          query.isPublished = true;
        }
      } else if (status === 'draft') {
        // Filter to only draft posts
        if (req.user && req.user.role === 'author') {
          // Authors can only see their own drafts
          query = {
            isPublished: false,
            author: req.user._id
          };
        } else if (req.user && req.user.role === 'admin') {
          // Admins can see all drafts
          query = { isPublished: false };
        } else {
          // Regular users can't see drafts
          query = { _id: null }; // Return empty result
        }
      }
    }

    const posts = await Post.find(query)
      .populate('author', 'username profilePicture')
      .sort({ publishedAt: -1, createdAt: -1 }) // Sort by publishedAt for published, createdAt for drafts
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
    // First try to find published post (public access)
    let post = await Post.findOne({ 
      slug: req.params.slug, 
      isPublished: true 
    }).populate('author', 'username profilePicture');

    // If not found and user is authenticated, check for draft posts
    if (!post && req.user) {
      post = await Post.findOne({ 
        slug: req.params.slug 
      }).populate('author', 'username profilePicture');

      // If found but unpublished, check if user has permission to view it
      if (post && !post.isPublished) {
        const isAuthor = post.author._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isAuthor && !isAdmin) {
          return res.status(404).json({ message: 'Post not found' });
        }
      }
    }

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only increment viewCount for published posts
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

    const { title, content, excerpt, featuredImage, tags, isPublished, category } = req.body;

    const post = new Post({
      title,
      content,
      excerpt,
      featuredImage,
      tags,
      category,
      isPublished,
      author: req.user._id,
      publishedAt: isPublished ? new Date() : null
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
    if (!req.user.isAdmin() && !isAuthor) {
      return res.status(403).json({ 
        message: 'Access denied. Not authorized to update this post.' 
      });
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        post[key] = req.body[key];
      }
    });

    if (req.body.isPublished && !post.publishedAt) {
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