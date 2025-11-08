# Blog Management with Newsletter

A comprehensive RESTful API for managing a blog platform with integrated newsletter functionality. Built with Node.js, Express, and MongoDB, this application provides features for content management, user authentication, newsletter subscriptions, and engagement tracking.

##  Features

### Core Features
- **User Authentication & Authorization**
  - User registration and login
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - User profile management
  - Password reset functionality (forgot/reset password)
  - Change password (authenticated users)
  - Password reset token validation

- **Blog Post Management**
  - Create, read, update, and delete blog posts
  - SEO-friendly slugs
  - Featured images support
  - Post publishing/unpublishing
  - Post categorization and tagging
  - Related posts suggestions
  - View count tracking

- **Content Organization**
  - Category management
  - Tag system
  - Category-based post filtering
  - Category statistics

- **User Engagement**
  - Like/Dislike posts
  - Share posts
  - Comments system with likes
  - Reading history tracking
  - Engagement rate calculation

- **Newsletter System**
  - Email subscription management
  - Newsletter broadcasting
  - Automatic new post notifications
  - Subscriber statistics
  - Unsubscribe functionality

- **Search & Discovery**
  - Full-text search across posts
  - Popular tags
  - Search suggestions
  - Tag-based filtering

- **Admin Dashboard**
  - User management (promote/demote admins)
  - Post management
  - Newsletter management
  - Analytics and statistics
  - Subscriber management

- **Image Management**
  - Cloudinary integration for image uploads
  - Automatic image optimization
  - Image deletion support

- **User Dashboard**
  - Personal post history
  - Comment history
  - Liked posts
  - Reading history

- **Validation & Security**
  - Custom validation middleware
  - Input sanitization
  - Password strength requirements
  - Secure token generation

##  Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose 7.5.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Image Upload**: Cloudinary 2.8.0, Multer 2.0.2
- **Email Services**: 
  - SendGrid (@sendgrid/mail 8.1.6)
  - Nodemailer 7.0.10
  - Resend 6.4.2
- **Validation**: express-validator 7.0.1, validator 13.15.20
- **CORS**: cors 2.8.5
- **Environment Variables**: dotenv 16.3.1
- **Cryptography**: crypto (built-in Node.js module)

##  Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud instance like MongoDB Atlas)
- Cloudinary account (for image uploads)
- Email service account (SendGrid, Resend, or Nodemailer configuration)

##  Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Blog Management"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=3050

   # Database
   MONGODB_URL=mongodb://localhost:27017/blog-management
   # Or for MongoDB Atlas:
   # MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/blog-management

   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_here

   # Base URL (for email links and password reset)
   BASE_URL=http://localhost:3050

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

4. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

5. **Verify the installation**
   ```bash
   curl http://localhost:3050/health
   ```
   You should receive: `{"status":"ok","uptime":<seconds>}`

## 📁 Project Structure

```
Blog Management with Newsletter/
├── app.js                 # Main application entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
└── v1/
    ├── index.js           # API v1 router
    ├── config/
    │   └── db.js          # MongoDB connection
    ├── controllers/       # Route controllers
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
    │   ├── protect.js     # Authentication & authorization middleware
    │   └── validation.js # Custom validation middleware
    ├── models/            # Mongoose models
    │   ├── category.js
    │   ├── comment.js
    │   ├── post.js
    │   ├── subscriber.js
    │   └── user.js
    ├── routes/            # Express routes
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
    │   └── emailService.js # Email service abstraction
    └── utils/
        ├── cloudinary.js   # Cloudinary configuration
        └── imageUpload.js  # Image upload utilities
```

##  API Endpoints

### Base URL
```
http://localhost:3050/v1
```

**Note**: All endpoints below are relative to the base URL. For example, `/auth/register` means `http://localhost:3050/v1/auth/register`

### Authentication (`/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/me` | Get current user profile | Yes |
| GET | `/auth/allusers` | Get all users (Admin only) | Admin |
| GET | `/auth/stats` | Get user statistics (Admin only) | Admin |
| GET | `/auth/profile/:userId` | Get user profile by ID | No |
| PUT | `/auth/update/:userId` | Update user profile | Yes |
| DELETE | `/auth/delete/:userId` | Delete user | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/change-password` | Change password (authenticated) | Yes |
| GET | `/auth/validate-reset-token` | Validate password reset token | No |

### Posts (`/v1/posts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/posts` | Get all published posts | No |
| GET | `/posts/:slug` | Get post by slug | No |
| GET | `/posts/:postId/related` | Get related posts | No |
| POST | `/posts/create` | Create a new post | Admin |
| PUT | `/posts/update/:id` | Update a post | Admin |
| DELETE | `/posts/delete/:id` | Delete a post | Admin |

### Categories (`/v1/categories`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | Get all categories | No |
| GET | `/categories/stats` | Get category statistics | No |
| GET | `/categories/:slug` | Get category by slug | No |
| GET | `/categories/:slug/posts` | Get posts by category | No |
| POST | `/categories/create` | Create a category | Admin |
| PUT | `/categories/update/:categoryId` | Update a category | Admin |
| DELETE | `/categories/delete/:categoryId` | Delete a category | Admin |

### Comments (`/v1/comments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/:postId/comments` | Get comments for a post | No |
| POST | `/create/:postId` | Create a comment | Yes |
| PUT | `/update/:commentId` | Update a comment | Yes |
| DELETE | `/delete/:commentId` | Delete a comment | Yes |
| POST | `/like/:commentId` | Like a comment | Yes |

### Interactions (`/v1/interactions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/:postId/like` | Like a post | Yes |
| POST | `/:postId/dislike` | Dislike a post | Yes |
| POST | `/:postId/share` | Share a post | No |
| GET | `/:postId/interactions` | Get post interactions | No |
| GET | `/me/likes` | Get user's liked posts | Yes |

### Newsletter (`/v1/newsletters`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/subscribe` | Subscribe to newsletter | No |
| POST | `/unsubscribe` | Unsubscribe from newsletter | No |
| POST | `/send` | Send newsletter to all subscribers | Admin |
| POST | `/notify-new-post/:postId` | Notify subscribers of new post | Admin |
| GET | `/stats` | Get subscriber statistics | Admin |
| GET | `/subscribers` | Get all subscribers | Admin |

