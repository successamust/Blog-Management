import mongoose from 'mongoose';

const pollVoteSchema = new mongoose.Schema({
  poll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  optionId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Ensure one vote per user per poll
pollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });
pollVoteSchema.index({ poll: 1 }); // For faster poll vote queries
pollVoteSchema.index({ user: 1 }); // For user vote history

export default mongoose.model('PollVote', pollVoteSchema);

