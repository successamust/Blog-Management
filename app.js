import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import router from './v1/index.js'
import connectDB from './v1/config/db.js'
import logger from './v1/utils/logger.js'
import { apiLimiter } from './v1/middleware/rateLimiter.js'
import swaggerSpec from './v1/config/swagger.js'

const app = express()
dotenv.config();

// Connect to database
connectDB()
  .then(() => logger.info('Database connected successfully'))
  .catch(err => logger.error('Database connection failed:', err));

// Middleware
app.use(cors({origin: "*"}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  req._startTime = Date.now();
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  res.on('finish', () => {
    const ms = Date.now() - req._startTime;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`, {
      statusCode: res.statusCode,
      responseTime: ms,
    });
  });
  next();
});

// Apply rate limiting to all API routes
app.use('/v1', apiLimiter);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Blog API Documentation',
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is running!',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/v1', router);

// 404 handler
app.use((req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    url: req.originalUrl,
  });
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
  
  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3050;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API Documentation available at ${baseUrl}/api-docs`);
    if (process.env.BASE_URL) {
      logger.info(`Production API: ${process.env.BASE_URL}/v1`);
    } else {
      logger.info(`Local API: http://localhost:${PORT}/v1`);
    }
  });
}

export default app;
