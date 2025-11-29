import Poll from '../models/poll.js';
import PollVote from '../models/pollVote.js';
import Post from '../models/post.js';
import User from '../models/user.js';

export const createPoll = async (req, res) => {
  try {
    const { postId, question, description, options, isActive, expiresAt } = req.body;

    if (!postId || !question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ 
        message: 'Post ID, question, and at least 2 options are required' 
      });
    }

    // Validate and check for duplicate options (case-insensitive)
    const optionTexts = options.map(opt => opt.text?.trim().toLowerCase()).filter(Boolean);
    const uniqueOptions = new Set(optionTexts);
    if (uniqueOptions.size !== optionTexts.length) {
      return res.status(400).json({ 
        message: 'Poll options must be unique' 
      });
    }

    // Validate expiration date if provided
    let expirationDate = null;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime())) {
        return res.status(400).json({ 
          message: 'Invalid expiration date format' 
        });
      }
      if (expirationDate <= new Date()) {
        return res.status(400).json({ 
          message: 'Expiration date must be in the future' 
        });
      }
    }

    // Check if post exists and user is author or collaborator
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isCollaborator = post.collaborators?.some(
      collab => {
        const collabUserId = collab.user?._id || collab.user;
        return collabUserId && collabUserId.toString() === req.user._id.toString();
      }
    );
    
    if (!req.user.isAdmin() && !isAuthor && !isCollaborator) {
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
        text: opt.text.trim()
      })),
      isActive: isActive !== undefined ? isActive : true,
      expiresAt: expirationDate
    });

    await poll.save();

    // Populate the poll with post info for better response
    const populatedPoll = await Poll.findById(poll._id).populate('post', 'title slug');

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

    // Deactivate expired polls
    await Poll.deactivateExpired();
    
    // Refresh poll data
    await poll.populate('post');
    await poll.save();
    
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
      // Check if user can change their vote
      const now = new Date();
      const firstVotedAt = existingVote.firstVotedAt || existingVote.createdAt;
      const timeSinceFirstVote = (now - firstVotedAt) / 1000 / 60; // minutes
      const maxChanges = existingVote.maxChanges || 2;
      const changeWindow = existingVote.changeWindowMinutes || 5;
      
      // Check if within time window
      if (timeSinceFirstVote > changeWindow) {
        return res.status(400).json({ 
          message: 'Vote change window has expired. You can only change your vote within 5 minutes of your first vote.' 
        });
      }
      
      // Check if change limit reached
      if (existingVote.changeCount >= maxChanges) {
        return res.status(400).json({ 
          message: `You have reached the maximum number of vote changes (${maxChanges}). Your vote is now locked.` 
        });
      }
      
      // User can change vote - update it
      const oldOptionId = existingVote.optionId;
      
      // Decrement old option count
      if (poll.results && poll.results.has(oldOptionId)) {
        const oldCount = poll.results.get(oldOptionId) || 0;
        if (oldCount > 0) {
          poll.results.set(oldOptionId, oldCount - 1);
        }
      }
      
      // Update vote
      existingVote.optionId = optionId;
      existingVote.changeCount = (existingVote.changeCount || 0) + 1;
      await existingVote.save();
      
      // Increment new option count
      const currentCount = poll.results?.get(optionId) || 0;
      if (!poll.results) {
        poll.results = new Map();
      }
      poll.results.set(optionId, currentCount + 1);
      await poll.save();

      const timeRemaining = Math.ceil(changeWindow - timeSinceFirstVote);
      const changesRemaining = maxChanges - existingVote.changeCount;

      res.json({
        message: 'Vote updated successfully',
        results: Object.fromEntries(poll.results || []),
        timeRemainingMinutes: timeRemaining,
        changesRemaining: changesRemaining,
        canChangeAgain: timeRemaining > 0 && changesRemaining > 0
      });
      return;
    }

    // Create new vote
    const vote = new PollVote({
      poll: pollId,
      user: userId,
      optionId,
      firstVotedAt: new Date(),
      changeCount: 0,
      maxChanges: 2,
      changeWindowMinutes: 5
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
      results: Object.fromEntries(poll.results || []),
      timeRemainingMinutes: 5,
      changesRemaining: 2,
      canChangeAgain: true
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
    let canChangeVote = false;
    let timeRemainingMinutes = 0;
    let changesRemaining = 0;
    
    if (userId) {
      const vote = await PollVote.findOne({ poll: pollId, user: userId });
      if (vote) {
        userVote = vote.optionId;
        
        // Check if user can still change vote
        const now = new Date();
        const firstVotedAt = vote.firstVotedAt || vote.createdAt;
        const timeSinceFirstVote = (now - firstVotedAt) / 1000 / 60; // minutes
        const maxChanges = vote.maxChanges || 2;
        const changeWindow = vote.changeWindowMinutes || 5;
        
        timeRemainingMinutes = Math.max(0, Math.ceil(changeWindow - timeSinceFirstVote));
        changesRemaining = Math.max(0, maxChanges - (vote.changeCount || 0));
        canChangeVote = timeRemainingMinutes > 0 && changesRemaining > 0;
      }
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
      userVote,
      canChangeVote,
      timeRemainingMinutes,
      changesRemaining
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
    let canChangeVote = false;
    let timeRemainingMinutes = 0;
    let changesRemaining = 0;
    
    if (userId) {
      const vote = await PollVote.findOne({ poll: pollId, user: userId });
      if (vote) {
        userVote = vote.optionId;
        
        // Check if user can still change vote
        const now = new Date();
        const firstVotedAt = vote.firstVotedAt || vote.createdAt;
        const timeSinceFirstVote = (now - firstVotedAt) / 1000 / 60; // minutes
        const maxChanges = vote.maxChanges || 2;
        const changeWindow = vote.changeWindowMinutes || 5;
        
        timeRemainingMinutes = Math.max(0, Math.ceil(changeWindow - timeSinceFirstVote));
        changesRemaining = Math.max(0, maxChanges - (vote.changeCount || 0));
        canChangeVote = timeRemainingMinutes > 0 && changesRemaining > 0;
      }
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
      userVote,
      canChangeVote,
      timeRemainingMinutes,
      changesRemaining
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
    const { question, description, options, isActive, expiresAt } = req.body;

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
      // Validate duplicate options
      const optionTexts = options.map(opt => opt.text?.trim().toLowerCase()).filter(Boolean);
      const uniqueOptions = new Set(optionTexts);
      if (uniqueOptions.size !== optionTexts.length) {
        return res.status(400).json({ 
          message: 'Poll options must be unique' 
        });
      }
      
      poll.options = options.map(opt => ({
        id: opt.id || opt.text.toLowerCase().replace(/\s+/g, '-').substring(0, 50),
        text: opt.text.trim()
      }));
    }
    if (isActive !== undefined) poll.isActive = isActive;
    
    // Handle expiration date
    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') {
        poll.expiresAt = null;
      } else {
        const expirationDate = new Date(expiresAt);
        if (isNaN(expirationDate.getTime())) {
          return res.status(400).json({ 
            message: 'Invalid expiration date format' 
          });
        }
        if (expirationDate <= new Date()) {
          return res.status(400).json({ 
            message: 'Expiration date must be in the future' 
          });
        }
        poll.expiresAt = expirationDate;
      }
    }
    
    // Auto-deactivate if expired
    if (poll.expiresAt && new Date() >= poll.expiresAt) {
      poll.isActive = false;
    }

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

    // Deactivate expired polls first
    await Poll.deactivateExpired();

    const poll = await Poll.findOne({ post: postId });
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found for this post' });
    }

    let userVote = null;
    let canChangeVote = false;
    let timeRemainingMinutes = 0;
    let changesRemaining = 0;
    
    if (userId) {
      const vote = await PollVote.findOne({ poll: poll._id, user: userId });
      if (vote) {
        userVote = vote.optionId;
        
        // Check if user can still change vote
        const now = new Date();
        const firstVotedAt = vote.firstVotedAt || vote.createdAt;
        const timeSinceFirstVote = (now - firstVotedAt) / 1000 / 60; // minutes
        const maxChanges = vote.maxChanges || 2;
        const changeWindow = vote.changeWindowMinutes || 5;
        
        timeRemainingMinutes = Math.max(0, Math.ceil(changeWindow - timeSinceFirstVote));
        changesRemaining = Math.max(0, maxChanges - (vote.changeCount || 0));
        canChangeVote = timeRemainingMinutes > 0 && changesRemaining > 0;
      }
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
      userVote,
      canChangeVote,
      timeRemainingMinutes,
      changesRemaining
    });
  } catch (error) {
    console.error('Get poll by post error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch poll',
      error: error.message 
    });
  }
};

