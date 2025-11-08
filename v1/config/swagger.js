import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blog Management with Newsletter API',
      version: '1.0.0',
      description: 'A comprehensive RESTful API for managing a blog platform with integrated newsletter functionality',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3050',
        description: 'Development server',
      },
      {
        url: 'https://blog-management-sx5c.onrender.com',
        description: 'Production server (Deployed)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'author'],
              description: 'User role',
            },
          },
        },
        Post: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Post ID',
            },
            title: {
              type: 'string',
              description: 'Post title',
              example: 'Getting Started with Node.js',
            },
            content: {
              type: 'string',
              description: 'Post content',
            },
            excerpt: {
              type: 'string',
              description: 'Post excerpt',
            },
            slug: {
              type: 'string',
              description: 'Post slug',
            },
            author: {
              $ref: '#/components/schemas/User',
            },
            category: {
              type: 'string',
              description: 'Category ID',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Post tags',
            },
            isPublished: {
              type: 'boolean',
              description: 'Publication status',
            },
            publishedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Publication date',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Detailed error messages',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Posts',
        description: 'Blog post management endpoints',
      },
      {
        name: 'Categories',
        description: 'Category management endpoints',
      },
      {
        name: 'Comments',
        description: 'Comment management endpoints',
      },
      {
        name: 'Interactions',
        description: 'Post interaction endpoints (like, dislike, share)',
      },
      {
        name: 'Newsletter',
        description: 'Newsletter subscription and management endpoints',
      },
      {
        name: 'Search',
        description: 'Search and discovery endpoints',
      },
      {
        name: 'Dashboard',
        description: 'User dashboard endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin management endpoints',
      },
      {
        name: 'Images',
        description: 'Image upload and management endpoints',
      },
      {
        name: 'Authors',
        description: 'Author application and management endpoints',
      },
    ],
  },
  apis: ['./v1/routes/*.js', './app.js'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

