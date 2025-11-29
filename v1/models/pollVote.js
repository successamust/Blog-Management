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
  },
  firstVotedAt: {
    type: Date,
    default: Date.now
  },
  changeCount: {
    type: Number,
    default: 0
  },
  maxChanges: {
    type: Number,
    default: 2 // Allow 2 changes (3 total votes: initial + 2 changes)
  },
  changeWindowMinutes: {
    type: Number,
    default: 5 // 5 minute window to change votes
  }
}, {
  timestamps: true
});

// Ensure one vote per user per poll
pollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });
pollVoteSchema.index({ poll: 1 }); // For faster poll vote queries
pollVoteSchema.index({ user: 1 }); // For user vote history

export default mongoose.model('PollVote', pollVoteSchema);

