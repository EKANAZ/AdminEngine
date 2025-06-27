# 🚀 **ADMINENGINE - COMPLETE API DOCUMENTATION**

## 🔗 **Base URL**
```
http://localhost:3000/api
```

## 🔐 **Authentication**
All API endpoints (except authentication endpoints) require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 **1. AUTHENTICATION APIs** (`/api/auth`)

### **1.1 Register New User & Company** (Super Admin System)
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Admin@2025!",
  "companyName": "Acme Corp",
  "companyDomain": "acme.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": []
    },
    "company": {
      "id": "uuid",
      "name": "Acme Corp"
    }
  }
}
```

### **1.2 User Login** (Super Admin System)
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Admin@2025!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": []
    },
    "company": {
      "id": "uuid",
      "name": "Acme Corp"
    }
  }
}
```

### **1.3 Create Role** (Requires 'roles:create' permission)
```http
POST /api/auth/roles
```

**Request Body:**
```json
{
  "name": "Manager",
  "permissions": ["users:read", "users:write"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Manager",
  "permissions": ["users:read", "users:write"]
}
```

### **1.4 Assign Role to User** (Requires 'roles:assign' permission)
```http
POST /api/auth/assign-role
```

**Request Body:**
```json
{
  "userId": "user-uuid",
  "roleId": "role-uuid"
}
```

**Response:**
```json
{
  "message": "Role assigned successfully"
}
```

---

## 🏪 **2. CLIENT REGISTRATION APIs** (`/api/customers`)

### **2.1 Register Client** (ERP Service People)
```http
POST /api/customers/register
```

**Request Body:**
```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "password": "ClientPass123!",
  "phone": "+1234567890",
  "companyName": "Alice's Business"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "customer": {
      "id": "uuid",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "companyName": "Alice's Business",
      "phone": "+1234567890",
      "subscriptionPlan": "basic"
    },
    "message": "Client registration successful. Client database created."
  }
}
```

