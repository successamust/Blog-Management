import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  featuredImage: {
    type: String
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shares: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  engagementRate: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true
});

// Generate slug before validation runs
postSchema.pre('validate', function(next) {
  // Generate slug if title is modified or if slug doesn't exist
  if (this.isModified('title') || !this.slug) {
    if (this.title) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
  }
  next();
});

// Also update slug when title changes in pre-save
postSchema.pre('save', function(next) {
  if (this.isModified('title') && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

postSchema.pre('save', function(next) {
  const totalInteractions = this.likes.length + this.dislikes.length + this.shares;
  const totalViews = this.viewCount || 1;
  this.engagementRate = totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0;
  next();
});

postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('dislikeCount').get(function() {
  return this.dislikes.length;
});

postSchema.methods.hasLiked = function(userId) {
  return this.likes.includes(userId);
};

postSchema.methods.hasDisliked = function(userId) {
  return this.dislikes.includes(userId);
};

postSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
  tags: 'text'
});

postSchema.index({ isPublished: 1, publishedAt: -1 });
postSchema.index({ category: 1, publishedAt: -1 });
postSchema.index({ tags: 1, publishedAt: -1 });

export default mongoose.model('Post', postSchema);