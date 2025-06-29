# JWT Expiration Solution

## Problem
JWT tokens in your AdminEngine project were expiring after 24 hours, causing users to be automatically logged out and requiring re-authentication.

## Solutions Implemented

### 1. Extended JWT Expiration Time
- **Before**: JWT tokens expired after 24 hours (`expiresIn: '24h'`)
- **After**: JWT tokens now expire after 7 days (`expiresIn: '7d'`)
- **Configuration**: Set via `JWT_EXPIRES_IN=7d` environment variable

### 2. Implemented Refresh Token System
A more secure and user-friendly approach that provides:
- **Access Token**: Short-lived (7 days) for API requests
- **Refresh Token**: Long-lived (30 days) for getting new access tokens
- **Automatic Renewal**: Users stay logged in without manual re-authentication

## How It Works

### Authentication Flow
1. **Login/Register**: User receives both access token and refresh token
2. **API Requests**: Use access token in Authorization header
3. **Token Expiry**: When access token expires, use refresh token to get new tokens
4. **Logout**: Invalidate refresh token

### New API Endpoints

#### POST `/auth/refresh`
Refresh an expired access token using a refresh token.

**Request:**
```json
{
  "refreshToken": "your-refresh-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

#### POST `/auth/logout`
Logout and invalidate refresh token.

**Request:**
```json
{
  "refreshToken": "your-refresh-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Updated Login/Register Response
Both endpoints now return refresh tokens:

```json
{
  "success": true,
  "data": {
    "token": "access-token",
    "refreshToken": "refresh-token",
    "user": { ... },
    "company": { ... }
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

## Frontend Implementation

### Store Tokens
```javascript
// After login/register
localStorage.setItem('accessToken', response.data.token);
localStorage.setItem('refreshToken', response.data.refreshToken);
```

### API Request with Auto-Refresh
```javascript
async function apiRequest(url, options = {}) {
  const accessToken = localStorage.getItem('accessToken');
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  };

  try {
    const response = await fetch(url, config);
    
    // If token expired, try to refresh
    if (response.status === 401) {
      const newTokens = await refreshToken();
      if (newTokens) {
        // Retry the original request with new token
        config.headers.Authorization = `Bearer ${newTokens.token}`;
        return await fetch(url, config);
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}

async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data;
    }
  } catch (error) {
    // Refresh failed, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
  
  return null;
}
```

### Logout
```javascript
async function logout() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
}
```

## Security Considerations

1. **Refresh Token Storage**: Store refresh tokens securely (HttpOnly cookies in production)
2. **Token Rotation**: Each refresh generates new tokens, invalidating old ones
3. **Token Revocation**: Logout immediately invalidates refresh tokens
4. **Short Access Tokens**: Access tokens are still relatively short-lived for security
5. **HTTPS Only**: Always use HTTPS in production

## Production Recommendations

1. **Use Redis**: Replace in-memory token storage with Redis for scalability
2. **HttpOnly Cookies**: Store refresh tokens in HttpOnly cookies instead of localStorage
3. **Token Blacklisting**: Implement token blacklisting for additional security
4. **Rate Limiting**: Add rate limiting to refresh token endpoints
5. **Monitoring**: Monitor token usage and suspicious patterns

## Migration Guide

### For Existing Users
- Existing tokens will continue to work until they expire
- New logins will receive both access and refresh tokens
- No database migration required

### For Frontend Applications
1. Update login/register handlers to store refresh tokens
2. Implement automatic token refresh logic
3. Update logout to call the logout endpoint
4. Test the complete authentication flow

## Testing

Test the following scenarios:
1. Login and verify both tokens are received
2. Use access token for API requests
3. Wait for token expiry or manually expire
4. Verify refresh token works to get new tokens
5. Test logout invalidates refresh token
6. Test refresh token expiry handling 