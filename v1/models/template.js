import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    excerpt: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: String,
      trim: true,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
templateSchema.index({ isDefault: 1, createdAt: -1 });
templateSchema.index({ createdBy: 1, isDefault: 1 });

const Template = mongoose.models.Template || mongoose.model('Template', templateSchema);

export default Template;

