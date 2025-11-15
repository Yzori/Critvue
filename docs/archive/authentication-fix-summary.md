# Authentication Mismatch Fix - Avatar Upload System

## Problem Summary

The frontend avatar upload component was using an incorrect authentication method that didn't match the backend's httpOnly cookie-based authentication system.

### Error Details
- **Error**: "Not authenticated"
- **Location**: `frontend/components/profile/avatar-upload.tsx` (line 142)
- **Cause**: Component was looking for `access_token` in localStorage and sending Authorization header, but the backend uses httpOnly cookies

## Authentication Architecture

### Backend (FastAPI)
The backend implements secure httpOnly cookie-based authentication:

1. **Login Flow** (`/api/v1/auth/login`):
   - Accepts email/password credentials
   - Returns user data
   - Sets two httpOnly cookies via `Set-Cookie` headers:
     - `access_token` - JWT token (30 min expiry, path: `/`)
     - `refresh_token` - JWT token (7 days expiry, path: `/api/v1/auth`)

2. **Protected Endpoints**:
   - Use `Depends(get_current_user)` dependency
   - Extract JWT from `access_token` cookie (NOT Authorization header)
   - Validate token and return user object

3. **CORS Configuration**:
   - Allows origins: `http://localhost:3000`, `http://localhost:3001`, `http://127.0.0.1:3000`
   - **Critical**: `allow_credentials=True` (required for cookie-based auth)

### Frontend (Next.js)
The frontend uses automatic cookie management:

1. **API Client** (`lib/api/client.ts`):
   - All requests use `credentials: 'include'`
   - Automatically sends httpOnly cookies with every request
   - Handles 401 errors by attempting token refresh
   - No manual token management needed

2. **Auth Context** (`contexts/AuthContext.tsx`):
   - Manages global auth state
   - Stores user data in state and localStorage (for quick access)
   - Does NOT store tokens (they're httpOnly and inaccessible to JS)

3. **Auth Flow**:
   - Login → Backend sets cookies → Frontend stores user data
   - API calls → Browser automatically sends cookies
   - Logout → Backend clears cookies

## Files Fixed

### 1. `/frontend/components/profile/avatar-upload.tsx`

**Before:**
```typescript
// INCORRECT - tried to get token from localStorage
const token = localStorage.getItem("access_token");
if (!token) {
  throw new Error("Not authenticated");
}

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`, // Backend doesn't expect this
  },
  body: formData,
});
```

**After:**
```typescript
// CORRECT - uses httpOnly cookies automatically
const response = await fetch(url, {
  method: "POST",
  credentials: "include", // Sends httpOnly cookies with request
  body: formData,
  // No Authorization header needed
  // No Content-Type header needed (browser sets it for FormData)
});
```

**Changes:**
- Removed localStorage token check (lines 140-143)
- Removed Authorization header (line 159)
- Added `credentials: "include"` to send cookies
- Added detailed comments explaining httpOnly cookie auth

### 2. `/frontend/lib/api/files.ts`

Fixed two functions that had the same issue:

**Before:**
```typescript
// INCORRECT - tried to get token from localStorage
const token = localStorage.getItem("accessToken");

xhr.open("POST", url);
if (token) {
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
}
```

**After:**
```typescript
// CORRECT - uses httpOnly cookies automatically
xhr.open("POST", url);
xhr.withCredentials = true; // Send httpOnly cookies with request
```

**Functions Fixed:**
- `uploadFile()` - single file upload
- `uploadFiles()` - batch file upload

**Changes:**
- Removed localStorage token retrieval
- Removed Authorization header
- Added `xhr.withCredentials = true` to send cookies

## Verification

### 1. Backend Configuration ✓
- CORS allows `http://localhost:3000`
- `allow_credentials=True` is set
- Cookies are properly configured with:
  - `httponly=True` (secure from XSS)
  - `samesite="lax"` (CSRF protection)
  - Appropriate expiration times

### 2. Frontend Configuration ✓
- API client uses `credentials: 'include'`
- No localStorage token usage
- No Authorization headers for cookie-based endpoints
- Consistent pattern across all API calls

