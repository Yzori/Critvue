# Profile Integration Testing Guide

## Quick Start Testing

### 1. Prerequisites

Ensure both backend and frontend are running:

```bash
# Terminal 1 - Backend
cd /home/user/Critvue/backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd /home/user/Critvue/frontend
npm run dev
```

### 2. Test User Setup

The backend should have test users created. If not, create one:

```bash
cd /home/user/Critvue/backend
python create_mock_reviews.py
```

This creates test users with:
- Email: `user@example.com`
- Password: `testpassword123`

### 3. Basic Flow Test

1. **Login**: Navigate to `http://localhost:3000/login`
   - Email: `user@example.com`
   - Password: `testpassword123`
   - Click "Sign In"

2. **Navigate to Profile**: Click "Profile" in navigation or go to `http://localhost:3000/profile`

3. **Expected Behavior**:
   - See skeleton loader briefly (1-2 seconds)
   - Profile loads with your data
   - Stats display (reviews given, rating, response time)
   - Badges show up
   - Portfolio section shows (empty state or items)

## Test Scenarios

### Scenario 1: Successful Profile Load

**Steps:**
1. Log in as test user
2. Navigate to `/profile`

**Expected Results:**
- ✅ Skeleton loader appears immediately
- ✅ Profile loads within 2 seconds
- ✅ Avatar shows (or default gradient avatar)
- ✅ Full name displays correctly
- ✅ Title and bio show
- ✅ Specialty tags appear as badges
- ✅ Star rating displays correctly
- ✅ Stats cards show with correct numbers
- ✅ Achievements/badges render
- ✅ Portfolio section loads
- ✅ No console errors

### Scenario 2: Empty Portfolio

**Steps:**
1. Log in as user with no portfolio items
2. Navigate to `/profile`

**Expected Results:**
- ✅ Profile loads successfully
- ✅ Portfolio section shows empty state
- ✅ Message: "No Portfolio Items Yet"
- ✅ "Add Your First Project" button shows (if own profile)
- ✅ Friendly, encouraging message

### Scenario 3: Profile with Portfolio Items

**Steps:**
1. Create portfolio items via API (see below)
2. Navigate to `/profile`

**Expected Results:**
- ✅ Portfolio items display in bento grid
- ✅ First item is large (2x2 grid)
- ✅ Other items are small (1x1 grid)
- ✅ Hover effects work (overlay, scale)
- ✅ Content type badges show
- ✅ Ratings display if available
- ✅ Click opens project URL in new tab

### Scenario 4: Unauthenticated Access

**Steps:**
1. Log out or clear cookies
2. Navigate to `/profile`

**Expected Results:**
- ✅ Brief loading, then error screen
- ✅ "Authentication Required" message
- ✅ Explanation text about logging in
- ✅ "Go to Dashboard" button shows
- ✅ Button redirects to dashboard/login

### Scenario 5: Network Error

**Steps:**
1. Log in
2. Stop backend server
3. Navigate to `/profile` or refresh

**Expected Results:**
- ✅ "Connection Problem" error screen
- ✅ User-friendly error message
- ✅ "Try Again" button shows
- ✅ "Go to Dashboard" button shows
- ✅ Clicking "Try Again" attempts reload
- ✅ Error persists if backend still down

### Scenario 6: Server Error

**Steps:**
1. Temporarily break backend endpoint
2. Navigate to `/profile`

**Expected Results:**
- ✅ "Failed to Load Profile" error screen
- ✅ Generic error message
- ✅ Retry functionality works
- ✅ Can recover when backend fixed

### Scenario 7: Mobile Responsive

**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test at different widths:
   - 375px (mobile)
   - 768px (tablet)
   - 1024px (desktop)

**Expected Results:**
- ✅ Layout adapts smoothly
- ✅ No horizontal scroll
- ✅ All buttons are at least 48px tall (touch targets)
- ✅ Text remains readable
- ✅ Stats grid: 2 columns on mobile, 4 on desktop
- ✅ Portfolio grid adapts (2 cols mobile, 4 cols desktop)
- ✅ Role toggle buttons wrap nicely

### Scenario 8: Performance

**Steps:**
1. Open DevTools Network tab
2. Navigate to `/profile`
3. Check timing

**Expected Results:**
- ✅ Profile API call completes in < 500ms
- ✅ Portfolio API call completes in < 500ms
- ✅ Total page load < 2 seconds
- ✅ No unnecessary API calls
- ✅ Images lazy load

## API Testing via Console

You can test the API directly in the browser console:

### Get Profile
```javascript
// Open browser console on localhost:3000
const response = await fetch('http://localhost:8000/api/v1/profile/me', {
  credentials: 'include'
});
const profile = await response.json();
console.log('Profile:', profile);
```

### Get Portfolio
```javascript
const userId = 1; // Your user ID from profile
const response = await fetch(`http://localhost:8000/api/v1/portfolio/user/${userId}`, {
  credentials: 'include'
});
const portfolio = await response.json();
console.log('Portfolio:', portfolio);
```

### Create Portfolio Item
```javascript
const response = await fetch('http://localhost:8000/api/v1/portfolio', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Test Project',
    content_type: 'code',
    description: 'A test project',
    project_url: 'https://github.com',
    image_url: 'https://via.placeholder.com/400x300'
  })
});
const newItem = await response.json();
console.log('Created:', newItem);
```

### Update Profile
```javascript
const response = await fetch('http://localhost:8000/api/v1/profile/me', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Senior Developer',
    bio: 'I love coding and giving helpful reviews!',
    specialty_tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL']
  })
});
const updated = await response.json();
console.log('Updated:', updated);
```

## Using Python to Create Test Data

### Create Portfolio Items

```python
import requests

