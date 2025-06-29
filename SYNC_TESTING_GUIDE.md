# Sync API & WebSocket Testing Guide

## 1. Sync Push API Testing (Postman)

### **Endpoint**: `POST /api/client/sync/push`

### **Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### **Test Cases**:

#### **Case 1: Create New User**
```json
{
  "table": "end_user",
  "operation": "create",
  "data": {
    "Unique_id": "d89fed50-5511-11f0-8779-f1f8616708d2",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phoneModel": {
      "phone": "1234567890",
      "type": "primary"
    },
    "gstNo": "GST123456789",
    "companyName": "Test Company",
    "active": 1,
    "sync_status": "pending",
    "version": 1,
    "last_updated": "2025-06-29T23:22:38.964021",
    "device_id": "unknown",
    "is_deleted": 0,
    "server_synced": 0
  },
  "timestamp": "2025-06-29T23:45:26.002429"
}
```

#### **Case 2: Update Existing User**
```json
{
  "table": "end_user",
  "operation": "update",
  "data": {
    "id": "existing-user-id",
    "Unique_id": "d89fed50-5511-11f0-8779-f1f8616708d2",
    "firstName": "John",
    "lastName": "Smith",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "active": 1,
    "sync_status": "pending",
    "version": 2
  },
  "timestamp": "2025-06-29T23:45:26.002429"
}
```

#### **Case 3: Delete User**
```json
{
  "table": "end_user",
  "operation": "delete",
  "data": {
    "id": "user-id-to-delete",
    "is_deleted": 1,
    "sync_status": "pending"
  },
  "timestamp": "2025-06-29T23:45:26.002429"
}
```

### **Expected Responses**:

#### **Success Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "generated-uuid",
      "Unique_id": "d89fed50-5511-11f0-8779-f1f8616708d2",
      "firstName": "John",
      "lastName": "Doe",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phoneModel": {
        "phone": "1234567890",
        "type": "primary"
      },
      "gstNo": "GST123456789",
      "companyName": "Test Company",
      "active": 1,
      "sync_status": "synced",
      "version": 1,
      "last_updated": "2025-06-29T23:22:38.964021",
      "device_id": "unknown",
      "is_deleted": 0,
      "server_synced": 1,
      "createdAt": "2025-06-29T23:45:26.002Z",
      "updatedAt": "2025-06-29T23:45:26.002Z"
    }
  ],
  "syncTimestamp": "2025-06-29T23:45:26.002Z"
}
```

#### **Error Response**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 2. Sync Pull API Testing

### **Endpoint**: `POST /api/client/sync/pull`

### **Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### **Test Cases**:

#### **Case 1: Pull Single Entity Type**
```json
{
  "table": "end_user",
  "lastSync": "1970-01-01T00:00:00.000"
}
```

#### **Case 2: Pull Multiple Entity Types**
```json
{
  "lastSyncTimestamp": "1970-01-01T00:00:00.000",
  "entityTypes": ["end_user", "interactions"]
}
```

### **Expected Response**:
```json
{
  "success": true,
  "data": {
    "end_user": [
      {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@example.com",
        "sync_status": "synced",
        "createdAt": "2025-06-29T23:45:26.002Z",
        "updatedAt": "2025-06-29T23:45:26.002Z"
      }
    ]
  },
  "syncTimestamp": "2025-06-29T23:45:26.002Z"
}
```

## 3. WebSocket Notification Testing

### **Setup**:
1. Open `websocket-test.html` in your browser
2. Enter your JWT token and tenant ID
3. Click "Connect"

### **WebSocket Events**:

#### **Connection Events**:
- `connect` - WebSocket connected
- `disconnect` - WebSocket disconnected
- `authenticated` - Authentication successful
- `authentication_error` - Authentication failed

#### **Sync Notifications**:
- `sync_notification` - General sync notifications
- `sync_status_update` - Status updates from clients
- `pong` - Response to ping

### **Notification Types**:

#### **Data Available**:
```json
{
  "type": "data_available",
  "entityType": "end_user",
  "entityId": "user-id",
  "message": "New end_user data available for sync",
  "timestamp": "2025-06-29T23:45:26.002Z"
}
```

#### **Sync Complete**:
```json
{
  "type": "sync_complete",
  "entityType": "end_user",
  "entityId": "user-id",
  "message": "end_user sync completed successfully",
  "timestamp": "2025-06-29T23:45:26.002Z",
  "data": {
    "id": "user-id",
    "name": "John Doe",
    "sync_status": "synced"
  }
}
```

#### **Sync Error**:
```json
{
  "type": "sync_error",
  "entityType": "end_user",
  "entityId": "user-id",
  "message": "Sync error for end_user: Database connection failed",
  "timestamp": "2025-06-29T23:45:26.002Z"
}
```

## 4. Testing Workflow

### **Step 1: Test WebSocket Connection**
1. Open `websocket-test.html`
2. Enter JWT token and tenant ID
3. Click "Connect"
4. Verify connection status shows "Connected"
5. Check logs for authentication success

### **Step 2: Test Sync Push**
1. Use Postman to send a push request
2. Watch WebSocket logs for notifications
3. Verify data is saved in database
4. Check sync_status is updated to "synced"

### **Step 3: Test Sync Pull**
1. Use Postman to send a pull request
2. Verify data is returned correctly
3. Check syncTimestamp is updated

### **Step 4: Test Real-time Notifications**
1. Have multiple WebSocket clients connected
2. Send push request from one client
3. Verify other clients receive notifications
4. Test different notification types

## 5. Common Issues & Solutions

### **Issue 1: 400 Validation Error**
- **Cause**: Wrong JSON format
- **Solution**: Use correct format with `table`, `operation`, `data`, `timestamp`

### **Issue 2: 401 Unauthorized**
- **Cause**: Invalid or missing JWT token
- **Solution**: Check token format and expiration

### **Issue 3: Database Connection Error**
- **Cause**: Tenant database doesn't exist
- **Solution**: System will auto-create tenant database

### **Issue 4: WebSocket Connection Failed**
- **Cause**: Server not running or CORS issues
- **Solution**: Check server status and CORS configuration

## 6. Monitoring & Debugging

### **Server Logs**:
- Check console for detailed sync operation logs
- Monitor database connection status
- Watch for WebSocket connection events

### **Client Logs**:
- Use WebSocket test client for real-time monitoring
- Check browser console for connection errors
- Monitor notification events

### **Database Verification**:
- Check tenant database exists: `tenant_<customerId>`
- Verify tables are created: `end_user`, `interactions`
- Monitor sync_status field updates

## 7. Performance Testing

### **Load Testing**:
- Test with multiple concurrent clients
- Monitor WebSocket connection limits
- Check database performance under load

### **Data Volume Testing**:
- Test with large datasets
- Monitor memory usage
- Check sync operation timing

This guide provides comprehensive testing for both the sync API and WebSocket notification system. Use the provided test cases and tools to verify all functionality works correctly. 