export const getPollAnalytics = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const poll = await Poll.findById(pollId).populate('post');
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check permissions - only author, collaborator, or admin
    const post = poll.post;
    const isAuthor = post.author.toString() === userId.toString();
    const isCollaborator = post.collaborators?.some(
      collab => collab.user.toString() === userId.toString()
    );

    if (!req.user.isAdmin() && !isAuthor && !isCollaborator) {
      return res.status(403).json({ 
        message: 'Only post author, collaborators, or admin can view analytics' 
      });
    }

    // Get all votes for this poll
    const votes = await PollVote.find({ poll: pollId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    // Calculate vote distribution over time
    const votesByDate = {};
    const votesByOption = {};
    const votesByHour = {};
    
    votes.forEach(vote => {
      const date = new Date(vote.createdAt).toISOString().split('T')[0];
      const hour = new Date(vote.createdAt).getHours();
      
      votesByDate[date] = (votesByDate[date] || 0) + 1;
      votesByHour[hour] = (votesByHour[hour] || 0) + 1;
      votesByOption[vote.optionId] = (votesByOption[vote.optionId] || 0) + 1;
    });

    // Get vote changes count
    const voteChanges = votes.filter(v => (v.changeCount || 0) > 0).length;

    const totalVotes = votes.length;
    const uniqueVoters = new Set(votes.map(v => v.user._id.toString())).size;

    res.json({
      poll: {
        id: poll._id,
        question: poll.question,
        createdAt: poll.createdAt,
        expiresAt: poll.expiresAt,
        isActive: poll.isActive
      },
      statistics: {
        totalVotes,
        uniqueVoters,
        voteChanges,
        averageVotesPerVoter: uniqueVoters > 0 ? (totalVotes / uniqueVoters).toFixed(2) : 0
      },
      distribution: {
        byDate: votesByDate,
        byHour: votesByHour,
        byOption: votesByOption
      },
      recentVotes: votes.slice(0, 50).map(vote => ({
        user: {
          username: vote.user?.username,
          email: vote.user?.email
        },
        optionId: vote.optionId,
        optionText: poll.options.find(opt => opt.id === vote.optionId)?.text,
        votedAt: vote.createdAt,
        changeCount: vote.changeCount || 0
      }))
    });
  } catch (error) {
    console.error('Get poll analytics error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch poll analytics',
      error: error.message 
    });
  }
};

