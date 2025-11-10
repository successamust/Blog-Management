import Post from '../models/post.js';
import Category from '../models/category.js';

export const searchPosts = async (req, res) => {
  try {
    const {
      q,
      category,
      author,
      tags,
      sortBy = 'relevance',
      page = 1,
      limit = 10
    } = req.query;

    const skip = (page - 1) * limit;
    
    let query = { isPublished: true };
    let sort = {};

    if (q) {
      query.$text = { $search: q };
    }

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category, isActive: true });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (author) {
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }

    switch (sortBy) {
      case 'newest':
        sort = { publishedAt: -1 };
        break;
      case 'oldest':
        sort = { publishedAt: 1 };
        break;
      case 'popular':
        sort = { viewCount: -1 };
        break;
      case 'engagement':
        sort = { engagementRate: -1 };
        break;
      default:
        if (q) {
          sort = { score: { $meta: 'textScore' } };
        } else {
          sort = { publishedAt: -1 };
        }
    }

    let findOperation = Post.find(query)
      .populate('author', 'username profilePicture')
      .populate('category', 'name slug color')
      .select('title slug excerpt featuredImage likes dislikes shares viewCount engagementRate publishedAt createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    if (q && sortBy === 'relevance') {
      findOperation = findOperation.select({ score: { $meta: 'textScore' } });
    }

    findOperation = findOperation.sort(sort);

    const [posts, total] = await Promise.all([
      findOperation,
      Post.countDocuments(query)
    ]);

    let filteredPosts = posts;
    if (author) {
      filteredPosts = posts.filter(post => 
        post.author && post.author.username.toLowerCase().includes(author.toLowerCase())
      );
    }

    const searchMeta = await getSearchMeta(query);

    res.json({
      results: filteredPosts,
      meta: {
        query: q,
        filters: {
          category,
          author,
          tags: tags ? tags.split(',') : []
        },
        sortBy,
        ...searchMeta
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ 
      message: 'Failed to search posts'
    });
  }
};

export const getPopularTags = async (req, res) => {
  try {
    const tags = await Post.aggregate([
      { $match: { isPublished: true } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      tags
    });
  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch popular tags'
    });
  }
};

export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const posts = await Post.find({
      isPublished: true,
      $text: { $search: q }
    })
      .select('title slug')
      .limit(5);

    const categories = await Category.find({
      isActive: true,
      name: { $regex: q, $options: 'i' }
    })
      .select('name slug')
      .limit(3);

    const tags = await Post.aggregate([
      { $match: { 
        isPublished: true,
        tags: { $regex: q, $options: 'i' }
      }},
      { $unwind: '$tags' },
      { $match: { tags: { $regex: q, $options: 'i' } } },
      { $group: { _id: '$tags' } },
      { $limit: 3 },
      { $project: { name: '$_id', _id: 0 } }
    ]);

    res.json({
      suggestions: {
        posts: posts.map(p => ({ type: 'post', title: p.title, slug: p.slug })),
        categories: categories.map(c => ({ type: 'category', name: c.name, slug: c.slug })),
        tags: tags.map(t => ({ type: 'tag', name: t.name }))
      }
    });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch search suggestions'
    });
  }
};

const getSearchMeta = async (query) => {
  const totalPosts = await Post.countDocuments({ isPublished: true });
  const currentResults = await Post.countDocuments(query);
  
  return {
    totalPosts,
    currentResults,
    resultsPercentage: totalPosts > 0 ? ((currentResults / totalPosts) * 100).toFixed(1) : 0
  };
};
