import Template from '../models/template.js';
import { validationResult } from 'express-validator';

// Default templates that are initialized on first use
const DEFAULT_TEMPLATES = [
  {
    name: 'Tech Review',
    title: '[Product Name] Review: Is It Worth It?',
    excerpt: 'A comprehensive review of [Product Name], covering features, performance, and value for money.',
    content: '<h2>Introduction</h2><p>In this review, we\'ll take an in-depth look at [Product Name] and see if it lives up to the hype.</p><h2>Key Features</h2><ul><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li></ul><h2>Performance</h2><p>How does it perform in real-world usage?</p><h2>Pros and Cons</h2><h3>Pros:</h3><ul><li>Advantage 1</li><li>Advantage 2</li></ul><h3>Cons:</h3><ul><li>Disadvantage 1</li><li>Disadvantage 2</li></ul><h2>Verdict</h2><p>Final thoughts and recommendation.</p>',
    category: 'Technology',
    tags: 'review, technology, product',
    isDefault: true,
  },
  {
    name: 'Tutorial / How-to Guide',
    title: 'How to [Task]: A Step-by-Step Guide',
    excerpt: 'Learn how to [Task] with this comprehensive step-by-step tutorial.',
    content: '<h2>What You\'ll Learn</h2><p>By the end of this guide, you\'ll be able to [Task].</p><h2>Prerequisites</h2><ul><li>Requirement 1</li><li>Requirement 2</li></ul><h2>Step 1: [First Step]</h2><p>Detailed instructions for the first step.</p><h2>Step 2: [Second Step]</h2><p>Detailed instructions for the second step.</p><h2>Step 3: [Third Step]</h2><p>Detailed instructions for the third step.</p><h2>Tips and Tricks</h2><ul><li>Tip 1</li><li>Tip 2</li></ul><h2>Conclusion</h2><p>Summary and next steps.</p>',
    category: 'Tutorial',
    tags: 'tutorial, how-to, guide',
    isDefault: true,
  },
  {
    name: 'News / Update',
    title: '[Topic] Update: What You Need to Know',
    excerpt: 'Breaking news and latest updates on [Topic].',
    content: '<h2>Breaking News</h2><p>[Main news point]</p><h2>Key Details</h2><p>Important information about the update.</p><h2>Impact</h2><p>What this means for [relevant audience].</p><h2>What\'s Next</h2><p>Future implications and what to expect.</p>',
    category: 'News',
    tags: 'news, update, breaking',
    isDefault: true,
  },
  {
    name: 'Opinion / Editorial',
    title: 'My Take on [Topic]: Why [Opinion]',
    excerpt: 'A personal perspective on [Topic] and why it matters.',
    content: '<h2>Introduction</h2><p>My thoughts on [Topic] and why I believe [Opinion].</p><h2>The Current State</h2><p>What\'s happening now and why it\'s relevant.</p><h2>My Perspective</h2><p>Why I think [Opinion] and the reasoning behind it.</p><h2>Supporting Evidence</h2><p>Examples and evidence that support this view.</p><h2>Counterarguments</h2><p>Addressing potential objections.</p><h2>Conclusion</h2><p>Final thoughts and call to action.</p>',
    category: 'Opinion',
    tags: 'opinion, editorial, perspective',
    isDefault: true,
  },
  {
    name: 'Product Review',
    title: '[Product Name] Review: Honest Thoughts After [Time Period]',
    excerpt: 'An honest review of [Product Name] after using it for [Time Period].',
    content: '<h2>Overview</h2><p>What is [Product Name] and who is it for?</p><h2>First Impressions</h2><p>Initial thoughts upon unboxing/using.</p><h2>Design and Build Quality</h2><p>Assessment of design and construction.</p><h2>Features and Functionality</h2><ul><li>Feature 1: Description</li><li>Feature 2: Description</li></ul><h2>Performance</h2><p>How well does it work in practice?</p><h2>Value for Money</h2><p>Is it worth the price?</p><h2>Final Verdict</h2><p>Overall rating and recommendation.</p>',
    category: 'Review',
    tags: 'review, product, honest',
    isDefault: true,
  },
  {
    name: 'List / Best Of',
    title: 'Top [Number] [Items] for [Purpose] in [Year]',
    excerpt: 'A curated list of the best [Items] for [Purpose].',
    content: '<h2>Introduction</h2><p>Why this list matters and how we selected these items.</p><h2>1. [Item Name]</h2><p>Description and why it made the list.</p><h2>2. [Item Name]</h2><p>Description and why it made the list.</p><h2>3. [Item Name]</h2><p>Description and why it made the list.</p><h2>Honorable Mentions</h2><ul><li>Item that almost made it</li></ul><h2>Conclusion</h2><p>Summary and final thoughts.</p>',
    category: 'List',
    tags: 'list, best-of, top',
    isDefault: true,
  },
  {
    name: 'Case Study',
    title: 'Case Study: How [Company/Person] Achieved [Result]',
    excerpt: 'An in-depth look at how [Company/Person] achieved [Result].',
    content: '<h2>Background</h2><p>The situation and challenges faced.</p><h2>The Challenge</h2><p>Specific problems that needed to be solved.</p><h2>The Solution</h2><p>What was done to address the challenge.</p><h2>Implementation</h2><p>How the solution was put into practice.</p><h2>Results</h2><p>Measurable outcomes and achievements.</p><h2>Key Takeaways</h2><ul><li>Lesson 1</li><li>Lesson 2</li></ul><h2>Conclusion</h2><p>What we can learn from this case study.</p>',
    category: 'Case Study',
    tags: 'case-study, analysis, success',
    isDefault: true,
  },
  {
    name: 'Comparison',
    title: '[Product A] vs [Product B]: Which One Should You Choose?',
    excerpt: 'A detailed comparison between [Product A] and [Product B] to help you decide.',
    content: '<h2>Introduction</h2><p>Why compare these two options and who should read this.</p><h2>Overview</h2><h3>[Product A]</h3><p>Brief description.</p><h3>[Product B]</h3><p>Brief description.</p><h2>Feature Comparison</h2><table><tr><th>Feature</th><th>[Product A]</th><th>[Product B]</th></tr><tr><td>Feature 1</td><td>Details</td><td>Details</td></tr></table><h2>Pricing</h2><p>Cost comparison.</p><h2>Pros and Cons</h2><h3>[Product A]</h3><p>Advantages and disadvantages.</p><h3>[Product B]</h3><p>Advantages and disadvantages.</p><h2>Which One Should You Choose?</h2><p>Recommendation based on different use cases.</p>',
    category: 'Comparison',
    tags: 'comparison, vs, review',
    isDefault: true,
  },
];