### **2.2 Client Login** (ERP Service People)
```http
POST /api/customers/login
```

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "ClientPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "customer": {
      "id": "uuid",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "companyName": "Alice's Business",
      "phone": "+1234567890",
      "subscriptionPlan": "basic"
    }
  }
}
```

---

## 🔄 **3. CLIENT ERP APIs** (`/api/client-erp`)

**⚠️ Requires Client JWT Token**

### **3.1 Get Client Profile**
```http
GET /api/client-erp/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "companyName": "Alice's Business",
      "phone": "+1234567890",
      "subscriptionPlan": "basic"
    }
  }
}
```

### **3.2 Get Client's Users** (From their database)
```http
GET /api/client-erp/users
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "firstName": "Employee",
        "lastName": "One",
        "email": "employee@client.com"
      }
    ]
  }
}
```

### **3.3 Create User in Client's Database**
```http
POST /api/client-erp/users
```

**Request Body:**
```json
{
  "firstName": "New",
  "lastName": "Employee",
  "email": "new@client.com",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "New",
      "lastName": "Employee",
      "email": "new@client.com",
      "phone": "+1234567890"
    }
  }
}
```

### **3.4 Get Client's Interactions**
```http
GET /api/client-erp/interactions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "interactions": [
      {
        "id": "uuid",
        "type": "call",
        "description": "Customer inquiry",
        "date": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

### **3.5 Create Interaction in Client's Database**
```http
POST /api/client-erp/interactions
```

**Request Body:**
```json
{
  "type": "meeting",
  "description": "Sales meeting with prospect",
  "date": "2024-01-01T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "interaction": {
      "id": "uuid",
      "type": "meeting",
      "description": "Sales meeting with prospect",
      "date": "2024-01-01T14:00:00Z"
    }
  }
}
```

### **3.6 Update Client Profile**
```http
PUT /api/client-erp/profile
```

**Request Body:**
```json
{
  "name": "Alice Smith",
  "phone": "+1987654321",
  "companyName": "Updated Business Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "companyName": "Updated Business Name",
      "phone": "+1987654321",
      "subscriptionPlan": "basic"
    }
  }
}
```

---

## 👥 **4. USER MANAGEMENT APIs** (`/api/users`)

### **4.1 Create User** (Superadmin only)
```http
POST /api/users
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@acme.com",
  "password": "JanePass123!",
  "companyId": "company-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@acme.com",
    "company": {
      "id": "company-uuid"
    }
  }
}
```

### **4.2 List Users** (Not implemented)
```http
GET /api/users
```

**Response:**
```json
{
  "message": "List users - not implemented"
}
```

### **4.3 Get User by ID** (Not implemented)
```http
GET /api/users/:id
```

**Response:**
```json
{
  "message": "Get user - not implemented"
}
```

### **4.4 Update User** (Not implemented)
```http
PUT /api/users/:id
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response:**
```json
{
  "message": "Update user - not implemented"
}
```

### **4.5 Set User Status** (Not implemented)
```http
PATCH /api/users/:id/status
```

**Request Body:**
```json
{
  "isActive": false
}
```

**Response:**
```json
{
  "message": "Set user status - not implemented"
}
```

### **4.6 Delete User** (Not implemented)
```http
DELETE /api/users/:id
```

**Response:**
```json
{
  "message": "Delete user - not implemented"
}
```

---

## 🏢 **5. COMPANY MANAGEMENT APIs** (`/api/companies`)

### **5.1 List Companies** (Not implemented)
```http
GET /api/companies
```

**Response:**
```json
{
  "message": "List companies - not implemented"
}
```

### **5.2 Get Company by ID** (Not implemented)
```http
GET /api/companies/:id
```

**Response:**
```json
{
  "message": "Get company - not implemented"
}
```

### **5.3 Update Company** (Not implemented)
```http
PUT /api/companies/:id
```

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "domain": "updated-domain.com"
}
```

**Response:**
```json
{
  "message": "Update company - not implemented"
}
```

### **5.4 Delete Company** (Not implemented)
```http
DELETE /api/companies/:id
```

**Response:**
```json
{
  "message": "Delete company - not implemented"
}
```

### **5.5 Get Company Subscription** (Not implemented)
```http
GET /api/companies/:id/subscription
```

**Response:**
```json
{
  "message": "Get subscription - not implemented"
}
```

### **5.6 Change Company Plan** (Not implemented)
```http
POST /api/companies/:id/plan
```

**Request Body:**
```json
{
  "planName": "Enterprise",
  "durationMonths": 12
}
```

**Response:**
```json
{
  "message": "Change plan - not implemented"
}
```

### **5.7 Download Company Backup**
```http
GET /api/companies/backup?companyId=uuid
```

**Response:**
```json
{
  "users": [...],
  "modules": [...],
  "subscriptions": [...]
}
```

---

## 🎭 **6. ROLE MANAGEMENT APIs** (`/api/roles`)

### **6.1 List All Roles**
```http
GET /api/roles
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Admin",
    "description": "Administrator role",
    "permissions": []
  }
]
```

### **6.2 Get Role by ID**
```http
GET /api/roles/:id
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Admin",
  "description": "Administrator role",
  "permissions": []
}
```

### **6.3 Create Role**
```http
POST /api/roles
```

**Request Body:**
```json
{
  "name": "Manager",
  "description": "Manager role with limited permissions"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Manager",
  "description": "Manager role with limited permissions"
}
```

### **6.4 Update Role**
```http
PUT /api/roles/:id
```

**Request Body:**
```json
{
  "name": "Senior Manager",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Senior Manager",
  "description": "Updated description"
}
```

### **6.5 Delete Role**
```http
DELETE /api/roles/:id
```

**Response:**
```json
{
  "success": true
}
```

---

## 🔐 **7. PERMISSION MANAGEMENT APIs** (`/api/permissions`)

### **7.1 List All Permissions**
```http
GET /api/permissions
```

**Response:**
```json
[
  {
    "id": "uuid",
    "resource": "user",
    "action": "create",
    "isAllowed": true
  }
]
```

### **7.2 Get Permission by ID**
```http
GET /api/permissions/:id
```

**Response:**
```json
{
  "id": "uuid",
  "resource": "user",
  "action": "create",
  "isAllowed": true
}
```

### **7.3 Create Permission**
```http
POST /api/permissions
```

**Request Body:**
```json
{
  "resource": "company",
  "action": "read",
  "isAllowed": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "resource": "company",
  "action": "read",
  "isAllowed": true
}
```

### **7.4 Update Permission**
```http
PUT /api/permissions/:id
```

**Request Body:**
```json
{
  "isAllowed": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "resource": "company",
  "action": "read",
  "isAllowed": false
}
```

### **7.5 Delete Permission**
```http
DELETE /api/permissions/:id
```

**Response:**
```json
{
  "success": true
}
```

---

## 🔄 **8. CLIENT SYNC APIs** (`/api/client`)

### **8.1 Pull Data from Server**
```http
POST /api/client/sync/pull
```

**Request Body:**
```json
{
  "lastSyncTimestamp": "2024-01-01T00:00:00Z",
  "entityTypes": ["contacts", "customers"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [...],
    "customers": [...]
  },
  "syncTimestamp": "2024-01-01T12:00:00Z"
}
```

### **8.2 Push Data to Server**
```http
POST /api/client/sync/push
```

**Request Body:**
```json
{
  "changes": {
    "contacts": [
      {
        "id": "uuid",
        "firstName": "Alice",
        "lastName": "Smith"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Minimal push endpoint is working!"
}
```

---

## 🔄 **9. CLIENT SYNC ROUTES** (`/api/client/sync`)

### **9.1 Pull Data** (Alternative endpoint)
```http
POST /api/client/sync/pull
```

**Request Body:**
```json
{
  "lastSyncTimestamp": "2024-01-01T00:00:00Z",
  "entityTypes": ["contacts", "customers"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": [...],
    "customers": [...]
  },
  "syncTimestamp": "2024-01-01T12:00:00Z"
}
```

---

## 🏥 **10. HEALTH CHECK**

### **10.1 Server Health**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## ❌ **11. ERROR RESPONSES**

### **11.1 400 Bad Request**
```json
{
  "success": false,
  "error": "Validation error: 'email' is required"
}
```

### **11.2 401 Unauthorized**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### **11.3 404 Not Found**
```json
{
  "success": false,
  "error": "Route not found"
}
```

### **11.4 500 Internal Server Error**
```json
{
  "success": false,
  "error": "Error during registration"
}
```

---

## 🔧 **12. SETUP & INITIALIZATION**

### **12.1 Database Initialization**
```bash
# Run database migrations
npm run migration:run

# Initialize database with default data
npm run init-db
```

### **12.2 Default Super Admin Credentials**
```json
{
  "email": "admin@system.com",
  "password": "Admin@123"
}
```

### **12.3 Environment Variables**
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=saas_platform

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h
```

---

## 📝 **13. VALIDATION RULES**

### **13.1 Password Requirements**
- Minimum 8 characters
- Must include uppercase letter
- Must include lowercase letter
- Must include number
- Must include special character (@$!%*?&)

### **13.2 Email Validation**
- Must be valid email format
- Required field

### **13.3 Name Validation**
- First Name: 2-50 characters
- Last Name: 2-50 characters
- Company Name: 2-100 characters
- Company Domain: 2-100 characters

---

## 🚀 **14. GETTING STARTED**

### **14.1 Quick Start**
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run database setup
npm run migration:run

# Start development server
npm run dev
```

### **14.2 First Steps**
1. **Register a company:** `POST /api/auth/register`
2. **Login:** `POST /api/auth/login`
3. **Create roles:** `POST /api/auth/roles`
4. **Assign permissions:** `POST /api/auth/assign-role`

### **14.3 Client Setup**
1. **Register a client:** `POST /api/customers/register`
2. **Client login:** `POST /api/customers/login`
3. **Access ERP:** Use client token with `/api/client-erp/*` endpoints

---

## 🔒 **15. SECURITY CONSIDERATIONS**

- **JWT Tokens:** Expire after 24 hours
- **Password Hashing:** Uses bcrypt with salt rounds of 10
- **Rate Limiting:** Applied to authentication endpoints
- **Input Validation:** All inputs validated using Joi schemas
- **CORS:** Configured for cross-origin requests
- **Helmet:** Security headers enabled
- **Multi-tenancy:** Complete database isolation for clients

---

## 📞 **16. SUPPORT**

For issues or questions:
- **Email:** support@adminengine.com
- **Documentation:** https://docs.adminengine.com
- **GitHub Issues:** https://github.com/adminengine/issues

---

## 📊 **17. API STATUS**

### **✅ Fully Implemented**
- Authentication (Register/Login) - Both systems
- Client Registration with Database Creation
- Client ERP System with Database Access
- Role Management
- Permission Management
- Client Sync (Pull)
- Health Check

### **🚧 Partially Implemented**
- User Management (Create only)
- Company Management (Backup only)
- Client Sync (Push - minimal)

### **❌ Not Implemented**
- User CRUD operations (except create)
- Company CRUD operations (except backup)
- Subscription management
- Email functionality
- Password reset
- Profile management

---

## 🏗️ **18. SYSTEM ARCHITECTURE**

### **Two Registration Systems:**

#### **1. Super Admin System** (`/api/auth/*`)
- **Purpose:** Your software company management
- **Users:** Managers, Support, Super Admins
- **Database:** Main database only
- **Access:** Full system access

#### **2. Client System** (`/api/customers/*`, `/api/client-erp/*`)
- **Purpose:** ERP service people registration
- **Users:** End customers using your ERP
- **Database:** Main DB + Individual client databases
- **Access:** Only their own database

### **Database Structure:**
```
Main Database (saas_platform)
├── companies (your company + client companies)
├── users (your staff)
├── customers (client registrations)
├── roles, permissions, etc.

Client Databases (tenant_<customer_id>)
├── users_client (client's employees)
└── Interaction (client's interactions)
```

---

*Last Updated: January 2025*
*Version: 2.0.0* 