import validator from 'validator';

export const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (username && username.length > 30) {
    errors.push('Username must be less than 30 characters');
  }

  if (!email || !validator.isEmail(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors 
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validator.isEmail(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors 
    });
  }

  next();
};

export const validatePost = (req, res, next) => {
  const { title, content } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (title && title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!content || content.trim().length === 0) {
    errors.push('Content is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors 
    });
  }

  next();
};

export const validateComment = (req, res, next) => {
  const { content } = req.body;
  const errors = [];

  if (!content || content.trim().length === 0) {
    errors.push('Comment content is required');
  }

  if (content && content.length > 1000) {
    errors.push('Comment must be less than 1000 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors 
    });
  }

  next();
};

export const validateCategory = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Category name is required');
  }

  if (name && name.length > 50) {
    errors.push('Category name must be less than 50 characters');
  }

  if (description && description.length > 200) {
    errors.push('Description must be less than 200 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors 
    });
  }

  next();
};

export const validatePasswordReset = (req, res, next) => {
  const { email, token, password, currentPassword, newPassword } = req.body;
  const errors = [];

  if (req.path.includes('forgot-password')) {
    if (!email || !validator.isEmail(email)) {
      errors.push('Please enter a valid email address');
    }
  }

  if (req.path.includes('reset-password')) {
    if (!token) {
      errors.push('Reset token is required');
    }
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
  }

  if (req.path.includes('change-password')) {
    if (!currentPassword) {
      errors.push('Current password is required');
    }
    if (!newPassword || newPassword.length < 6) {
      errors.push('New password must be at least 6 characters');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors 
    });
  }

  next();
};

export const validateAuthorApplication = (req, res, next) => {
    const { message, bio, expertise, website } = req.body;
    const errors = [];
  
    if (!message || message.trim().length === 0) {
      errors.push('Application message is required');
    } else if (message.length < 10) {
      errors.push('Application message must be at least 10 characters long');
    } else if (message.length > 1000) {
      errors.push('Application message must be less than 1000 characters');
    }
  
    if (bio && bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }
  
    if (expertise && !Array.isArray(expertise)) {
      errors.push('Expertise must be an array of strings');
    } else if (expertise && expertise.length > 10) {
      errors.push('You can only select up to 10 areas of expertise');
    } else if (expertise) {
      expertise.forEach((exp, index) => {
        if (typeof exp !== 'string') {
          errors.push(`Expertise item at position ${index + 1} must be a string`);
        } else if (exp.length > 50) {
          errors.push(`Expertise item "${exp}" must be less than 50 characters`);
        }
      });
    }
  
    if (website && !validator.isURL(website)) {
      errors.push('Please provide a valid website URL');
    }
  
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }
  
    next();
  };