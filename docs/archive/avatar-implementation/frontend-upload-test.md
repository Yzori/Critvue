# Avatar Upload Testing Guide

## Quick Test in Browser

### 1. Verify Authentication Setup

**Open Browser DevTools (F12)**

1. Navigate to: `http://localhost:3000/login`
2. Login with test credentials
3. Check **Application → Cookies → http://localhost:3000**
   - Should see `access_token` cookie
   - Should see `refresh_token` cookie
   - Both should have `HttpOnly` flag checked

### 2. Test Avatar Upload

1. Navigate to: `http://localhost:3000/profile`
2. Click the camera button on avatar
3. Select "Choose from Gallery" or "Take Photo"
4. Select an image file (JPEG, PNG, WebP, or GIF)
5. Watch the upload progress

**Expected Behavior:**
- Image compresses (shows "Optimizing..." overlay)
- Upload starts (shows progress bar)
- Success animation (green checkmark)
- Avatar updates on page
- Avatar updates in navigation menu

### 3. Verify Network Request

**Open DevTools → Network tab**

1. Filter by: `avatar`
2. Trigger upload
3. Click the `avatar` request
4. Check **Request Headers**:
   - ✅ Should have: `Cookie: access_token=...`
   - ❌ Should NOT have: `Authorization: Bearer ...`
   - ✅ Should have: `Content-Type: multipart/form-data; boundary=...`

5. Check **Response**:
   - Status: `200 OK`
   - Body should contain:
     ```json
     {
       "avatar_url": "http://localhost:8000/uploads/avatars/medium/...",
       "message": "Avatar uploaded and processed successfully",
       "variants": {
         "thumbnail": "...",
         "small": "...",
         "medium": "...",
         "large": "...",
         "full": "..."
       },
       "metadata": {
         "original_size": 123456,
         "original_dimensions": "1024x1024",
         "format": "JPEG"
       }
     }
     ```

## Common Issues & Solutions

### Issue 1: "Not authenticated" Error

**Symptoms:**
- Error in console: "Not authenticated"
- Upload fails immediately

**Solution:**
1. Check if cookies are set (see step 1 above)
2. If no cookies: Logout and login again
3. If cookies exist: Check they haven't expired
4. Verify backend is running on `http://localhost:8000`

### Issue 2: CORS Error

**Symptoms:**
- Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Request fails before reaching server

**Solution:**
1. Verify backend CORS settings in `/backend/app/core/config.py`:
   ```python
   ALLOWED_ORIGINS: str = "http://localhost:3000,..."
   ```
2. Check `/backend/app/main.py`:
   ```python
   allow_credentials=True  # Must be True for cookies
   ```
3. Restart backend server after config changes

### Issue 3: Cookies Not Sent

**Symptoms:**
- Request doesn't include `Cookie` header
- Backend returns 401 Unauthorized

**Solution:**
1. Verify `credentials: 'include'` in fetch call
2. Check frontend and backend are on different ports (3000 and 8000)
3. Ensure `samesite="lax"` allows cross-port cookies
4. Verify CORS `allow_credentials=True`

### Issue 4: File Too Large

**Symptoms:**
- Error: "File too large"
- Upload fails during validation

**Solution:**
- Maximum file size: 5MB
- Use smaller image or compress before upload
- Frontend auto-compresses to WebP (max 0.5MB)

### Issue 5: Invalid File Type

**Symptoms:**
- Error: "Invalid file type"
- Upload fails immediately

**Solution:**
- Allowed types: JPEG, PNG, WebP, GIF
- Check file extension matches actual file type
- Some files may have wrong extensions

## Manual cURL Test

Test the endpoint directly with cookies:

```bash
# 1. Login and save cookies
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt \
  -v

# 2. Upload avatar with saved cookies
curl -X POST http://localhost:8000/api/v1/profile/me/avatar \
  -b cookies.txt \
  -F "file=@/path/to/image.jpg" \
  -v

# 3. Check response contains avatar_url
```

## Browser Console Test

```javascript
// Test if cookies are accessible (should return empty string for httpOnly)
console.log('access_token:', document.cookie.includes('access_token'));

// Test fetch with credentials
fetch('http://localhost:8000/api/v1/auth/me', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.log('User:', data))
  .catch(err => console.error('Error:', err));
```

## Expected Logs

### Backend Logs (Success)
```
INFO:     Avatar upload initiated for user 1: test-image.jpg
INFO:     Image metadata: {'width': 1024, 'height': 1024, 'format': 'JPEG', ...}
INFO:     Deleted old avatars for user 1
INFO:     Avatar uploaded successfully for user 1: http://localhost:8000/uploads/avatars/medium/... (123456 bytes -> 5 variants)
```

### Frontend Console (Success)
```
[Compression] Original: 123.45 KB → Compressed: 45.67 KB (63% reduction)
[Upload] Starting upload...
[Upload] Progress: 100%
[Upload] Success!
```

### Frontend Console (Error - OLD CODE)
```
❌ Not authenticated
   at uploadAvatar (avatar-upload.tsx:142)
```

### Frontend Console (Fixed - NEW CODE)
```
✅ No authentication errors
✅ Upload completes successfully
```

## Checklist

Before reporting issues:

- [ ] Backend is running on `http://localhost:8000`
- [ ] Frontend is running on `http://localhost:3000`
- [ ] User is logged in (cookies visible in DevTools)
- [ ] Image file is valid (JPEG/PNG/WebP/GIF, under 5MB)
- [ ] Browser DevTools Network tab shows request details
- [ ] Browser Console shows any error messages
- [ ] Backend logs show request received

## Success Criteria

Upload is working correctly when:

1. ✅ No "Not authenticated" error
2. ✅ Upload progress shows and completes
3. ✅ Avatar updates on profile page
4. ✅ Avatar updates in navigation menu
5. ✅ Network request includes `Cookie` header
6. ✅ Network request does NOT include `Authorization` header
7. ✅ Backend returns 200 OK with avatar_url
8. ✅ All variant URLs are accessible