### 3. Component Consistency ✓
Verified no other components use localStorage tokens:
- Auth flow: Uses `apiClient` with cookie handling ✓
- Profile components: Use `apiClient` ✓
- File uploads: Now fixed to use cookies ✓
- Avatar upload: Now fixed to use cookies ✓

## Testing Instructions

### Prerequisites
1. Backend running on `http://localhost:8000`
2. Frontend running on `http://localhost:3000`
3. User must be logged in (session cookies set)

### Test Steps

1. **Login Test**:
   ```bash
   # Backend should set cookies
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}' \
     -v

   # Look for Set-Cookie headers in response
   ```

2. **Browser Test**:
   - Open browser DevTools → Application → Cookies
   - Login to the app
   - Verify `access_token` and `refresh_token` cookies are set
   - Check they have `HttpOnly` flag (marked in DevTools)

3. **Avatar Upload Test**:
   - Navigate to profile page
   - Click avatar upload button
   - Select an image
   - Upload should succeed without "Not authenticated" error
   - Check Network tab:
     - Request should include `Cookie` header
     - No `Authorization` header should be present

4. **Expected Behavior**:
   - Upload completes successfully
   - Avatar displays on profile
   - No authentication errors in console
   - User avatar updates in navigation menu

### Debugging

If upload still fails:

1. **Check cookies are set**:
   - DevTools → Application → Cookies → `http://localhost:3000`
   - Should see `access_token` and `refresh_token`

2. **Check cookie is sent**:
   - DevTools → Network → Select upload request
   - Request Headers should include: `Cookie: access_token=...`

3. **Check CORS**:
   - Response Headers should include:
     - `Access-Control-Allow-Origin: http://localhost:3000`
     - `Access-Control-Allow-Credentials: true`

4. **Check backend logs**:
   ```bash
   # Backend should show successful authentication
   # Look for user_id in logs
   ```

## Security Benefits

This httpOnly cookie approach provides several security advantages:

1. **XSS Protection**: Cookies are inaccessible to JavaScript, preventing XSS attacks from stealing tokens
2. **CSRF Protection**: `samesite="lax"` prevents CSRF attacks
3. **Automatic Management**: Browser handles cookie storage/sending
4. **Token Rotation**: Refresh tokens enable automatic token rotation
5. **Secure Transmission**: Cookies can be marked `secure=True` for HTTPS-only in production

## Production Checklist

Before deploying to production:

- [ ] Set `secure=True` in cookie configuration (requires HTTPS)
- [ ] Update `ALLOWED_ORIGINS` to include production domain
- [ ] Verify `samesite` attribute is appropriate for your domain setup
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure proper CORS for production frontend URL
- [ ] Test token refresh flow
- [ ] Test logout clears cookies properly

## Related Files

### Backend
- `/backend/app/api/auth.py` - Authentication endpoints
- `/backend/app/api/deps.py` - Auth dependency (get_current_user)
- `/backend/app/api/v1/profile.py` - Profile endpoints including avatar upload
- `/backend/app/core/config.py` - CORS and settings configuration
- `/backend/app/main.py` - CORS middleware setup

### Frontend
- `/frontend/lib/api/client.ts` - Main API client with cookie handling
- `/frontend/lib/api/auth.ts` - Auth API functions
- `/frontend/contexts/AuthContext.tsx` - Auth state management
- `/frontend/components/profile/avatar-upload.tsx` - Avatar upload component (FIXED)
- `/frontend/lib/api/files.ts` - File upload functions (FIXED)

## Summary

The authentication mismatch has been resolved by aligning the frontend components with the existing httpOnly cookie-based authentication system. All file upload operations now correctly use `credentials: 'include'` instead of trying to manually manage tokens via localStorage.

**Key Changes:**
- Removed localStorage token checks
- Removed Authorization headers
- Added `credentials: 'include'` (fetch) or `xhr.withCredentials = true` (XMLHttpRequest)
- Added explanatory comments

**Result:**
- Avatar upload now works correctly
- File uploads use proper authentication
- Consistent authentication pattern across the entire frontend
- Better security through httpOnly cookies