// Initialize default templates if they don't exist
const initializeDefaultTemplates = async (adminUserId) => {
  try {
    const existingDefaults = await Template.countDocuments({ isDefault: true });
    if (existingDefaults === 0) {
      const defaultTemplates = DEFAULT_TEMPLATES.map(template => ({
        ...template,
        createdBy: adminUserId,
      }));
      await Template.insertMany(defaultTemplates);
      console.log('Default templates initialized');
    }
  } catch (error) {
    console.error('Error initializing default templates:', error);
  }
};

// Auto-initialize on server startup or first access (if no admin available, use system user)
const autoInitializeDefaults = async () => {
  try {
    const existingDefaults = await Template.countDocuments({ isDefault: true });
    if (existingDefaults === 0) {
      // Try to find an admin user, otherwise use null (will require adminUserId on next access)
      const User = (await import('../models/user.js')).default;
      const adminUser = await User.findOne({ role: 'admin' });
      const adminUserId = adminUser?._id || null;
      
      if (adminUserId) {
        await initializeDefaultTemplates(adminUserId);
      } else {
        // If no admin exists yet, we'll initialize on first admin access
        console.log('No admin user found. Default templates will initialize on first admin access.');
      }
    }
  } catch (error) {
    console.error('Error auto-initializing default templates:', error);
  }
};

// Get all templates (default + user's custom templates)
export const getAllTemplates = async (req, res) => {
  try {
    const userId = req.user?._id;

    // Auto-initialize default templates if they don't exist
    const defaultCount = await Template.countDocuments({ isDefault: true });
    if (defaultCount === 0) {
      // If admin is accessing, use their ID; otherwise try to find any admin
      if (req.user && req.user.role === 'admin') {
        await initializeDefaultTemplates(req.user._id);
      } else {
        // Try to find an admin user to initialize
        const User = (await import('../models/user.js')).default;
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
          await initializeDefaultTemplates(adminUser._id);
        }
      }
    }

    // Get default templates (available to all)
    const defaultTemplates = await Template.find({ isDefault: true })
      .populate('createdBy', 'username')
      .sort({ createdAt: 1 });

    // Get user's custom templates (if authenticated)
    let customTemplates = [];
    if (userId) {
      customTemplates = await Template.find({
        isDefault: false,
        createdBy: userId,
      })
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 });
    }

    res.json({
      templates: [...defaultTemplates, ...customTemplates],
      defaults: defaultTemplates,
      custom: customTemplates,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      message: 'Failed to fetch templates',
    });
  }
};

