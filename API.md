# Multi-Tenant SaaS Platform API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API endpoints (except authentication endpoints) require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication

#### Register New User and Company
```http
POST /auth/register
```

Request Body:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "companyName": "Acme Corp"
}
```

Response:
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": {
      "id": "uuid",
      "name": "Acme Corp"
    }
  },
  "token": "jwt_token"
}
```

#### Login
```http
POST /auth/login
```

Request Body:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": {
      "id": "uuid",
      "name": "Acme Corp"
    }
  },
  "token": "jwt_token"
}
```

#### Request Password Reset
```http
POST /auth/reset-password
```

Request Body:
```json
{
  "email": "john@example.com"
}
```

Response:
```json
{
  "message": "Password reset instructions sent to your email"
}
```

#### Change Password
```http
POST /auth/change-password
```

Request Body:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

Response:
```json
{
  "message": "Password changed successfully"
}
```

#### Get User Profile
```http
GET /auth/profile
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "company": {
      "id": "uuid",
      "name": "Acme Corp"
    },
    "roles": [
      {
        "id": "uuid",
        "name": "Admin",
        "permissions": [
          {
            "resource": "*",
            "action": "*",
            "isAllowed": true
          }
        ]
      }
    ]
  }
}
```

### Error Responses

All endpoints may return the following error responses:

#### 400 Bad Request
```json
{
  "message": "Error message describing the issue"
}
```

#### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```
or
```json
{
  "message": "Invalid token"
}
```

#### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```
or
```json
{
  "message": "Company account is inactive"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Error message describing the issue"
}
```

## Running the Server

1. **Prerequisites**
   - Node.js (v14 or higher)
   - PostgreSQL (v12 or higher)
   - npm or yarn

2. **Installation**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd <project-directory>

   # Install dependencies
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=saas_platform

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h

   # Email Configuration (for password reset)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_email@example.com
   SMTP_PASS=your_email_password
   ```

4. **Database Setup**
   ```bash
   # Create the database
   createdb saas_platform

   # Run migrations
   npm run typeorm migration:run
   # or
   yarn typeorm migration:run
   ```

5. **Start the Server**
   ```bash
   # Development mode
   npm run dev
   # or
   yarn dev

   # Production mode
   npm run start
   # or
   yarn start
   ```

6. **Testing the API**
   You can use tools like Postman or curl to test the API endpoints:

   ```bash
   # Register a new user
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "John",
       "lastName": "Doe",
       "email": "john@example.com",
       "password": "securepassword123",
       "companyName": "Acme Corp"
     }'

   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "securepassword123"
     }'
   ```

## Security Considerations

1. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. **Token Security**
   - JWT tokens expire after 24 hours
   - Tokens are stored in memory only
   - HTTPS is required in production

3. **Rate Limiting**
   - Login attempts are limited to 5 per minute
   - Password reset requests are limited to 3 per hour

4. **Data Validation**
   - All input is validated and sanitized
   - SQL injection prevention
   - XSS protection

## Support

For any issues or questions, please contact:
- Email: support@example.com
- Documentation: https://docs.example.com
- GitHub Issues: https://github.com/your-repo/issues 