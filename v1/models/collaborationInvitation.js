import mongoose from 'mongoose';

const collaborationInvitationSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['co-author', 'editor', 'reviewer'],
    default: 'co-author'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'revoked'],
    default: 'pending'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  }
}, {
  timestamps: true
});

collaborationInvitationSchema.index({ post: 1, email: 1 });
collaborationInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
collaborationInvitationSchema.index({ email: 1, status: 1 }); // For user invitation queries
collaborationInvitationSchema.index({ invitedBy: 1 }); // For inviter queries

export default mongoose.model('CollaborationInvitation', collaborationInvitationSchema);