### Search (`/v1/search`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Search posts | No |
| GET | `/tags/popular` | Get popular tags | No |
| GET | `/suggestions` | Get search suggestions | No |

### Dashboard (`/v1/dashboard`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user dashboard overview | Yes |
| GET | `/posts` | Get user's posts | Yes |
| GET | `/comments` | Get user's comments | Yes |
| GET | `/likes` | Get user's liked posts | Yes |
| GET | `/history` | Get reading history | Yes |

### Admin (`/v1/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/promote/:userId` | Promote user to admin | Admin |
| POST | `/demote/:userId` | Demote admin to user | Admin |

### Images (`/v1/images`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload` | Upload an image | Admin |
| GET | `/` | Get image information | Admin |
| DELETE | `/delete` | Delete an image from Cloudinary | Admin |

##  Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Example: Register and Login

```bash
# Register
curl -X POST http://localhost:3050/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3050/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

##  Usage Examples

### Create a Post (Admin)

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

```bash
curl -X POST http://localhost:3050/v1/newsletters/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com"
  }'
```

### Search Posts

```bash
curl "http://localhost:3050/v1/search?q=nodejs&limit=10&page=1"
```

### Like a Post

```bash
curl -X POST http://localhost:3050/v1/interactions/:postId/like \
  -H "Authorization: Bearer <user_token>"
```

### Forgot Password

```bash
curl -X POST http://localhost:3050/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### Reset Password

```bash
curl -X POST http://localhost:3050/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "newpassword123"
  }'
```

### Change Password (Authenticated)

```bash
curl -X POST http://localhost:3050/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_token>" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword123"
  }'
```

## 🗄️ Database Models

### User
- `username` (String, unique, required, 3-30 characters)
- `email` (String, unique, required)
- `password` (String, hashed)
- `role` (Enum: 'user', 'admin')
- `isActive` (Boolean, default: true)
- `resetPasswordToken` (String, for password reset)
- `resetPasswordExpire` (Date, token expiration)
- `lastPasswordChange` (Date)

### Post
- `title` (String, required)
- `content` (String, required)
- `excerpt` (String, optional)
- `slug` (String, unique, auto-generated)
- `author` (ObjectId, ref: User)
- `category` (ObjectId, ref: Category)
- `tags` (Array of Strings)
- `featuredImage` (String)
- `isPublished` (Boolean)
- `publishedAt` (Date)
- `likes`, `dislikes` (Array of User IDs)
- `shares` (Number)
- `viewCount` (Number)
- `engagementRate` (Number, calculated)

### Category
- `name` (String, required)
- `slug` (String, unique)
- `description` (String, optional)

### Comment
- `content` (String, required, max 1000 characters)
- `author` (ObjectId, ref: User)
- `post` (ObjectId, ref: Post)
- `parentComment` (ObjectId, ref: Comment, optional - for nested replies)
- `isApproved` (Boolean, default: true)
- `likes` (Array of User IDs)

### Subscriber
- `email` (String, unique, required)
- `isActive` (Boolean)
- `subscriptionDate` (Date)

##  Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- Input validation with express-validator and custom validation middleware
- Password reset tokens with expiration (1 hour)
- Secure password reset flow with email verification
- CORS configuration
- Environment variable protection

##  Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "message": "Error description"
}
```

##  Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server on file changes.

### Environment Variables

Make sure to set up all required environment variables in your `.env` file. Never commit the `.env` file to version control.

##  Dependencies

### Production Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cloudinary` - Image storage
- `multer` - File upload handling
- `express-validator` - Input validation
- `validator` - String validation utilities
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `@sendgrid/mail`, `nodemailer`, `resend` - Email services

### Development Dependencies
- `nodemon` - Development server with auto-reload

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

##  Troubleshooting

### Database Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URL` in `.env` file
- Verify network connectivity for cloud databases

### Authentication Issues
- Verify `JWT_SECRET` is set in `.env`
- Check token expiration
- Ensure token is included in Authorization header

### Password Reset Issues
- Verify `BASE_URL` is set correctly in `.env` for reset email links
- Check that reset tokens haven't expired (1 hour validity)
- Ensure email service is properly configured
- Verify reset token is used within the expiration window

### Image Upload Issues
- Verify Cloudinary credentials in `.env`
- Check file size limits
- Ensure proper file format

### Email Service Issues
- Verify email service API keys
- Check email service quotas
- Ensure proper email configuration

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Note**: This is a backend API. You'll need a frontend application to interact with it, or use tools like Postman, cURL, or similar API clients for testing.

