import Poll from '../models/poll.js';
import PollVote from '../models/pollVote.js';
import Post from '../models/post.js';
import User from '../models/user.js';

export const createPoll = async (req, res) => {
  try {
    console.log('=== CREATE POLL REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user?._id, req.user?.email);
    console.log('Headers:', req.headers);
    
    const { postId, question, description, options, isActive } = req.body;

    if (!postId || !question || !options || !Array.isArray(options) || options.length < 2) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ 
        message: 'Post ID, question, and at least 2 options are required' 
      });
    }

    // Check if post exists and user is author or collaborator
    const post = await Post.findById(postId);
    if (!post) {
      console.log('Post not found:', postId);
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('Post found:', post.title);
    console.log('Post author:', post.author);
    console.log('Post collaborators:', post.collaborators);

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isCollaborator = post.collaborators?.some(
      collab => {
        const collabUserId = collab.user?._id || collab.user;
        const isMatch = collabUserId && collabUserId.toString() === req.user._id.toString();
        if (isMatch) {
          console.log('User is a collaborator:', collabUserId);
        }
        return isMatch;
      }
    );
    
    console.log('Is author:', isAuthor);
    console.log('Is collaborator:', isCollaborator);
    console.log('Is admin:', req.user.isAdmin());
    
    if (!req.user.isAdmin() && !isAuthor && !isCollaborator) {
      console.log('Permission denied - user is not author, collaborator, or admin');
      return res.status(403).json({ 
        message: 'Only post author, collaborators, or admin can create polls' 
      });
    }

    // Check if poll already exists
    const existingPoll = await Poll.findOne({ post: postId });
    if (existingPoll) {
      return res.status(400).json({ message: 'Poll already exists for this post' });
    }

    const poll = new Poll({
      post: postId,
      question,
      description,
      options: options.map(opt => ({
        id: opt.id || opt.text.toLowerCase().replace(/\s+/g, '-').substring(0, 50),
        text: opt.text
      })),
      isActive: isActive !== undefined ? isActive : true
    });

    await poll.save();
    console.log('Poll saved successfully:', poll._id);

    // Populate the poll with post info for better response
    const populatedPoll = await Poll.findById(poll._id).populate('post', 'title slug');

    console.log('Sending response with poll:', populatedPoll?._id || poll._id);
    res.status(201).json({
      message: 'Poll created successfully',
      poll: populatedPoll || poll
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ 
      message: 'Failed to create poll',
      error: error.message 
    });
  }
};

export const voteOnPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ message: 'Poll is not active' });
    }

    // Check if option exists
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      return res.status(400).json({ message: 'Invalid option' });
    }

    // Check if user already voted
    const existingVote = await PollVote.findOne({ poll: pollId, user: userId });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    // Create vote
    const vote = new PollVote({
      poll: pollId,
      user: userId,
      optionId
    });
    await vote.save();

    // Update poll results
    const currentCount = poll.results?.get(optionId) || 0;
    if (!poll.results) {
      poll.results = new Map();
    }
    poll.results.set(optionId, currentCount + 1);
    await poll.save();

    res.json({
      message: 'Vote recorded successfully',
      results: Object.fromEntries(poll.results || [])
    });
  } catch (error) {
    console.error('Vote on poll error:', error);
    res.status(500).json({ 
      message: 'Failed to vote on poll',
      error: error.message 
    });
  }
};

export const getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user?._id;

    const poll = await Poll.findById(pollId).populate('post', 'title slug');
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    let userVote = null;
    if (userId) {
      const vote = await PollVote.findOne({ poll: pollId, user: userId });
      userVote = vote ? vote.optionId : null;
    }

    const totalVotes = Array.from(poll.results?.values() || []).reduce((sum, count) => sum + count, 0);

    res.json({
      poll: {
        id: poll._id,
        question: poll.question,
        description: poll.description,
        options: poll.options,
        isActive: poll.isActive
      },
      results: Object.fromEntries(poll.results || []),
      totalVotes,
      userVote
    });
  } catch (error) {
    console.error('Get poll results error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch poll results',
      error: error.message 
    });
  }
};

export const getAllPolls = async (req, res) => {
  try {
    const { page = 1, limit = 20, postId, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (postId) query.post = postId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const polls = await Poll.find(query)
      .populate('post', 'title slug author')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Poll.countDocuments(query);

    res.json({
      polls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPolls: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all polls error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch polls',
      error: error.message 
    });
  }
};

export const getPollById = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user?._id;

    const poll = await Poll.findById(pollId).populate('post', 'title slug author');
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    let userVote = null;
    if (userId) {
      const vote = await PollVote.findOne({ poll: pollId, user: userId });
      userVote = vote ? vote.optionId : null;
    }

    const totalVotes = Array.from(poll.results?.values() || []).reduce((sum, count) => sum + count, 0);

    res.json({
      poll: {
        id: poll._id,
        question: poll.question,
        description: poll.description,
        options: poll.options,
        isActive: poll.isActive,
        post: poll.post
      },
      results: Object.fromEntries(poll.results || []),
      totalVotes,
      userVote
    });
  } catch (error) {
    console.error('Get poll by ID error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch poll',
      error: error.message 
    });
  }
};

export const updatePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { question, description, options, isActive } = req.body;

    const poll = await Poll.findById(pollId).populate('post');
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const post = poll.post;
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isCollaborator = post.collaborators?.some(
      collab => collab.user.toString() === req.user._id.toString()
    );

    if (!req.user.isAdmin() && !isAuthor && !isCollaborator) {
      return res.status(403).json({ 
        message: 'Only post author, collaborators, or admin can update polls' 
      });
    }

    if (question) poll.question = question;
    if (description !== undefined) poll.description = description;
    if (options && Array.isArray(options) && options.length >= 2) {
      poll.options = options.map(opt => ({
        id: opt.id || opt.text.toLowerCase().replace(/\s+/g, '-').substring(0, 50),
        text: opt.text
      }));
    }
    if (isActive !== undefined) poll.isActive = isActive;

    await poll.save();

    res.json({
      message: 'Poll updated successfully',
      poll
    });
  } catch (error) {
    console.error('Update poll error:', error);
    res.status(500).json({ 
      message: 'Failed to update poll',
      error: error.message 
    });
  }
};

export const deletePoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId).populate('post');
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const post = poll.post;
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isCollaborator = post.collaborators?.some(
      collab => collab.user.toString() === req.user._id.toString()
    );

    if (!req.user.isAdmin() && !isAuthor && !isCollaborator) {
      return res.status(403).json({ 
        message: 'Only post author, collaborators, or admin can delete polls' 
      });
    }

    // Delete all votes associated with this poll
    await PollVote.deleteMany({ poll: pollId });

    // Delete the poll
    await Poll.findByIdAndDelete(pollId);

    res.json({
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({ 
      message: 'Failed to delete poll',
      error: error.message 
    });
  }
};

export const getPollByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?._id;

    const poll = await Poll.findOne({ post: postId });
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found for this post' });
    }

    let userVote = null;
    if (userId) {
      const vote = await PollVote.findOne({ poll: poll._id, user: userId });
      userVote = vote ? vote.optionId : null;
    }

    const totalVotes = Array.from(poll.results?.values() || []).reduce((sum, count) => sum + count, 0);

    res.json({
      poll: {
        id: poll._id,
        question: poll.question,
        description: poll.description,
        options: poll.options,
        isActive: poll.isActive
      },
      results: Object.fromEntries(poll.results || []),
      totalVotes,
      userVote
    });
  } catch (error) {
    console.error('Get poll by post error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch poll',
      error: error.message 
    });
  }
};

