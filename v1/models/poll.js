import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    unique: true,
    index: true
  },
  question: {
    type: String,
    required: true,
    maxlength: 500
  },
  description: {
    type: String,
    maxlength: 1000
  },
  options: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 200
    }
  }],
  results: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

pollSchema.index({ post: 1 });
pollSchema.index({ expiresAt: 1 });

// Static method to check and deactivate expired polls
pollSchema.statics.deactivateExpired = async function() {
  await this.updateMany(
    { expiresAt: { $lte: new Date() }, isActive: true },
    { isActive: false }
  );
};

const Poll = mongoose.model('Poll', pollSchema);

export default Poll;

