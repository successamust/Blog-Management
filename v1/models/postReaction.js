import mongoose from 'mongoose';

const postReactionSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reactionType: {
    type: String,
    enum: ['like', 'love', 'funny', 'celebrate', 'insightful'],
    required: true
  }
}, {
  timestamps: true
});

// Ensure one reaction per user per post
postReactionSchema.index({ post: 1, user: 1 }, { unique: true });

export default mongoose.model('PostReaction', postReactionSchema);

