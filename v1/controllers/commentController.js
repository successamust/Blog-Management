import Comment from '../models/comment.js';
import Post from '../models/post.js';
import { validationResult } from 'express-validator';



// Create a new comment
export const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const postId = req.params.postId;

    // Check if post exists and is published
    const post = await Post.findById(postId);
    if (!post || !post.isPublished) {
      return res.status(404).json({ 
        message: 'Post not found or not published' 
      });
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      post: postId
    });

    await comment.save();
    await comment.populate('author', 'username');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ 
      message: 'Failed to create comment'
    });
  }
};

// Update a comment (only by author)
export const updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ 
        message: 'Comment not found' 
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only edit your own comments' 
      });
    }

    comment.content = content;
    await comment.save();
    await comment.populate('author', 'username');

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ 
      message: 'Failed to update comment'
    });
  }
};

// Delete a comment (author or admin)
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ 
        message: 'Comment not found' 
      });
    }

    // Check if user is author or admin
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ 
        message: 'Not authorized to delete this comment' 
      });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    res.json({ 
      message: 'Comment deleted successfully' 
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      message: 'Failed to delete comment'
    });
  }
};

// Like/unlike a comment
export const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ 
        message: 'Comment not found' 
      });
    }

    const hasLiked = comment.likes.includes(req.user._id);

    if (hasLiked) {
      // Unlike
      comment.likes.pull(req.user._id);
      await comment.save();
      
      return res.json({ 
        message: 'Comment unliked successfully',
        liked: false,
        likes: comment.likes.length
      });
    }

    // Like
    comment.likes.push(req.user._id);
    await comment.save();

    res.json({
      message: 'Comment liked successfully',
      liked: true,
      likes: comment.likes.length
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ 
      message: 'Failed to like comment'
    });
  }
};

// Get comments for a post
export const getPostComments = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const comments = await Comment.find({ 
        post: req.params.postId,
        isApproved: true 
      })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
      const total = await Comment.countDocuments({ 
        post: req.params.postId,
        isApproved: true 
      });
  
      res.json({
        comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalComments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ 
        message: 'Failed to fetch comments'
      });
    }
  };