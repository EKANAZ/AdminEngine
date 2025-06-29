# How to Get Tenant ID for WebSocket Testing

## What is Tenant ID?

The **Tenant ID** is the unique identifier for a client/customer in your system. It's used to:
- Create separate databases for each client
- Route WebSocket notifications to the correct client
- Ensure data isolation between different clients

## How to Get Tenant ID

### Method 1: From JWT Token (Recommended)

1. **Login as a client user** using the customer login endpoint:
   ```
   POST /api/customers/login
   ```

2. **Request Body**:
   ```json
   {
     "email": "alissce@example.com",
     "password": "your-password"
   }
   ```

3. **Response** will contain the JWT token:
   ```json
   {
     "success": true,
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "customer": {
         "id": "1030070f-9824-49b3-b53b-8013e2eb363e",
         "name": "Alissce",
         "email": "alissce@example.com",
         "companyName": "Example Company"
       }
     }
   }
   ```

4. **Extract Tenant ID**: The `customer.id` field is your tenant ID: `1030070f-9824-49b3-b53b-8013e2eb363e`

### Method 2: Decode JWT Token

1. **Copy your JWT token**
2. **Go to** [jwt.io](https://jwt.io)
3. **Paste the token** in the debugger
4. **Look for** the `customerId` field in the payload

Example JWT payload:
```json
{
  "customerId": "1030070f-9824-49b3-b53b-8013e2eb363e",
  "email": "alissce@example.com",
  "type": "client",
  "iat": 1751219892,
  "exp": 1751306292
}
```

### Method 3: From Database

1. **Connect to your main database**
2. **Query the customers table**:
   ```sql
   SELECT id, name, email, companyName 
   FROM customers 
   WHERE email = 'alissce@example.com';
   ```

## Using Tenant ID in WebSocket Testing

### 1. Open WebSocket Test Client
- Open `websocket-test.html` in your browser

### 2. Enter Connection Details
- **Server URL**: `http://localhost:3000`
- **JWT Token**: Your JWT token from login
- **Tenant ID**: `1030070f-9824-49b3-b53b-8013e2eb363e`

### 3. Connect and Test
- Click "Connect"
- You should see "Connected" status
- Test notifications will be sent to this tenant only

## Tenant Database Structure

When a client registers, a separate database is created:
- **Database Name**: `tenant_1030070f982449b3b53b8013e2eb363e`
- **Tables**: `end_user`, `interactions`
- **Purpose**: Isolated data storage for this client

## Testing Different Scenarios

### Test 1: Single Client
1. Connect one WebSocket client
2. Send sync push request
3. Verify notifications are received

### Test 2: Multiple Clients
1. Connect multiple WebSocket clients with same tenant ID
2. Send sync push request
3. Verify all clients receive notifications

### Test 3: Different Tenants
1. Connect clients with different tenant IDs
2. Send sync push request
3. Verify only clients with matching tenant ID receive notifications

## Common Issues

### Issue 1: "Tenant database not found"
- **Cause**: Client hasn't registered yet
- **Solution**: Register the client first using `/api/customers/register`

### Issue 2: "Invalid tenant ID"
- **Cause**: Wrong tenant ID format
- **Solution**: Use the exact ID from JWT token or database

### Issue 3: "WebSocket connection failed"
- **Cause**: Server not running or CORS issues
- **Solution**: Check server status and restart if needed

## Example: Complete Testing Flow

1. **Register a new client**:
   ```bash
   curl -X POST http://localhost:3000/api/customers/register \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Test",
       "lastName": "User",
       "email": "test@example.com",
       "password": "password123",
       "phone": "1234567890",
       "companyName": "Test Company"
     }'
   ```

2. **Login to get JWT token**:
   ```bash
   curl -X POST http://localhost:3000/api/customers/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

3. **Use the tenant ID and JWT token** in WebSocket test client

4. **Test sync operations** and verify real-time notifications

This guide helps you understand how to get and use the tenant ID for WebSocket testing in your sync system. 