# Reviewer Hub - Testing Guide

**Created**: 2025-11-18
**Test User**: flow@test.com
**Status**: ✅ Ready for Testing

---

## Quick Test Instructions

### 1. **Login**
- Navigate to: http://localhost:3000/login
- Email: `flow@test.com`
- Password: `testpass123`

### 2. **Access Reviewer Dashboard**
After logging in, you have **3 active reviews** ready to test:
- Click **"My Reviews"** in the top navigation (visible on desktop >1024px)
- OR click your profile avatar → **"My Reviews"** in dropdown menu
- OR open mobile menu → **"My Reviews"**

### 3. **Expected Behavior**

#### **Dashboard View** (`/dashboard?role=reviewer`)
- Should switch to "Reviewer" tab automatically
- Shows 3 active reviews:
  - Test Review Request #1 (Design) - $10
  - Test Review Request #2 (Code) - $15
  - Test Review Request #3 (Writing) - $20
- Each review shows:
  - Deadline countdown (48 hours remaining)
  - Progress indicator (0% complete - not started)
  - Payment amount
  - Content type icon and color

#### **Click Any Review**
When you click on one of the 3 reviews:
1. Routes to `/reviewer/review/[slotId]`
2. **Auto-detects** you have 3 active reviews (≥ 2)
3. **Auto-redirects** to `/reviewer/hub?slot=[slotId]`

#### **Reviewer Hub** (`/reviewer/hub`)
**Desktop View (>1024px):**
- **Left side (70%)**: Review editor panel
  - Shows current review details
  - Text editor with auto-save
  - Star rating selector
  - Submit button
- **Right side (30%)**: Active reviews sidebar
  - Lists all 3 reviews
  - Grouped by status (In Progress, Claimed, Submitted)
  - Click to switch between reviews
  - Shows current review highlighted

**Mobile View (<1024px):**
- Full-screen editor
- Bottom button: "Switch Review (3 active)"
- Tap button → Bottom drawer slides up
- Shows all 3 reviews in drawer
- Swipe down to dismiss
- Tap any review to switch

### 4. **Test Features**

#### **Auto-Save** (30 second interval)
1. Start typing in the review editor
2. Wait 30 seconds
3. Should see "Draft saved" indicator
4. Refresh page
5. Draft should load automatically

#### **Review Switching**
1. Click different review in sidebar
2. Left panel updates instantly
3. No page reload
4. URL updates: `/reviewer/hub?slot=[newSlotId]`

#### **Keyboard Shortcuts** (Desktop only)
- `Cmd/Ctrl + 1-9`: Switch to review by index
- `Cmd/Ctrl + ↑/↓`: Previous/Next review

#### **Mobile Gestures**
1. Tap "Switch Review" button
2. Drawer slides up from bottom
3. Swipe down >100px to dismiss
4. Fast swipe (velocity >500) to dismiss
5. Tap backdrop to close

---

## Test Data Details

### **User Account**
```
Email: flow@test.com
Password: testpass123
Role: creator (can do both - request AND review)
```

### **Active Reviews (Claimed)**
| Slot ID | Title | Content Type | Payment | Deadline |
|---------|-------|--------------|---------|----------|
| 38 | Test Review Request #1 | Design | $10 | 48h |
| 39 | Test Review Request #2 | Code | $15 | 48h |
| 40 | Test Review Request #3 | Writing | $20 | 48h |

---

## API Endpoints Being Tested

### **Multi-Status Query** (50% API reduction)
```
GET /api/v1/review-slots/my-slots?status=claimed,submitted
```
- Single API call instead of 2 separate calls
- Returns all active reviews in one request

### **Draft Save**
```
POST /api/v1/review-slots/{slot_id}/save-draft
```
Request body:
```json
{
  "sections": [{
    "section_id": "general_feedback",
    "section_label": "Feedback",
    "content": "Your review text here...",
    "word_count": 10,
    "required": true
  }],
  "rating": 4
}
```

### **Draft Load**
```
GET /api/v1/review-slots/{slot_id}/draft
```
Returns:
```json
{
  "sections": [...],
  "rating": 4,
  "last_saved_at": "2025-11-18T20:30:00Z"
}
```

---

## Navigation Locations

### **Desktop (>1024px)**
- **Top Nav**: Home | Browse | Dashboard | **My Reviews** | How It Works
- **User Dropdown**: Profile | **My Reviews** | Settings | Billing | Help | Sign Out

### **Mobile/Tablet (<1024px)**
- **Hamburger Menu**: Profile | **My Reviews** | Settings | Help

All navigation links route to: `/dashboard?role=reviewer`

---

## Expected Flow Diagram

```
Login (flow@test.com)
    ↓
Click "My Reviews"
    ↓
Dashboard (/dashboard?role=reviewer)
    ├─ Shows "Reviewer" tab
    ├─ Lists 3 active reviews
    └─ Click review #1
         ↓
Single Review Page (/reviewer/review/38)
    ├─ Detects 3 active reviews (≥ 2)
    └─ Auto-redirects to Hub
         ↓
Reviewer Hub (/reviewer/hub?slot=38)
    ├─ Desktop: Split-screen (70/30)
    ├─ Mobile: Full editor + bottom drawer
    ├─ Sidebar shows all 3 reviews
    ├─ Click review #2 → Switch instantly
    └─ Auto-save every 30 seconds
```

---

## Troubleshooting

### **"My Reviews" link not visible**
- Make sure you're logged in
- Check that user is authenticated (any user can review)

### **Dashboard shows empty state**
- The test data created 3 reviews for flow@test.com
- Try logging out and back in
- Check browser console for API errors

### **Not redirecting to hub**
- Hub only activates with 2+ active reviews
- Check `/reviewer/review/[slotId]` page for console logs
- Should see redirect logic in useEffect

### **Draft not saving**
- Check browser console for errors
- Verify backend is running on port 8000
- Check Network tab for failed POST requests

### **Mobile drawer not working**
- Resize browser to <1024px width
- Should see "Switch Review" button at bottom
- Try tapping button (not swiping initially)

---

## Browser Console Commands

Test API directly from console:
```javascript
// Get active reviews
fetch('/api/v1/review-slots/my-slots?status=claimed,submitted', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);

// Save draft
fetch('/api/v1/review-slots/38/save-draft', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sections: [{
      section_id: 'test',
      section_label: 'Test',
      content: 'Test content',
      word_count: 2,
      required: true
    }],
    rating: 4
  })
}).then(r => r.json()).then(console.log);
```

---

## Success Criteria

✅ **Navigation**
- "My Reviews" link appears for logged-in users
- Clicking routes to `/dashboard?role=reviewer`
- Dashboard shows Reviewer tab

✅ **Dashboard**
- Shows 3 active reviews
- Displays correct payment amounts
- Shows deadline countdown
- Displays content type icons with brand colors

✅ **Auto-Routing**
- Clicking review with 2+ active reviews redirects to hub
- URL updates to `/reviewer/hub?slot=[id]`

✅ **Hub Features**
- Desktop: Split-screen layout visible
- Mobile: Bottom drawer button visible
- Can switch between reviews
- Current review is highlighted
- Auto-save works after 30 seconds

✅ **Mobile UX**
- Drawer swipes down to dismiss
- Safe area insets respected (no content cut off)
- Touch targets ≥48px
- Smooth animations at 60fps

---

**Status**: All test data created and servers running
**Next**: Login and test the complete flow!
