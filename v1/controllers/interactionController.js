import Post from '../models/post.js';

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

    post.shares += 1;
    await post.save();

    res.json({
      message: 'Post shared successfully',
      shares: post.shares,
      shareUrl: `${process.env.BASE_URL}/v1/posts/${post.slug}`
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
        shares: post.shares,
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
      .populate('author', 'username')
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