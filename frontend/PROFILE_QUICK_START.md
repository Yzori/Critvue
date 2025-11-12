# Profile Integration - Quick Start

## 5-Minute Setup

### 1. Start Services

```bash
# Terminal 1 - Backend
cd /home/user/Critvue/backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd /home/user/Critvue/frontend
npm run dev
```

### 2. Login

Navigate to: `http://localhost:3000/login`

**Test Credentials:**
- Email: `user@example.com`
- Password: `testpassword123`

### 3. View Profile

Navigate to: `http://localhost:3000/profile`

You should see your profile load with real data from the API!

## What You'll See

### On First Load
1. **Skeleton Loader** (1-2 seconds)
   - Animated placeholder UI
   - Shows where content will appear

2. **Profile Data Loads**
   - Your name, title, bio
   - Avatar (or default gradient)
   - Star rating
   - Specialty tags

3. **Stats Dashboard**
   - Reviews given
   - Average rating
   - Response time
   - Member since date

4. **Achievement Badges**
   - Your earned badges
   - Scrollable list

5. **Portfolio Section**
   - Your portfolio items (if any)
   - Empty state if none
   - Bento grid layout

## API Usage Examples

### In Components

```typescript
import { getMyProfile, updateProfile } from "@/lib/api/profile";
import { getUserPortfolio } from "@/lib/api/portfolio";

// Get profile
const profile = await getMyProfile();
console.log(profile);
// {
//   id: "1",
//   username: "user",
//   full_name: "John Doe",
//   title: "Developer",
//   ...
// }

// Update profile
const updated = await updateProfile({
  title: "Senior Developer",
  bio: "I love code reviews!",
  specialty_tags: ["React", "TypeScript"]
});

// Get portfolio
const portfolio = await getUserPortfolio(Number(profile.id));
console.log(portfolio.items);
```

### In Browser Console

Open DevTools console on `localhost:3000`:

```javascript
// Get your profile
const response = await fetch('http://localhost:8000/api/v1/profile/me', {
  credentials: 'include'
});
const profile = await response.json();
console.log('Profile:', profile);

// Update your profile
const updateResponse = await fetch('http://localhost:8000/api/v1/profile/me', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'UX Designer',
    bio: 'Passionate about user experience',
    specialty_tags: ['UI/UX', 'Figma', 'React']
  })
});
const updated = await updateResponse.json();
console.log('Updated:', updated);
```

## Create Test Data

### Add Portfolio Items

```javascript
// In browser console on localhost:3000
const items = [
  {
    title: 'My First Project',
    content_type: 'code',
    description: 'A cool React app',
    project_url: 'https://github.com/user/project'
  },
  {
    title: 'Design System',
    content_type: 'design',
    description: 'Complete UI kit',
    image_url: 'https://via.placeholder.com/600x400'
  }
];

for (const item of items) {
  const response = await fetch('http://localhost:8000/api/v1/portfolio', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  const created = await response.json();
  console.log('Created:', created.title);
}

// Refresh the page to see your portfolio items!
```

### Using Python

```python
import requests

# Login
session = requests.Session()
login_response = session.post('http://localhost:8000/api/v1/auth/login', json={
    'email': 'user@example.com',
    'password': 'testpassword123'
})

# Update profile
profile_response = session.put('http://localhost:8000/api/v1/profile/me', json={
    'title': 'Full Stack Developer',
    'bio': 'Building great products with React and Python',
    'specialty_tags': ['React', 'TypeScript', 'Python', 'FastAPI']
})
print('Profile updated:', profile_response.json()['title'])

# Create portfolio items
portfolio_items = [
    {
        'title': 'E-commerce Platform',
        'content_type': 'code',
        'description': 'Full-stack e-commerce with React and FastAPI',
        'project_url': 'https://github.com/user/ecommerce',
        'is_featured': True
    },
    {
        'title': 'Mobile App Design',
        'content_type': 'design',
        'description': 'iOS and Android app designs',
        'image_url': 'https://via.placeholder.com/800x600'
    }
]

for item in portfolio_items:
    response = session.post('http://localhost:8000/api/v1/portfolio', json=item)
    print(f"Created: {response.json()['title']}")

print("\nRefresh http://localhost:3000/profile to see changes!")
```

## Common Workflows

### View Your Profile
```typescript
// Profile page automatically loads on mount
// Navigate to /profile - that's it!
```