// Get template by ID
export const getTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await Template.findById(templateId).populate('createdBy', 'username');

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check access: default templates are public, custom templates only for creator
    if (!template.isDefault && template.createdBy.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      message: 'Failed to fetch template',
    });
  }
};

// Create template
export const createTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, title, excerpt, content, category, tags, isDefault } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    // Only admins can create default templates
    const willBeDefault = isDefault === true && req.user.role === 'admin';
    
    // Check if template with same name exists
    const existingTemplate = await Template.findOne({
      name: name.trim(),
      ...(willBeDefault 
        ? { isDefault: true } 
        : { createdBy: req.user._id, isDefault: false }
      ),
    });

    if (existingTemplate) {
      return res.status(400).json({
        message: willBeDefault
          ? 'A default template with this name already exists'
          : 'You already have a template with this name',
      });
    }

    const template = new Template({
      name: name.trim(),
      title: title?.trim() || '',
      excerpt: excerpt?.trim() || '',
      content: content || '',
      category: category?.trim() || '',
      tags: tags?.trim() || '',
      isDefault: willBeDefault,
      createdBy: req.user._id,
    });

    await template.save();
    await template.populate('createdBy', 'username');

    res.status(201).json({
      message: willBeDefault
        ? 'Default template created successfully (available to all users)'
        : 'Template created successfully',
      template,
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      message: 'Failed to create template',
    });
  }
};

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { templateId } = req.params;
    const { name, title, excerpt, content, category, tags, isDefault } = req.body;

    const template = await Template.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check permissions
    if (template.isDefault) {
      // Only admins can edit default templates
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Only admins can edit default templates',
        });
      }
    } else {
      // Only creator can edit custom templates
      if (template.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'You can only edit your own templates',
        });
      }
      // Cannot convert custom template to default via update
      if (isDefault === true) {
        return res.status(400).json({
          message: 'Cannot convert custom template to default. Create a new default template instead.',
        });
      }
    }

    // Update fields
    if (name !== undefined) template.name = name.trim();
    if (title !== undefined) template.title = title?.trim() || '';
    if (excerpt !== undefined) template.excerpt = excerpt?.trim() || '';
    if (content !== undefined) template.content = content || '';
    if (category !== undefined) template.category = category?.trim() || '';
    if (tags !== undefined) template.tags = tags?.trim() || '';
    // Only allow changing isDefault for default templates (to false) or if admin is creating new default
    // But we don't allow converting custom to default via update

    await template.save();
    await template.populate('createdBy', 'username');

    res.json({
      message: template.isDefault
        ? 'Default template updated (applies to all users)'
        : 'Template updated successfully',
      template,
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      message: 'Failed to update template',
    });
  }
};

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await Template.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check permissions
    if (template.isDefault) {
      // Only admins can delete default templates
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Only admins can delete default templates',
        });
      }
    } else {
      // Only creator can delete custom templates
      if (template.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'You can only delete your own templates',
        });
      }
    }

    await Template.findByIdAndDelete(templateId);

    res.json({
      message: template.isDefault
        ? 'Default template deleted (removed for all users)'
        : 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      message: 'Failed to delete template',
    });
  }
};

// Increment usage count (when template is used)
export const useTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await Template.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check access
    if (!template.isDefault && template.createdBy.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    template.usageCount = (template.usageCount || 0) + 1;
    await template.save();

    res.json({
      message: 'Template usage recorded',
      template,
    });
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({
      message: 'Failed to record template usage',
    });
  }
};

// Initialize default templates (admin only)
export const initializeDefaults = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can initialize default templates',
      });
    }

    await initializeDefaultTemplates(req.user._id);

    res.json({
      message: 'Default templates initialized successfully',
    });
  } catch (error) {
    console.error('Initialize defaults error:', error);
    res.status(500).json({
      message: 'Failed to initialize default templates',
    });
  }
};

