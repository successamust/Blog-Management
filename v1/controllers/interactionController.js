import Post from '../models/post.js';
import User from '../models/user.js';
import PostReaction from '../models/postReaction.js';

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.isPublished) {
      return res.status(400).json({ message: 'Cannot like an unpublished post' });
    }

    const userId = req.user._id;
    const hasLiked = post.likes.includes(userId);
    const hasDisliked = post.dislikes.includes(userId);

    if (hasLiked) {
      post.likes.pull(userId);
      await post.save();
      
      await User.findByIdAndUpdate(userId, {
        $pull: { likedPosts: req.params.postId }
      });
      
      return res.json({ 
        message: 'Post unliked successfully',
        liked: false,
        likes: post.likes.length,
        dislikes: post.dislikes.length
      });
    }

    if (hasDisliked) {
      post.dislikes.pull(userId);
    }

    post.likes.push(userId);
    await post.save();
    
    await User.findByIdAndUpdate(userId, {
      $addToSet: { likedPosts: req.params.postId }
    });

    res.json({
      message: 'Post liked successfully',
      liked: true,
      likes: post.likes.length,
      dislikes: post.dislikes.length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ 
      message: 'Failed to like post',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.isPublished) {
      return res.status(400).json({ message: 'Cannot dislike an unpublished post' });
    }

    const userId = req.user._id;
    const hasDisliked = post.dislikes.includes(userId);
    const hasLiked = post.likes.includes(userId);

    if (hasDisliked) {
      post.dislikes.pull(userId);
      await post.save();
      
      return res.json({ 
        message: 'Post undisliked successfully',
        disliked: false,
        likes: post.likes.length,
        dislikes: post.dislikes.length
      });
    }

    if (hasLiked) {
      post.likes.pull(userId);
      
      await User.findByIdAndUpdate(userId, {
        $pull: { likedPosts: req.params.postId }
      });
    }

    post.dislikes.push(userId);
    await post.save();

    res.json({
      message: 'Post disliked successfully',
      disliked: true,
      likes: post.likes.length,
      dislikes: post.dislikes.length
    });
  } catch (error) {
    console.error('Dislike post error:', error);
    res.status(500).json({ 
      message: 'Failed to dislike post',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.isPublished) {
      return res.status(400).json({ message: 'Cannot share an unpublished post' });
    }

    post.shares = (post.shares || 0) + 1;
    post.shareCount = (post.shareCount || 0) + 1;
    await post.save();

    res.json({
      message: 'Post shared successfully',
      shares: post.shareCount || post.shares,
      shareCount: post.shareCount || post.shares,
      shareUrl: `${process.env.BASE_URL || ''}/posts/${post.slug}`
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ 
      message: 'Failed to share post',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getPostInteractions = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .select('likes dislikes shares viewCount engagementRate')
      .populate('likes', 'username')
      .populate('dislikes', 'username');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userInteractions = {
      hasLiked: req.user ? post.likes.some(like => like._id.toString() === req.user._id.toString()) : false,
      hasDisliked: req.user ? post.dislikes.some(dislike => dislike._id.toString() === req.user._id.toString()) : false
    };

    res.json({
      interactions: {
        likes: post.likes.length,
        dislikes: post.dislikes.length,
        shares: post.shareCount || post.shares || 0,
        shareCount: post.shareCount || post.shares || 0,
        views: post.viewCount,
        engagementRate: post.engagementRate
      },
      userInteractions,
      recentLikers: post.likes.slice(0, 5),
      recentDislikers: post.dislikes.slice(0, 5)
    });
  } catch (error) {
    console.error('Get post interactions error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch post interactions',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getUserLikedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      likes: req.user._id,
      isPublished: true
    })
      .populate('author', 'username profilePicture')
      .select('title slug excerpt featuredImage likes dislikes shares createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      likes: req.user._id,
      isPublished: true
    });

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user liked posts error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch liked posts',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.isPublished) {
      return res.status(400).json({ message: 'Cannot bookmark an unpublished post' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    const hasBookmarked = user.bookmarkedPosts.some(
      bookmarkedId => bookmarkedId.toString() === req.params.postId
    );

    if (hasBookmarked) {
      await User.findByIdAndUpdate(userId, {
        $pull: { bookmarkedPosts: req.params.postId }
      });
      
      return res.json({ 
        message: 'Post unbookmarked successfully',
        bookmarked: false
      });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { bookmarkedPosts: req.params.postId }
    });

    res.json({
      message: 'Post bookmarked successfully',
      bookmarked: true
    });
  } catch (error) {
    console.error('Bookmark post error:', error);
    res.status(500).json({ 
      message: 'Failed to bookmark post',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getUserBookmarkedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id).select('bookmarkedPosts');
    
    const posts = await Post.find({
      _id: { $in: user.bookmarkedPosts },
      isPublished: true
    })
      .populate('author', 'username profilePicture')
      .select('title slug excerpt featuredImage likes dislikes shares createdAt publishedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      _id: { $in: user.bookmarkedPosts },
      isPublished: true
    });

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user bookmarked posts error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bookmarked posts',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const reactToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user._id;

    const validReactions = ['like', 'love', 'funny', 'celebrate', 'insightful'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ 
        message: `Invalid reaction type. Must be one of: ${validReactions.join(', ')}` 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.isPublished) {
      return res.status(400).json({ message: 'Cannot react to an unpublished post' });
    }

    // Check if user already has a reaction
    const existingReaction = await PostReaction.findOne({ post: postId, user: userId });

    if (existingReaction) {
      // If same reaction, remove it
      if (existingReaction.reactionType === reactionType) {
        await PostReaction.findByIdAndDelete(existingReaction._id);
        
        // Update post reactions map
        const currentCount = post.reactions?.get(reactionType) || 0;
        if (!post.reactions) {
          post.reactions = new Map();
        }
        post.reactions.set(reactionType, Math.max(0, currentCount - 1));
        await post.save();

        return res.json({
          message: 'Reaction removed',
          reactionType: null,
          reactions: Object.fromEntries(post.reactions || [])
        });
      } else {
        // Update to new reaction type
        const oldType = existingReaction.reactionType;
        existingReaction.reactionType = reactionType;
        await existingReaction.save();

        // Update post reactions map
        if (!post.reactions) {
          post.reactions = new Map();
        }
        const oldCount = post.reactions.get(oldType) || 0;
        const newCount = post.reactions.get(reactionType) || 0;
        post.reactions.set(oldType, Math.max(0, oldCount - 1));
        post.reactions.set(reactionType, newCount + 1);
        await post.save();

        return res.json({
          message: 'Reaction updated',
          reactionType,
          reactions: Object.fromEntries(post.reactions || [])
        });
      }
    } else {
      // Create new reaction
      const newReaction = new PostReaction({
        post: postId,
        user: userId,
        reactionType
      });
      await newReaction.save();

      // Update post reactions map
      if (!post.reactions) {
        post.reactions = new Map();
      }
      const currentCount = post.reactions.get(reactionType) || 0;
      post.reactions.set(reactionType, currentCount + 1);
      await post.save();

      return res.json({
        message: 'Reaction added',
        reactionType,
        reactions: Object.fromEntries(post.reactions || [])
      });
    }
  } catch (error) {
    console.error('React to post error:', error);
    res.status(500).json({ 
      message: 'Failed to react to post',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getPostReactions = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?._id;

    const post = await Post.findById(postId).select('reactions');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let userReaction = null;
    if (userId) {
      const reaction = await PostReaction.findOne({ post: postId, user: userId });
      userReaction = reaction ? reaction.reactionType : null;
    }

    const reactions = post.reactions ? Object.fromEntries(post.reactions) : {};

    res.json({
      reactions,
      userReaction
    });
  } catch (error) {
    console.error('Get post reactions error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch reactions',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};