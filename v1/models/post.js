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
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  // New fields for interactions
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
  // Analytics
  engagementRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate slug before saving
postSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

// Calculate engagement rate before saving
postSchema.pre('save', function(next) {
  const totalInteractions = this.likes.length + this.dislikes.length + this.shares;
  const totalViews = this.viewCount || 1; // Avoid division by zero
  this.engagementRate = (totalInteractions / totalViews) * 100;
  next();
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for dislike count
postSchema.virtual('dislikeCount').get(function() {
  return this.dislikes.length;
});

// Method to check if user liked the post
postSchema.methods.hasLiked = function(userId) {
  return this.likes.includes(userId);
};

// Method to check if user disliked the post
postSchema.methods.hasDisliked = function(userId) {
  return this.dislikes.includes(userId);
};

export default mongoose.model('Post', postSchema);