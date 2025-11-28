import Post from '../models/post.js';
import logger from './logger.js';

/**
 * Auto-publish scheduled posts
 * This should be run periodically (e.g., every minute via cron or setInterval)
 */
export const publishScheduledPosts = async () => {
  try {
    const now = new Date();
    
    // Find posts that are scheduled and should be published
    const scheduledPosts = await Post.find({
      scheduledAt: { $lte: now },
      isPublished: false,
      scheduledAt: { $ne: null }
    });

    if (scheduledPosts.length === 0) {
      return { published: 0, message: 'No posts to publish' };
    }

    let publishedCount = 0;
    for (const post of scheduledPosts) {
      post.isPublished = true;
      post.publishedAt = post.scheduledAt || new Date();
      post.scheduledAt = null;
      await post.save();
      publishedCount++;
      logger.info(`Auto-published scheduled post: ${post.title} (${post._id})`);
    }

    logger.info(`Published ${publishedCount} scheduled post(s)`);
    return { published: publishedCount, message: `Published ${publishedCount} post(s)` };
  } catch (error) {
    logger.error('Error publishing scheduled posts:', error);
    throw error;
  }
};

/**
 * Start the scheduled jobs interval
 * Runs every minute to check for posts to publish
 */
export const startScheduledJobs = () => {
  // Run immediately on start
  publishScheduledPosts().catch(err => {
    logger.error('Error in initial scheduled posts check:', err);
  });

  // Then run every minute
  setInterval(() => {
    publishScheduledPosts().catch(err => {
      logger.error('Error in scheduled posts check:', err);
    });
  }, 60 * 1000); // 60 seconds

  logger.info('Scheduled jobs started (checking every minute for posts to publish)');
};

