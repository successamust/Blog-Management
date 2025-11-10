import Post from '../models/post.js';
import Comment from '../models/comment.js';
import User from '../models/user.js';

export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('bookmarkedPosts');
    
    const [
      userPosts,
      userComments,
      likedPosts,
      bookmarkedPosts,
      totalPostsCount,
      publishedPostsCount,
      draftPostsCount,
      totalCommentsCount,
      approvedCommentsCount,
      userStats
    ] = await Promise.all([
      Post.find({ 
        author: userId, 
        isPublished: true 
      })
        .select('title slug likes dislikes shares viewCount publishedAt')
        .sort({ publishedAt: -1 })
        .limit(5),

      Comment.find({ 
        author: userId,
        isApproved: true 
      })
        .populate('post', 'title slug')
        .select('content post likes createdAt')
        .sort({ createdAt: -1 })
        .limit(5),

      Post.find({ 
        likes: userId,
        isPublished: true 
      })
        .populate('author', 'username profilePicture')
        .select('title slug excerpt author likes publishedAt')
        .sort({ publishedAt: -1 })
        .limit(5),

      Post.find({
        _id: { $in: user.bookmarkedPosts },
        isPublished: true
      })
        .populate('author', 'username profilePicture')
        .select('title slug excerpt author publishedAt')
        .sort({ publishedAt: -1 })
        .limit(5),

      Post.countDocuments({ author: userId }),
      Post.countDocuments({ author: userId, isPublished: true }),
      Post.countDocuments({ author: userId, isPublished: false }),

      Comment.countDocuments({ author: userId }),
      Comment.countDocuments({ author: userId, isApproved: true }),

      getUserEngagementStats(userId)
    ]);

    const totalWords = userStats.totalWords || 0;
    const estimatedReadingTime = Math.ceil(totalWords / 200);

    res.json({
      overview: {
        user: {
          username: req.user.username,
          email: req.user.email,
          role: req.user.role,
          joined: req.user.createdAt
        },
        stats: {
          posts: {
            total: totalPostsCount,
            published: publishedPostsCount,
            drafts: draftPostsCount
          },
          comments: {
            total: totalCommentsCount,
            approved: approvedCommentsCount
          },
          engagement: {
            totalLikes: userStats.totalLikes,
            totalViews: userStats.totalViews,
            totalShares: userStats.totalShares,
            estimatedReadingTime
          }
        }
      },
      recentActivity: {
        posts: userPosts,
        comments: userComments,
        likedPosts: likedPosts,
        bookmarkedPosts: bookmarkedPosts
      },
      quickActions: getQuickActions(req.user.role)
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ 
      message: 'Failed to load dashboard'
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    let query = { author: userId };
    
    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('category', 'name slug color')
        .select('title slug excerpt featuredImage likes dislikes shares viewCount isPublished publishedAt createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(query)
    ]);

    const postsWithMetrics = posts.map(post => ({
      ...post.toObject(),
      engagementRate: post.engagementRate,
      commentCount: 0
    }));

    res.json({
      posts: postsWithMetrics,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filters: {
        status: status || 'all'
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user posts'
    });
  }
};

export const getUserComments = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ author: userId })
        .populate('post', 'title slug')
        .select('content post likes isApproved createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ author: userId })
    ]);

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
    console.error('Get user comments error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user comments'
    });
  }
};

export const getUserLikedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ 
        likes: userId,
        isPublished: true 
      })
        .populate('author', 'username profilePicture')
        .populate('category', 'name slug color')
        .select('title slug excerpt featuredImage likes dislikes viewCount publishedAt')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ 
        likes: userId,
        isPublished: true 
      })
    ]);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalLikedPosts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user liked posts error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch liked posts'
    });
  }
};

export const getUserBookmarkedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId).select('bookmarkedPosts');
    
    const [posts, total] = await Promise.all([
      Post.find({
        _id: { $in: user.bookmarkedPosts },
        isPublished: true
      })
        .populate('author', 'username profilePicture')
        .populate('category', 'name slug color')
        .select('title slug excerpt featuredImage likes dislikes viewCount publishedAt')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({
        _id: { $in: user.bookmarkedPosts },
        isPublished: true
      })
    ]);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBookmarkedPosts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user bookmarked posts error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bookmarked posts'
    });
  }
};

export const getReadingHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ isPublished: true })
        .populate('author', 'username profilePicture')
        .populate('category', 'name slug color')
        .select('title slug excerpt featuredImage viewCount publishedAt')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ isPublished: true })
    ]);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      note: "Reading history tracking can be enhanced by storing user view data"
    });
  } catch (error) {
    console.error('Get reading history error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch reading history'
    });
  }
};

const getUserEngagementStats = async (userId) => {
  try {
    const userPosts = await Post.find({ author: userId, isPublished: true });
    
    const stats = userPosts.reduce((acc, post) => {
      acc.totalLikes += post.likes.length;
      acc.totalViews += post.viewCount || 0;
      acc.totalShares += post.shares || 0;
      
      const words = post.content.split(/\s+/).length;
      acc.totalWords += words;
      
      return acc;
    }, {
      totalLikes: 0,
      totalViews: 0,
      totalShares: 0,
      totalWords: 0
    });

    return stats;
  } catch (error) {
    console.error('Get user engagement stats error:', error);
    return {
      totalLikes: 0,
      totalViews: 0,
      totalShares: 0,
      totalWords: 0
    };
  }
};

const getQuickActions = (userRole) => {
  const baseActions = [
    {
      title: 'Browse Posts',
      description: 'Explore all published content',
      path: '/v1/posts',
      method: 'GET',
      icon: '📚'
    },
    {
      title: 'Liked Posts',
      description: 'View posts you have liked',
      path: '/v1/dashboard/likes',
      method: 'GET',
      icon: '❤️'
    },
    {
      title: 'Bookmarked Posts',
      description: 'View posts you have bookmarked',
      path: '/v1/dashboard/bookmarks',
      method: 'GET',
      icon: '🔖'
    },
    {
      title: 'My Comments',
      description: 'Manage your comments',
      path: '/v1/dashboard/comments',
      method: 'GET',
      icon: '💬'
    }
  ];

  if (userRole === 'admin') {
    baseActions.push(
      {
        title: 'Create Post',
        description: 'Write a new blog post',
        path: '/v1/posts',
        method: 'POST',
        icon: '✍️'
      },
      {
        title: 'Manage Categories',
        description: 'Add or edit categories',
        path: '/v1/categories',
        method: 'GET',
        icon: '📁'
      },
      {
        title: 'Upload Image',
        description: 'Add images for your posts',
        path: '/v1/images/upload',
        method: 'POST',
        icon: '🖼️'
      }
    );
  }

  return baseActions;
};