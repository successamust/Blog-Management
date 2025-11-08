# Blog Management with Newsletter API

> A comprehensive RESTful API for managing a blog platform with integrated newsletter functionality. Built with Node.js, Express, and MongoDB.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.5-green.svg)](https://www.mongodb.com/)

---

## 📑 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
  - [Base URL](#base-url)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Post Endpoints](#post-endpoints)
  - [Category Endpoints](#category-endpoints)
  - [Comment Endpoints](#comment-endpoints)
  - [Interaction Endpoints](#interaction-endpoints)
  - [Newsletter Endpoints](#newsletter-endpoints)
  - [Search Endpoints](#search-endpoints)
  - [Dashboard Endpoints](#dashboard-endpoints)
  - [Admin Endpoints](#admin-endpoints)
  - [Image Endpoints](#image-endpoints)
- [Authentication](#-authentication)
- [Usage Examples](#-usage-examples)
- [Database Models](#-database-models)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Security](#-security)
- [Error Handling](#-error-handling)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- Cloudinary account
- Email service (SendGrid/Resend/Nodemailer)

### 5-Minute Setup

```bash
# 1. Clone and install
git clone <repository-url>
cd "Blog Management with Newsletter"
npm install

# 2. Create .env file
cp .env.example .env  # Or create manually

# 3. Configure environment variables (see Configuration section)
# 4. Start the server
npm run dev

# 5. Test the API
# Local development:
curl http://localhost:3050/health

# Production (deployed):
curl https://blog-management-sx5c.onrender.com/health

# 6. Access API Documentation
# Local development:
# Open http://localhost:3050/api-docs in your browser

# Production (deployed):
# Open https://blog-management-sx5c.onrender.com/api-docs in your browser
```

**Expected Response:**
```json
{"status":"ok","uptime":<seconds>}
```

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Role-based access control (User/Admin)
- Password reset (forgot/reset/change)
- User profile management

### 📝 Blog Post Management
- CRUD operations for posts
- SEO-friendly slugs
- Featured images (Cloudinary)
- Publishing workflow
- Categories and tags
- Related posts
- View tracking & analytics

### 💬 User Engagement
- Like/Dislike posts
- Share functionality
- Comments with replies
- Reading history
- Engagement metrics

### 📧 Newsletter System
- Email subscriptions
- Newsletter broadcasting
- Auto new-post notifications
- Subscriber management
- Unsubscribe handling

### 🔍 Search & Discovery
- Full-text search
- Popular tags
- Search suggestions
- Tag-based filtering

### 🎨 Additional Features
- Image upload/management
- User dashboard
- Admin dashboard
- Category management
- Input validation
- Security middleware

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js 5.1.0 |
| **Database** | MongoDB with Mongoose 7.5.0 |
| **Authentication** | JWT (jsonwebtoken 9.0.2) |
| **Password Hashing** | bcryptjs 2.4.3 |
| **Image Storage** | Cloudinary 2.8.0, Multer 2.0.2 |
| **Email Services** | SendGrid, Nodemailer, Resend |
| **Validation** | express-validator 7.0.1, validator 13.15.20 |
| **Security** | CORS, dotenv, crypto |

---

## 📦 Installation

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd "Blog Management"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3050

# Database
MONGODB_URL=mongodb://localhost:27017/blog-management
# Or for MongoDB Atlas:
# MONGODB_URL=mongodb+srv://exampleusername:examplepassword@cluster.mongodb.net/...

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Base URL (for email links and password reset)
BASE_URL=https://blog-management-sx5c.onrender.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service Configuration (Choose one or more)
# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Nodemailer (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### Step 4: Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Step 5: Verify Installation

```bash
# Local development:
curl http://localhost:3050/health

# Production (deployed):
curl https://blog-management-sx5c.onrender.com/health
```

---

## 📡 API Documentation

### Base URL

**Production (Deployed):**
```
https://blog-management-sx5c.onrender.com/v1
```

**Local Development:**
```
http://localhost:3050/v1
```

> **Note:** All endpoints below are relative to the base URL.  
> **Production Example:** `/auth/register` = `https://blog-management-sx5c.onrender.com/v1/auth/register`  
> **Local Example:** `/auth/register` = `http://localhost:3050/v1/auth/register`

---

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register new user | ❌ |
| `POST` | `/auth/login` | Login user | ❌ |
| `GET` | `/auth/me` | Get current user | ✅ |
| `GET` | `/auth/profile/:userId` | Get user profile | ❌ |
| `PUT` | `/auth/update/:userId` | Update profile | ✅ |
| `DELETE` | `/auth/delete/:userId` | Delete user | ✅ |
| `POST` | `/auth/forgot-password` | Request password reset | ❌ |
| `POST` | `/auth/reset-password` | Reset password | ❌ |
| `POST` | `/auth/change-password` | Change password | ✅ |
| `GET` | `/auth/validate-reset-token` | Validate reset token | ❌ |
| `GET` | `/auth/allusers` | Get all users | 🔒 Admin |
| `GET` | `/auth/stats` | User statistics | 🔒 Admin |

---

### Post Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/posts` | Get all published posts | ❌ |
| `GET` | `/posts/:slug` | Get post by slug | ❌ |
| `GET` | `/posts/:postId/related` | Get related posts | ❌ |
| `POST` | `/posts/create` | Create new post | 🔒 Admin |
| `PUT` | `/posts/update/:id` | Update post | 🔒 Admin |
| `DELETE` | `/posts/delete/:id` | Delete post | 🔒 Admin |

---

### Category Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/categories` | Get all categories | ❌ |
| `GET` | `/categories/stats` | Category statistics | ❌ |
| `GET` | `/categories/:slug` | Get category by slug | ❌ |
| `GET` | `/categories/:slug/posts` | Get posts by category | ❌ |
| `POST` | `/categories/create` | Create category | 🔒 Admin |
| `PUT` | `/categories/update/:categoryId` | Update category | 🔒 Admin |
| `DELETE` | `/categories/delete/:categoryId` | Delete category | 🔒 Admin |

---

### Comment Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/:postId/comments` | Get post comments | ❌ |
| `POST` | `/create/:postId` | Create comment | ✅ |
| `PUT` | `/update/:commentId` | Update comment | ✅ |
| `DELETE` | `/delete/:commentId` | Delete comment | ✅ |
| `POST` | `/like/:commentId` | Like comment | ✅ |

---

### Interaction Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/:postId/like` | Like post | ✅ |
| `POST` | `/:postId/dislike` | Dislike post | ✅ |
| `POST` | `/:postId/share` | Share post | ❌ |
| `GET` | `/:postId/interactions` | Get interactions | ❌ |
| `GET` | `/me/likes` | Get user's liked posts | ✅ |

---

### Newsletter Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/subscribe` | Subscribe to newsletter | ❌ |
| `POST` | `/unsubscribe` | Unsubscribe | ❌ |
| `POST` | `/send` | Send newsletter | 🔒 Admin |
| `POST` | `/notify-new-post/:postId` | Notify new post | 🔒 Admin |
| `GET` | `/stats` | Subscriber statistics | 🔒 Admin |
| `GET` | `/subscribers` | Get all subscribers | 🔒 Admin |

---

### Search Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Search posts | ❌ |
| `GET` | `/tags/popular` | Get popular tags | ❌ |
| `GET` | `/suggestions` | Get search suggestions | ❌ |

---

### Dashboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Dashboard overview | ✅ |
| `GET` | `/posts` | User's posts | ✅ |
| `GET` | `/comments` | User's comments | ✅ |
| `GET` | `/likes` | User's liked posts | ✅ |
| `GET` | `/history` | Reading history | ✅ |

---

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/promote/:userId` | Promote to admin | 🔒 Admin |
| `POST` | `/demote/:userId` | Demote from admin | 🔒 Admin |

---

### Image Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/upload` | Upload image | 🔒 Admin |
| `GET` | `/` | Get image info | 🔒 Admin |
| `DELETE` | `/delete` | Delete image | 🔒 Admin |

---

**Legend:**
- ❌ No authentication required
- ✅ Authentication required
- 🔒 Admin only

---

## 🔐 Authentication

The API uses **JWT (JSON Web Tokens)** for authentication.

### How to Authenticate

Include the token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

### Get Your Token

1. **Register** a new user or **Login** with existing credentials
2. The response includes a `token` field
3. Use this token in subsequent requests

---

## 💡 Usage Examples

### Register User

**Production:**
```bash
curl -X POST https://blog-management-sx5c.onrender.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Local Development:**
```bash
curl -X POST http://localhost:3050/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login

**Production:**
```bash
curl -X POST https://blog-management-sx5c.onrender.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Local Development:**
```bash
curl -X POST http://localhost:3050/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Create Post (Admin)

**Production:**
```bash
curl -X POST https://blog-management-sx5c.onrender.com/v1/posts/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "title": "Getting Started with Node.js",
    "content": "This is a comprehensive guide...",
    "excerpt": "Learn the basics of Node.js",
    "category": "<category_id>",
    "tags": ["nodejs", "javascript", "backend"],
    "isPublished": true
  }'
```

**Local Development:**
```bash
curl -X POST http://localhost:3050/v1/posts/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "title": "Getting Started with Node.js",
    "content": "This is a comprehensive guide...",
    "excerpt": "Learn the basics of Node.js",
    "category": "<category_id>",
    "tags": ["nodejs", "javascript", "backend"],
    "isPublished": true
  }'
```

### Subscribe to Newsletter

**Production:**
```bash
curl -X POST https://blog-management-sx5c.onrender.com/v1/newsletters/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com"
  }'
```

**Local Development:**
```bash
curl -X POST http://localhost:3050/v1/newsletters/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com"
  }'
```

### Search Posts

**Production:**
```bash
curl "https://blog-management-sx5c.onrender.com/v1/search?q=nodejs&limit=10&page=1"
```

**Local Development:**
```bash
curl "http://localhost:3050/v1/search?q=nodejs&limit=10&page=1"
```

### Like a Post

**Production:**
```bash
curl -X POST https://blog-management-sx5c.onrender.com/v1/interactions/:postId/like \
  -H "Authorization: Bearer <user_token>"
```

**Local Development:**
```bash
curl -X POST http://localhost:3050/v1/interactions/:postId/like \
  -H "Authorization: Bearer <user_token>"
```

### Password Reset Flow

**1. Request Reset:**

**Production:**
```bash
curl -X POST https://blog-management-sx5c.onrender.com/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Local Development:**
```bash
curl -X POST http://localhost:3050/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**2. Reset Password:**

**Production:**
```bash
curl -X POST https://blog-management-sx5c.onrender.com/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "newpassword123"
  }'
```

**Local Development:**
```bash
curl -X POST http://localhost:3050/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "newpassword123"
  }'
```

**3. Change Password (Authenticated):**

**Production:**
```bash
curl -X POST https://blog-management-sx5c.onrender.com/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_token>" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword123"
  }'
```

**Local Development:**
```bash
curl -X POST http://localhost:3050/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_token>" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword123"
  }'
```

---

## 🗄️ Database Models

### User Model
```javascript
{
  username: String (3-30 chars, unique, required),
  email: String (unique, required),
  password: String (hashed),
  role: Enum ['user', 'admin'],
  isActive: Boolean (default: true),
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastPasswordChange: Date
}
```

### Post Model
```javascript
{
  title: String (required),
  content: String (required),
  excerpt: String (optional),
  slug: String (unique, auto-generated),
  author: ObjectId (ref: User),
  category: ObjectId (ref: Category),
  tags: [String],
  featuredImage: String,
  isPublished: Boolean (default: false),
  publishedAt: Date,
  likes: [ObjectId] (ref: User),
  dislikes: [ObjectId] (ref: User),
  shares: Number (default: 0),
  viewCount: Number (default: 0),
  engagementRate: Number (calculated)
}
```

### Category Model
```javascript
{
  name: String (required),
  slug: String (unique),
  description: String (optional)
}
```

### Comment Model
```javascript
{
  content: String (required, max 1000 chars),
  author: ObjectId (ref: User),
  post: ObjectId (ref: Post),
  parentComment: ObjectId (ref: Comment, optional),
  isApproved: Boolean (default: true),
  likes: [ObjectId] (ref: User)
}
```

### Subscriber Model
```javascript
{
  email: String (unique, required),
  isActive: Boolean (default: true),
  subscriptionDate: Date
}
```

---

## 📁 Project Structure

```
Blog Management with Newsletter/
├── app.js                    # Main entry point
├── package.json              # Dependencies
├── .env                      # Environment variables
└── v1/
    ├── index.js              # API v1 router
    ├── config/
    │   └── db.js             # MongoDB connection
    ├── controllers/          # Route controllers
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── categoryController.js
    │   ├── commentController.js
    │   ├── dashboardController.js
    │   ├── imageController.js
    │   ├── interactionController.js
    │   ├── newsletterController.js
    │   ├── passwordController.js
    │   ├── postController.js
    │   └── searchController.js
    ├── middleware/
    │   ├── protect.js        # Auth & authorization
    │   └── validation.js    # Custom validation
    ├── models/               # Mongoose models
    │   ├── category.js
    │   ├── comment.js
    │   ├── post.js
    │   ├── subscriber.js
    │   └── user.js
    ├── routes/               # Express routes
    │   ├── admin.js
    │   ├── auth.js
    │   ├── categories.js
    │   ├── comments.js
    │   ├── dashboard.js
    │   ├── images.js
    │   ├── interactions.js
    │   ├── newsletter.js
    │   ├── posts.js
    │   └── search.js
    ├── services/
    │   └── emailService.js   # Email abstraction
    └── utils/
        ├── cloudinary.js     # Cloudinary config
        └── imageUpload.js   # Upload utilities
```

---

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3050` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017/blog-management` |
| `JWT_SECRET` | Secret for JWT signing | `your_secret_key` |
| `BASE_URL` | Base URL for email links | `https://blog-management-sx5c.onrender.com` |

### Optional Environment Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Image uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Image uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Image uploads |
| `SENDGRID_API_KEY` | SendGrid API key | Email service |
| `RESEND_API_KEY` | Resend API key | Email service |
| `SMTP_HOST` | SMTP server host | Nodemailer |

---

## 🔒 Security

### Security Features

- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **JWT Authentication** - Token-based auth
- ✅ **Role-Based Access Control** - User/Admin roles
- ✅ **Input Validation** - express-validator + custom middleware
- ✅ **Password Reset Tokens** - 1-hour expiration
- ✅ **Email Verification** - Secure reset flow
- ✅ **CORS Configuration** - Cross-origin protection
- ✅ **Environment Variables** - Sensitive data protection
- ✅ **Rate Limiting** - Protection against brute force and DDoS attacks
  - General API: 100 requests per 15 minutes
  - Authentication: 5 requests per 15 minutes
  - Password Reset: 3 requests per hour
  - Newsletter: 10 requests per hour
  - Image Upload: 20 requests per 15 minutes
- ✅ **Error Logging** - Winston logger for monitoring and debugging

### Best Practices

1. **Never commit `.env` file**
2. **Use strong JWT secrets**
3. **Keep dependencies updated**
4. **Validate all inputs**
5. **Use HTTPS in production**

---

## 🚦 Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `500` | Internal Server Error |

### Error Response Format

```json
{
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

---

## 🧪 Development

### Development Mode

```bash
npm run dev
```

Uses `nodemon` for automatic server restart on file changes.

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### API Documentation

Once the server is running, access the interactive API documentation at:

**Production (Deployed):**
- **Swagger UI**: `https://blog-management-sx5c.onrender.com/api-docs`

**Local Development:**
- **Swagger UI**: `http://localhost:3050/api-docs`

The documentation includes:
- All API endpoints
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Server selector to switch between development and production

### Testing

The project uses **Jest** as the testing framework and **Supertest** for HTTP assertions.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Structure:**
- Tests are located in the `__tests__/` directory
- Example tests: `health.test.js`, `auth.test.js`
- Coverage reports are generated in the `coverage/` directory

**Writing Tests:**
```javascript
import request from 'supertest';
import app from '../app.js';

describe('Feature Name', () => {
  describe('GET /endpoint', () => {
    it('should return expected response', async () => {
      const response = await request(app)
        .get('/v1/endpoint')
        .expect(200);
      expect(response.body).toHaveProperty('expectedProperty');
    });
  });
});
```

**Test Environment:**
- Tests run with `NODE_ENV=test`
- Use a separate test database if needed
- Mock external services (email, cloudinary, etc.)

### Logging

The application uses Winston for structured logging:
- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Exceptions**: `logs/exceptions.log`
- **Rejections**: `logs/rejections.log`

Logs are automatically rotated when they reach 5MB.

### Environment Setup

1. Copy `.env.example` to `.env` (if available)
2. Fill in all required variables
3. Never commit `.env` to version control

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem:** Cannot connect to MongoDB

**Solutions:**
- ✅ Verify MongoDB is running
- ✅ Check `MONGODB_URL` in `.env`
- ✅ Test network connectivity
- ✅ Verify credentials for cloud databases

### Authentication Issues

**Problem:** Token invalid or expired

**Solutions:**
- ✅ Verify `JWT_SECRET` is set
- ✅ Check token expiration
- ✅ Ensure `Authorization: Bearer <token>` header format
- ✅ Regenerate token by logging in again

### Password Reset Issues

**Problem:** Reset link not working

**Solutions:**
- ✅ Verify `BASE_URL` in `.env`
- ✅ Check token expiration (1 hour validity)
- ✅ Ensure email service is configured
- ✅ Verify token used within expiration window

### Image Upload Issues

**Problem:** Images not uploading

**Solutions:**
- ✅ Verify Cloudinary credentials
- ✅ Check file size limits
- ✅ Ensure proper file format (jpg, png, etc.)
- ✅ Verify admin authentication

### Email Service Issues

**Problem:** Emails not sending

**Solutions:**
- ✅ Verify email service API keys
- ✅ Check service quotas/limits
- ✅ Ensure proper email configuration
- ✅ Test with different email service

---

## 📞 Support & Contributing

### Getting Help

- 📧 Open an issue on the repository
- 📖 Check existing issues
- 💬 Contact the maintainers

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.
See the [LICENSE](./LICENSE) file for more information.

---

## 📝 Notes

> **Important:** This is a backend API. You'll need a frontend application to interact with it, or use tools like:
> - [Postman](https://www.postman.com/)
> - [Insomnia](https://insomnia.rest/)
> - [cURL](https://curl.se/)
> - [Thunder Client](https://www.thunderclient.com/) (VS Code extension)

---

**Happy Coding 🫡**
