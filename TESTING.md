# Testing Guide

This document provides information about testing the Blog Management API.

## Test Setup

The project uses **Jest** as the testing framework and **Supertest** for HTTP assertions.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are located in the `__tests__` directory:

```
__tests__/
├── health.test.js    # Health check endpoint tests
└── auth.test.js      # Authentication endpoint tests
```

## Writing Tests

### Example Test Structure

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

## Test Environment

Tests run in a separate environment. Make sure to:

1. Set `NODE_ENV=test` when running tests
2. Use a separate test database (if needed)
3. Mock external services (email, cloudinary, etc.)

## Coverage

Coverage reports are generated in the `coverage/` directory after running:

```bash
npm run test:coverage
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after tests
3. **Mocking**: Mock external services and database calls
4. **Assertions**: Use clear, descriptive assertions
5. **Naming**: Use descriptive test names

## Example Test Cases

### Authentication Tests
- User registration with valid data
- User registration with invalid data
- User login with valid credentials
- User login with invalid credentials
- Password reset flow

### API Endpoint Tests
- Health check endpoints
- CRUD operations
- Error handling
- Authentication requirements
- Rate limiting

## Continuous Integration

Tests should be run in CI/CD pipelines before deployment.