export const exportPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;
    const format = req.query.format || 'json'; // 'json' or 'csv'
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required to export poll results' });
    }

    const poll = await Poll.findById(pollId).populate('post');
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check permissions - only author, collaborator, or admin can export
    const post = poll.post;
    const isAuthor = post.author.toString() === userId.toString();
    const isCollaborator = post.collaborators?.some(
      collab => collab.user.toString() === userId.toString()
    );

    if (!req.user.isAdmin() && !isAuthor && !isCollaborator) {
      return res.status(403).json({ 
        message: 'Only post author, collaborators, or admin can export poll results' 
      });
    }

    // Get all votes
    const votes = await PollVote.find({ poll: pollId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    const totalVotes = Array.from(poll.results?.values() || []).reduce((sum, count) => sum + count, 0);

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Username,Email,Option,Option Text,Voted At,Change Count\n';
      const csvRows = votes.map(vote => {
        const option = poll.options.find(opt => opt.id === vote.optionId);
        const username = vote.user?.username || 'Anonymous';
        const email = vote.user?.email || '';
        const optionText = option?.text || vote.optionId;
        const votedAt = new Date(vote.createdAt).toISOString();
        const changeCount = vote.changeCount || 0;
        
        // Escape commas and quotes in CSV
        const escapeCSV = (str) => {
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        
        return `${escapeCSV(username)},${escapeCSV(email)},${vote.optionId},${escapeCSV(optionText)},${votedAt},${changeCount}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="poll-${pollId}-results.csv"`);
      res.send(csvHeader + csvRows);
    } else {
      // Generate JSON
      const exportData = {
        poll: {
          id: poll._id,
          question: poll.question,
          description: poll.description,
          createdAt: poll.createdAt,
          expiresAt: poll.expiresAt,
          isActive: poll.isActive
        },
        results: Object.fromEntries(poll.results || []),
        totalVotes,
        votes: votes.map(vote => {
          const option = poll.options.find(opt => opt.id === vote.optionId);
          return {
            user: {
              username: vote.user?.username,
              email: vote.user?.email
            },
            optionId: vote.optionId,
            optionText: option?.text || vote.optionId,
            votedAt: vote.createdAt,
            changeCount: vote.changeCount || 0
          };
        })
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="poll-${pollId}-results.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export poll results error:', error);
    res.status(500).json({ 
      message: 'Failed to export poll results',
      error: error.message 
    });
  }
};

