import Poll from '../models/poll.js';
import PollVote from '../models/pollVote.js';
import Post from '../models/post.js';
import User from '../models/user.js';

export const createPoll = async (req, res) => {
  try {
    const { postId, question, description, options } = req.body;

    if (!postId || !question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ 
        message: 'Post ID, question, and at least 2 options are required' 
      });
    }

    // Check if post exists and user is author
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    if (!req.user.isAdmin() && !isAuthor) {
      return res.status(403).json({ 
        message: 'Only post author or admin can create polls' 
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
        id: opt.id || opt.text.toLowerCase().replace(/\s+/g, '-'),
        text: opt.text
      }))
    });

    await poll.save();

    res.status(201).json({
      message: 'Poll created successfully',
      poll
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

