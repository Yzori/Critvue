# Avatar Persistence Issue - Root Cause Analysis

## Investigation Date
2025-11-15

## Problem Statement
User uploads avatar successfully, but it disappears after page refresh.

## Test Results

### 1. Database Verification ✅
```sql
SELECT id, email, avatar_url FROM users WHERE email = 'arend@gmail.com';
```
**Result**: Avatar URL is correctly saved in database
- User ID: 4
- Email: arend@gmail.com
- Avatar URL: `/files/avatars/medium/avatar_4_44998541b577beec_medium.jpg`

### 2. Backend API Endpoints ✅

#### POST /auth/login
**Status**: ✅ WORKING
- Returns: `UserResponse` schema
- avatar_url field: **PRESENT**
- Value: `/files/avatars/medium/avatar_4_44998541b577beec_medium.jpg`

#### GET /auth/me
**Status**: ✅ WORKING
- Returns: `UserResponse` schema
- avatar_url field: **PRESENT**
- Value: `/files/avatars/medium/avatar_4_44998541b577beec_medium.jpg`

#### GET /profile/me
**Status**: ⚠️  WORKING BUT TYPE MISMATCH
- Returns: `ProfileResponse` schema
- avatar_url field: **PRESENT**
- Value: `/files/avatars/medium/avatar_4_44998541b577beec_medium.jpg`
- **Problem**: Missing `is_active` field that frontend expects

### 3. Schema Comparison

#### UserResponse (backend/app/schemas/user.py)
```python
class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool          # ✅ PRESENT
    is_verified: bool
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
```

#### ProfileResponse (backend/app/schemas/profile.py)
```python
class ProfileResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_verified: bool
    # ❌ MISSING is_active field
    specialty_tags: List[str] = []
    badges: List[str] = []
    total_reviews_given: int = 0
    total_reviews_received: int = 0
    avg_rating: Optional[Decimal] = None
    avg_response_time_hours: Optional[int] = None
    created_at: datetime
    updated_at: datetime
```

#### User Interface (frontend/lib/types/auth.ts)
```typescript
export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_active: boolean;        // ❌ REQUIRED but missing from ProfileResponse
  is_verified: boolean;
  created_at?: string;
}
```

## ROOT CAUSE IDENTIFIED

**The frontend's `getCurrentUser()` function calls `/profile/me` which returns `ProfileResponse`.**

**`ProfileResponse` is missing the `is_active` field that the frontend's `User` interface requires.**

This causes one of two issues:
1. **Type validation failure** in TypeScript (if strict)
2. **Field undefined** - When the User object is created from ProfileResponse, `is_active` will be `undefined` instead of a boolean

## Why Avatar Disappears

When `getCurrentUser()` is called on page refresh:
1. It calls `/profile/me`
2. Response includes `avatar_url` ✅
3. Response is missing `is_active` ❌
4. TypeScript type mismatch or undefined field causes issues
5. The User object may not be properly constructed
6. Avatar URL may be lost in the type conversion

## Solutions

### Option 1: Add `is_active` to ProfileResponse (RECOMMENDED)
**File**: `backend/app/schemas/profile.py`

Add `is_active` field to `ProfileResponse`:
```python
class ProfileResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_active: bool                    # ✅ ADD THIS
    is_verified: bool
    # ... rest of fields
```

Update `/profile/me` endpoint to include `is_active`:
```python
@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    # ...
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        title=current_user.title,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        role=current_user.role.value,
        is_active=current_user.is_active,  # ✅ ADD THIS
        is_verified=current_user.is_verified,
        # ... rest of fields
    )
```

### Option 2: Make `is_active` optional in frontend User interface
**File**: `frontend/lib/types/auth.ts`

```typescript
export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_active?: boolean;  // ✅ Make optional
  is_verified: boolean;
  created_at?: string;
}
```

**Downside**: This doesn't fix the actual issue, just makes the type more permissive.

### Option 3: Use `/auth/me` instead of `/profile/me` for getCurrentUser()
**File**: `frontend/lib/api/auth.ts`

```typescript
export async function getCurrentUser(): Promise<User> {
  return await apiClient.get<User>("/auth/me");  // Use /auth/me instead
}
```

**Downside**: `/auth/me` returns `UserResponse` which has fewer fields than `ProfileResponse`. We'd lose access to specialty_tags, badges, stats, etc.

## Recommended Fix

**Option 1** is the best solution because:
1. It maintains consistency between schemas
2. It provides all profile data including `is_active`
3. It doesn't break existing functionality
4. It's a simple backend change

## Additional Findings

### Upload Flow Works Correctly ✅
The avatar upload flow works perfectly:
1. User uploads image via `/profile/me/avatar`
2. Backend saves to `/files/avatars/medium/avatar_4_*.jpg`
3. Database is updated with avatar_url
4. AvatarUploadResponse returns the new avatar_url
5. Frontend `onUploadComplete` callback receives the URL

### AuthContext Update
The `AvatarUpload` component calls `onUploadComplete` which updates local state in the profile page, but doesn't update the AuthContext. This is fine for immediate display, but on page refresh, `AuthContext.initializeAuth()` calls `getCurrentUser()` which should fetch the latest data.

### No Caching Issues
- CORS is configured correctly
- No response caching detected
- Cookies are sent correctly
- File serving works

## Implementation Priority

1. **HIGH**: Fix ProfileResponse schema (Option 1)
2. **MEDIUM**: Update AuthContext after avatar upload
3. **LOW**: Add automated tests for avatar persistence

## Testing Checklist

After implementing the fix:
- [ ] Login as test user
- [ ] Upload avatar
- [ ] Verify avatar displays immediately
- [ ] Refresh page
- [ ] Verify avatar persists after refresh
- [ ] Check browser console for errors
- [ ] Verify /profile/me returns is_active field
- [ ] Test with different image formats
- [ ] Test with multiple uploads (old files deleted correctly)
