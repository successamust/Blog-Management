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
  }
}, {
  timestamps: true
});

pollSchema.index({ post: 1 });

export default mongoose.model('Poll', pollSchema);