### Handle Errors
```typescript
// Errors are automatically caught and displayed
// User sees friendly error message with retry button
// No code needed - it's built in!
```

### Empty Portfolio
```typescript
// If you have no portfolio items:
// 1. Profile loads successfully
// 2. Portfolio section shows empty state
// 3. Friendly message: "No Portfolio Items Yet"
// 4. Button to add first project (UI only for now)
```

### Update Your Data
```typescript
// Option 1: Use API directly
import { updateProfile } from "@/lib/api/profile";
await updateProfile({
  title: "New Title",
  bio: "New bio",
  specialty_tags: ["React", "Node"]
});

// Option 2: Use browser console
const response = await fetch('http://localhost:8000/api/v1/profile/me', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "New Title",
    bio: "New bio"
  })
});

// Refresh page to see changes
window.location.reload();
```

## Troubleshooting

### Profile Won't Load

**Check:**
1. Backend is running (Terminal 1)
2. Frontend is running (Terminal 2)
3. You're logged in (check cookies in DevTools)
4. No console errors (open DevTools F12)

**Fix:**
```bash
# Restart backend
cd /home/user/Critvue/backend
source venv/bin/activate
uvicorn app.main:app --reload

# Clear cache and reload
# In browser: Ctrl+Shift+R (hard reload)
```

### "Authentication Required" Error

**Cause:** Not logged in or cookies expired

**Fix:**
1. Go to `/login`
2. Log in with test credentials
3. Navigate back to `/profile`

### Empty Profile Data

**Cause:** Profile not set up yet

**Fix:**
```javascript
// In browser console
await fetch('http://localhost:8000/api/v1/profile/me', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Developer',
    bio: 'I love coding!',
    specialty_tags: ['React', 'TypeScript']
  })
});
location.reload();
```

### Portfolio Not Showing

**Cause:** No portfolio items created

**Fix:**
```javascript
// Create test portfolio item
await fetch('http://localhost:8000/api/v1/portfolio', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Project',
    content_type: 'code',
    description: 'Cool project',
    project_url: 'https://github.com'
  })
});
location.reload();
```

## File Structure

```
frontend/
├── app/
│   └── profile/
│       └── page.tsx              ← Main profile page (UPDATED)
├── components/
│   └── profile/
│       ├── profile-skeleton.tsx  ← Loading states (NEW)
│       └── error-states.tsx      ← Error handling (NEW)
└── lib/
    └── api/
        ├── profile.ts            ← Profile API (NEW)
        └── portfolio.ts          ← Portfolio API (NEW)
```

## Next Steps

### Now Working:
- ✅ View your profile
- ✅ See real data from API
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states
- ✅ Portfolio display

### Coming Soon:
- ⏳ Edit profile (modal)
- ⏳ Upload avatar
- ⏳ Add portfolio items (UI)
- ⏳ Edit/delete portfolio
- ⏳ View other users' profiles

## Key Files

### API Clients
- `/frontend/lib/api/profile.ts` - Profile operations
- `/frontend/lib/api/portfolio.ts` - Portfolio operations

### Components
- `/frontend/app/profile/page.tsx` - Main page
- `/frontend/components/profile/profile-skeleton.tsx` - Loaders
- `/frontend/components/profile/error-states.tsx` - Errors

### Documentation
- `/frontend/PROFILE_INTEGRATION_COMPLETE.md` - Full guide
- `/frontend/PROFILE_TESTING_GUIDE.md` - Test scenarios
- `/home/user/Critvue/PROFILE_INTEGRATION_SUMMARY.md` - Summary

## Quick Commands

```bash
# Start both services
cd /home/user/Critvue && (cd backend && source venv/bin/activate && uvicorn app.main:app --reload) & (cd frontend && npm run dev)

# View logs
# Backend: Terminal 1
# Frontend: Terminal 2

# Stop services
# Ctrl+C in both terminals

# Clear cookies (if login issues)
# Browser DevTools → Application → Cookies → Clear
```

## Success Indicators

Profile integration is working when:
- ✅ Skeleton shows briefly on load
- ✅ Profile data appears (name, title, bio)
- ✅ Stats display correctly
- ✅ Portfolio section shows (empty state or items)
- ✅ No console errors
- ✅ Page is responsive
- ✅ Retry buttons work on errors

That's it! You're ready to use the profile integration. 🎉
