import Category from '../models/category.js';
import Post from '../models/post.js';
import { validationResult } from 'express-validator';


export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug description color postCount')
      .sort({ postCount: -1, name: 1 });

    res.json({
      categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch categories'
    });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true 
    });

    if (!category) {
      return res.status(404).json({ 
        message: 'Category not found' 
      });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch category'
    });
  }
};

export const getPostsByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true 
    });

    if (!category) {
      return res.status(404).json({ 
        message: 'Category not found' 
      });
    }

    const posts = await Post.find({
      category: category._id,
      isPublished: true
    })
      .populate('author', 'username')
      .populate('category', 'name slug color')
      .select('title slug excerpt featuredImage likes dislikes shares viewCount createdAt')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      category: category._id,
      isPublished: true
    });

    res.json({
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color
      },
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
    console.error('Get posts by category error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch posts by category'
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color } = req.body;

    const category = new Category({
      name,
      description,
      color
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Category name already exists' 
      });
    }
    
    console.error('Create category error:', error);
    res.status(500).json({ 
      message: 'Failed to create category'
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color, isActive } = req.body;
    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return res.status(404).json({ 
        message: 'Category not found' 
      });
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (color !== undefined) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Category name already exists' 
      });
    }
    
    console.error('Update category error:', error);
    res.status(500).json({ 
      message: 'Failed to update category'
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);

    if (!category) {
      return res.status(404).json({ 
        message: 'Category not found' 
      });
    }

    const postCount = await Post.countDocuments({ category: category._id });
    if (postCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${postCount} posts. Assign posts to another category first.` 
      });
    }

    await Category.findByIdAndDelete(req.params.categoryId);

    res.json({ 
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ 
      message: 'Failed to delete category'
    });
  }
};

export const getCategoryStats = async (req, res) => {
  try {
    const stats = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          name: 1,
          slug: 1,
          postCount: 1,
          description: 1,
          color: 1
        }
      },
      { $sort: { postCount: -1 } }
    ]);

    const totalPosts = stats.reduce((sum, cat) => sum + cat.postCount, 0);

    res.json({
      categories: stats,
      totalCategories: stats.length,
      totalPosts,
      averagePostsPerCategory: totalPosts / stats.length || 0
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch category statistics'
    });
  }
};