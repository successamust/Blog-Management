import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../v1/config/db.js';
import Category from '../v1/models/category.js';
import logger from '../v1/utils/logger.js';

dotenv.config();

const palette = [
  '#2563EB',
  '#0EA5E9',
  '#14B8A6',
  '#22C55E',
  '#84CC16',
  '#FACC15',
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#A855F7',
  '#6366F1',
  '#0EA5E9',
  '#2DD4BF',
  '#10B981',
  '#FBBF24',
  '#FB7185',
];

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const baseCategories = [
  {
    name: 'Technology & Gadgets',
    description:
      'Consumer tech launches, device reviews, and future trends inspired by TechCrunch, The Verge, and Wired.',
  },
  {
    name: 'Software Development',
    description:
      'Programming tutorials, frameworks, and tooling guides similar to Smashing Magazine and freeCodeCamp.',
  },
  {
    name: 'AI & Data Science',
    description:
      'Machine learning breakthroughs and data insights that mirror coverage on Towards Data Science and Google AI.',
  },
  {
    name: 'Startups & Entrepreneurship',
    description:
      'Founder stories, fundraising tips, and YC-style playbooks you see on IndieHackers and First Round Review.',
  },
  {
    name: 'Business & Finance',
    description:
      'Macroeconomic analysis, company strategy, and personal finance content from Bloomberg and Harvard Business Review.',
  },
  {
    name: 'Crypto & Web3',
    description:
      'Blockchain use cases, DeFi news, and token insights inspired by CoinDesk, The Block, and Decrypt.',
  },
  {
    name: 'Marketing & Growth',
    description:
      'Lifecycle marketing tactics, SEO, and brand storytelling like you find on HubSpot, Buffer, and Neil Patel.',
  },
  {
    name: 'Productivity & Lifestyle',
    description:
      'Habits, work-life balance, and minimalism content reminiscent of Lifehacker and Zen Habits.',
  },
  {
    name: 'Health & Wellness',
    description:
      'Holistic health trends, preventative care, and longevity research featured on Well+Good and MindBodyGreen.',
  },
  {
    name: 'Fitness & Nutrition',
    description:
      "Training plans, workout science, and meal prep ideas like those on Men's Health and Women's Health.",
  },
  {
    name: 'Mental Health',
    description:
      'Mindfulness practices, therapy resources, and burnout prevention from Calm, Headspace, and Verywell Mind.',
  },
  {
    name: 'Travel & Adventure',
    description:
      'Destination guides, itineraries, and travel hacks inspired by Lonely Planet and Conde Nast Traveler.',
  },
  {
    name: 'Food & Recipes',
    description:
      'Restaurant trends, chef tips, and home cooking staples similar to Bon Appetit and Serious Eats.',
  },
  {
    name: 'Parenting & Family',
    description:
      'Pregnancy advice, parenting wins, and family budgeting ideas like those on BabyCenter and Scary Mommy.',
  },
  {
    name: 'Education & Learning',
    description:
      'Learning science, edtech tools, and classroom innovation reflected on Edutopia and Coursera blogs.',
  },
  {
    name: 'Career & Leadership',
    description:
      'Management playbooks, career pivots, and people ops trends similar to LinkedIn Pulse and Forbes.',
  },
  {
    name: 'Personal Development',
    description:
      'Goal setting, mindset shifts, and habit design inspired by James Clear, Tiny Buddha, and Farnam Street.',
  },
  {
    name: 'Sustainability & Climate',
    description:
      'Climate tech, circular economy, and ESG reporting like coverage on Grist and Treehugger.',
  },
  {
    name: 'Science & Innovation',
    description:
      'Breakthrough research, space, and biotech summaries similar to Scientific American and Nature.',
  },
  {
    name: 'Gaming & Esports',
    description:
      'Game reviews, esports news, and streaming culture from IGN, Kotaku, and Polygon.',
  },
  {
    name: 'Entertainment & Pop Culture',
    description:
      'Streaming launches, celebrity news, and box office analysis like Variety and Hollywood Reporter.',
  },
  {
    name: 'Sports & Outdoors',
    description:
      'Pro sports recaps, endurance training, and outdoor gear reviews inspired by ESPN and Outside.',
  },
  {
    name: 'Fashion & Beauty',
    description:
      'Runway trends, street style, and skincare tips similar to Vogue, Refinery29, and Into The Gloss.',
  },
  {
    name: 'Home & Interior Design',
    description:
      'Home tours, decor how-tos, and organization ideas like Apartment Therapy and Architectural Digest.',
  },
  {
    name: 'DIY & Crafts',
    description:
      'Maker projects, upcycling, and step-by-step tutorials inspired by Instructables and A Beautiful Mess.',
  },
  {
    name: 'Gardening & Homestead',
    description:
      'Urban gardening, permaculture, and backyard farming content like Gardenista and The Spruce.',
  },
  {
    name: 'Photography & Videography',
    description:
      'Gear reviews, shooting techniques, and editing workflows featured on PetaPixel and Fstoppers.',
  },
  {
    name: 'Pets & Animals',
    description:
      'Pet care tips, adoption stories, and training guides reminiscent of The Dodo and Rover.',
  },
  {
    name: 'Automotive & Mobility',
    description:
      'EV news, car culture, and transportation policy similar to Top Gear, Jalopnik, and Electrek.',
  },
  {
    name: 'Real Estate & Investing',
    description:
      'Housing market insights, property management, and REIT analysis like BiggerPockets and Zillow.',
  },
  {
    name: 'News & Politics',
    description:
      'Policy explainers, elections, and geopolitical analysis like Axios, Politico, and The Economist.',
  },
  {
    name: 'Culture & Society',
    description:
      'Social commentary, identity, and civic discourse similar to The Atlantic and Vox.',
  },
];

const categories = baseCategories.map((category, index) => ({
  ...category,
  slug: slugify(category.name),
  color: category.color || palette[index % palette.length],
  isActive: category.isActive ?? true,
}));

const seedCategories = async () => {
  try {
    await connectDB();

    logger.info(`Preparing to upsert ${categories.length} categories`);

    const operations = categories.map((category) => ({
      updateOne: {
        filter: { slug: category.slug },
        update: {
          $setOnInsert: category,
        },
        upsert: true,
      },
    }));

    const result = await Category.bulkWrite(operations, { ordered: false });
    const insertedCount = Object.keys(result.upsertedIds || {}).length;
    const skippedCount = categories.length - insertedCount;

    logger.info('Category seeding complete', {
      total: categories.length,
      inserted: insertedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    logger.error('Category seeding failed', { error: error.message });
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit();
  }
};

seedCategories();