# Login first
login_response = requests.post('http://localhost:8000/api/v1/auth/login', json={
    'email': 'user@example.com',
    'password': 'testpassword123'
})

cookies = login_response.cookies

# Create multiple portfolio items
portfolio_items = [
    {
        'title': 'E-commerce Redesign',
        'content_type': 'design',
        'description': 'Complete UI/UX overhaul of an e-commerce platform',
        'image_url': 'https://via.placeholder.com/800x600',
        'project_url': 'https://dribbble.com',
        'is_featured': True
    },
    {
        'title': 'React Component Library',
        'content_type': 'code',
        'description': 'Reusable component library built with React and TypeScript',
        'project_url': 'https://github.com',
    },
    {
        'title': 'Brand Identity System',
        'content_type': 'design',
        'description': 'Complete brand identity with logo, colors, and guidelines',
        'image_url': 'https://via.placeholder.com/600x400',
    },
    {
        'title': 'API Documentation',
        'content_type': 'writing',
        'description': 'Comprehensive API documentation for REST service',
        'project_url': 'https://docs.example.com',
    },
]

for item in portfolio_items:
    response = requests.post(
        'http://localhost:8000/api/v1/portfolio',
        json=item,
        cookies=cookies
    )
    print(f"Created: {response.json()['title']}")
```

### Update Profile Data

```python
import requests

# Login
login_response = requests.post('http://localhost:8000/api/v1/auth/login', json={
    'email': 'user@example.com',
    'password': 'testpassword123'
})

cookies = login_response.cookies

# Update profile
response = requests.put(
    'http://localhost:8000/api/v1/profile/me',
    json={
        'title': 'Senior Full Stack Developer',
        'bio': 'Passionate about clean code and user experience. 10+ years building web applications.',
        'specialty_tags': ['React', 'TypeScript', 'Python', 'PostgreSQL', 'UI/UX']
    },
    cookies=cookies
)

print('Updated profile:', response.json())
```

## Common Issues & Solutions

### Issue: "Authentication Required" on logged-in user

**Cause**: Cookies not being sent correctly

**Solution**:
1. Check that backend and frontend are on same domain (both localhost)
2. Verify CORS settings in backend allow credentials
3. Clear cookies and log in again
4. Check Network tab for `credentials: 'include'` in requests

### Issue: Profile loads but shows default values

**Cause**: User profile not fully set up

**Solution**:
1. Update profile via API (see Python script above)
2. Or use the profile edit modal (when implemented)
3. Refresh the page

### Issue: Portfolio section empty but items exist

**Cause**:
- API returning empty array
- Wrong user ID being passed
- Portfolio items belong to different user

**Solution**:
1. Check console for API errors
2. Verify user ID matches: `console.log(profile.id)`
3. Check portfolio items in database belong to this user

### Issue: Skeleton loader shows forever

**Cause**: API call failing silently or hanging

**Solution**:
1. Open DevTools Network tab
2. Check if API call completes
3. Look for errors in console
4. Verify backend is running
5. Check backend logs for errors

### Issue: Images not loading in portfolio

**Cause**: Invalid image URLs or CORS issues

**Solution**:
1. Use valid image URLs (via.placeholder.com for testing)
2. Or use relative URLs if images stored on backend
3. Check Network tab for 404s or CORS errors

## Browser Compatibility Testing

Test in multiple browsers:

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Chrome (iOS/Android)
- ✅ Mobile Safari (iOS)

## Accessibility Testing

### Keyboard Navigation
1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test Enter/Space on buttons
4. Ensure logical tab order

### Screen Reader Testing
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through profile page
3. Verify all content is announced
4. Check ARIA labels are appropriate

### Color Contrast
1. Use DevTools Lighthouse
2. Run accessibility audit
3. Verify all text meets WCAG AA (4.5:1)
4. Check focus indicators are visible

## Performance Testing

### Lighthouse Audit
1. Open DevTools
2. Go to Lighthouse tab
3. Run audit (Desktop & Mobile)
4. Target scores:
   - Performance: 90+
   - Accessibility: 100
   - Best Practices: 100
   - SEO: 90+

### Network Throttling
1. Open DevTools Network tab
2. Select "Slow 3G" or "Fast 3G"
3. Test profile loading
4. Verify skeleton shows appropriately
5. Check total load time < 5s on 3G

## Acceptance Criteria

Profile integration is complete when:

- ✅ Profile loads with real API data
- ✅ All loading states work correctly
- ✅ All error states display appropriately
- ✅ Portfolio items render in bento grid
- ✅ Empty portfolio state shows correctly
- ✅ Mobile responsive (375px → 2xl)
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ WCAG 2.1 AA compliant
- ✅ Lighthouse scores meet targets
- ✅ Works in all major browsers
- ✅ Network errors handled gracefully
- ✅ Authentication errors handled
- ✅ Retry functionality works

## Next Steps After Testing

Once basic integration is verified:

1. **Add Profile Editing**
   - Edit modal for title, bio, tags
   - Avatar upload functionality
   - Form validation

2. **Portfolio Management**
   - Add portfolio item modal
   - Edit/delete functionality
   - Image upload

3. **View Other Profiles**
   - Support `/profile/[userId]` route
   - Different UI for other users
   - "Request Review" button

4. **Testimonials Integration**
   - Replace mock testimonials
   - Fetch real reviews
   - Pagination

5. **Caching & Optimization**
   - Implement React Query
   - Add optimistic updates
   - Reduce unnecessary re-renders
