# Critvue Review Workflow - End-to-End Documentation

**Last Updated**: 2025-11-17
**Purpose**: Comprehensive documentation of the complete review request lifecycle, from creation to completion.

---

## Table of Contents
1. [Overview](#overview)
2. [Review Request Creation](#review-request-creation)
3. [Pricing & Payment Options](#pricing--payment-options)
4. [Review Discovery & Browse](#review-discovery--browse)
5. [Claiming a Review Slot](#claiming-a-review-slot)
6. [Review Submission](#review-submission)
7. [Review Lifecycle States](#review-lifecycle-states)
8. [User Roles & Permissions](#user-roles--permissions)

---

## Overview

Critvue operates on a **slot-based review system** where:
- **Requesters** create review requests for their work (design, code, writing, etc.)
- **Reviewers** browse available requests and claim slots
- Each review request can have **1-5 review slots** (configurable by requester)
- Reviews can be **free** or **paid** with tiered pricing

**Key Workflow**:
```
Create Request → Publish → Browse → Claim Slot → Write Review → Submit → Accept/Reject
```

---

## Review Request Creation

### Step 1: Choose Review Type
**Endpoint**: N/A (Frontend only)
**Location**: `/dashboard` → "Request a Review" button → Type selection

**Available Types**:
- `design` - UI/UX designs, mockups, graphics, logos
- `code` - Code reviews, architecture feedback
- `writing` - Articles, documentation, copy
- `video` - Video content, editing, production
- `audio` - Podcasts, music, sound design
- `art` - Illustrations, photography, digital art

**User Action**: Click on desired review type card

---

### Step 2: Basic Information
**Location**: `/review/create?type={type}` - Step 1

**Fields**:
- **Title** (required, 5-100 chars)
  - Example: "E-commerce Dashboard Design Review"
- **Description** (required, 20-2000 chars)
  - What you want reviewed
  - Context and background
  - Specific concerns or questions

**Validation**:
```typescript
title.length >= 5 && title.length <= 100
description.length >= 20 && description.length <= 2000
```

---

### Step 3: File Upload
**Location**: `/review/create?type={type}` - Step 2
**Endpoint**: `POST /api/v1/files/upload`

**File Requirements**:
- **Max file size**: 50MB per file
- **Max total**: 200MB across all files
- **Supported formats**:
  - Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`
  - Design: `.fig`, `.sketch`, `.xd`, `.psd`, `.ai`
  - Code: `.zip`, `.tar.gz`, `.js`, `.py`, `.tsx`, etc.
  - Documents: `.pdf`, `.docx`, `.txt`, `.md`
  - Media: `.mp4`, `.mov`, `.mp3`, `.wav`

**Upload Flow**:
```
1. User selects files
2. Files upload to backend storage
3. Backend returns file metadata (id, filename, url, size)
4. Frontend stores file references for review request
```

**Response**:
```json
{
  "id": 123,
  "filename": "uuid-dashboard-design.png",
  "original_filename": "dashboard-design.png",
  "file_url": "/uploads/uuid-dashboard-design.png",
  "file_size": 2458192,
  "mime_type": "image/png",
  "uploaded_at": "2025-11-17T10:30:00Z"
}
```

---

### Step 4: Review Preferences
**Location**: `/review/create?type={type}` - Step 3

**Number of Reviews** (required):
- Dropdown: 1-5 reviewers
- Each reviewer claims one slot
- Example: Selecting "3" creates 3 available slots

**Feedback Priority** (required):
- `strengths` - Focus on what works well
- `improvements` - Focus on areas to improve
- `balanced` - Mix of both (default)

**Target Audience** (optional, max 200 chars):
- Who is this work for?
- Example: "Tech-savvy millennials, 25-35 years old"

**Additional Context** (optional, max 500 chars):
- Brand guidelines, constraints, goals
- Example: "Must follow Material Design 3 guidelines"

---

### Step 5: Pricing Selection
**Location**: `/review/create?type={type}` - Step 4

#### Option A: Free Review
**Selection**: "Free Review" toggle

**Implications**:
- No payment required
- Reviews may take longer to fill
- Lower priority in browse feed
- Best for community feedback or portfolio pieces

**Database**:
```python
is_paid = False
payment_status = None
price_per_review = 0.00
```

---

#### Option B: Paid Review - Expert Tiers
**Selection**: Choose one of three tiers

##### Tier 1: Quick Feedback
**Price Range**: $5 - $15 per review
**Turnaround**: 24-48 hours
**Review Length**: 200-500 words
**Depth**: Surface-level, quick wins, obvious issues

**Best For**:
- Quick sanity checks
- Early-stage drafts
- Budget-conscious projects
- Fast iteration cycles

**Expert Level**: Junior to Mid-level reviewers

---

##### Tier 2: Standard Review (DEFAULT)
**Price Range**: $25 - $75 per review
**Turnaround**: 3-5 days
**Review Length**: 500-1000 words
**Depth**: Thorough analysis, actionable insights

**Best For**:
- Production-ready work
- Detailed feedback needed
- Most common use case
- Professional projects

**Expert Level**: Mid to Senior-level reviewers

---

##### Tier 3: Deep Dive Analysis
**Price Range**: $100 - $200+ per review
**Turnaround**: 5-7 days
**Review Length**: 1000+ words
**Depth**: Comprehensive analysis, strategic recommendations

**Best For**:
- Critical projects
- Strategic decisions
- Architecture reviews
- High-stakes launches

**Expert Level**: Senior experts, specialists

---

**Pricing Calculation**:
```
Total Cost = Price Per Review × Number of Reviews

Examples:
- 3 Standard reviews at $50 each = $150 total
- 1 Deep Dive at $150 = $150 total
- 5 Quick reviews at $10 each = $50 total
```

**Database Schema**:
```python
class ReviewRequest:
    is_paid: bool
    review_tier: Optional[ReviewTier]  # quick_feedback | standard | deep_dive
    price_per_review: Decimal
    total_price: Decimal  # Auto-calculated
    payment_status: Optional[PaymentStatus]
    stripe_payment_intent_id: Optional[str]
```

---

### Step 6: Payment (Paid Reviews Only)
**Location**: `/review/create?type={type}` - Step 5
**Endpoint**: `POST /api/v1/payments/create-payment-intent`

**Flow for Paid Reviews**:

1. **Create Payment Intent**
   ```json
   POST /api/v1/payments/create-payment-intent
   {
     "amount": 15000,  // $150.00 in cents
     "currency": "usd",
     "description": "3 Standard Reviews - E-commerce Dashboard Design"
   }
   ```

2. **Stripe Elements UI**
   - Card number input
   - Expiry date
   - CVC
   - Cardholder name
   - Billing zip code

3. **Confirm Payment**
   ```typescript
   const { error, paymentIntent } = await stripe.confirmCardPayment(
     clientSecret,
     { payment_method: { card: cardElement } }
   );
   ```

4. **Payment Status**
   - `pending` - Payment intent created
   - `processing` - Payment being processed
   - `succeeded` - Payment successful ✅
   - `failed` - Payment declined ❌
   - `refunded` - Payment refunded

**Validation**:
- Review request only published after `payment_status = 'succeeded'`
- Failed payments prevent request creation
- Payment intent ID stored in `stripe_payment_intent_id`

---

### Step 7: Review & Publish
**Location**: `/review/create?type={type}` - Step 6
**Endpoint**: `POST /api/v1/reviews`

**Review Summary Shows**:
- Review type and title
- Number of reviewers requested
- Pricing tier (if paid) and total cost
- Files uploaded (count and total size)
- Feedback preferences
- Payment status (if paid)

**Publish Actions**:

#### Option A: Save as Draft
```json
POST /api/v1/reviews
{
  "status": "draft",
  "title": "E-commerce Dashboard Design Review",
  "description": "...",
  "content_type": "design",
  "reviews_requested": 3,
  "is_paid": true,
  "review_tier": "standard",
  "price_per_review": 50.00,
  // ... other fields
}
```

**Draft Behavior**:
- Saved in database with `status = 'draft'`
- NOT visible in browse feed
- Can be edited later
- No slots created yet
- Payment captured but held

---

#### Option B: Publish Immediately
```json
POST /api/v1/reviews
{
  "status": "pending",  // Auto-creates slots
  // ... same fields as draft
}
```

**Publish Behavior**:
1. Review request created with `status = 'pending'`
2. **Slots auto-generated**:
   ```python
   for i in range(reviews_requested):
       slot = ReviewSlot(
           review_request_id=review.id,
           status='available',
           slot_number=i+1,
           reviewer_id=None
       )
   ```
3. Appears in browse feed immediately
4. Email confirmation sent to requester
5. Payment finalized (for paid reviews)

---

## Pricing & Payment Options

### Free vs. Paid Comparison

| Feature | Free Review | Paid Review |
|---------|-------------|-------------|
| **Cost** | $0 | $5 - $200+ per review |
| **Priority** | Lower in feed | Higher in feed |
| **Turnaround** | No guarantee | 24hr - 7 days (tier-dependent) |
| **Review Quality** | Variable | Tiered expertise |
| **Reviewer Pool** | Community | Verified experts only |
| **Refund Policy** | N/A | Yes, if not delivered |

---

### Payment Flow Architecture

```
User Creates Paid Request
         ↓
[Frontend] Calculate total_price = price_per_review × reviews_requested
         ↓
[Backend] Create Stripe Payment Intent
         ↓
[Frontend] Show Stripe Elements form
         ↓
User Enters Card Details
         ↓
[Stripe] Process Payment
         ↓
    SUCCESS? ──→ [Yes] ──→ Publish request + Create slots
         ↓
        [No] ──→ Show error + Allow retry
```

---

## Review Discovery & Browse

### Browse Page
**Location**: `/browse`
**Endpoint**: `GET /api/v1/browse`

**Query Parameters**:
```typescript
{
  content_type?: 'design' | 'code' | 'writing' | 'video' | 'audio' | 'art'
  is_paid?: boolean
  min_price?: number
  max_price?: number
  review_tier?: 'quick_feedback' | 'standard' | 'deep_dive'
  sort_by?: 'created_at' | 'price' | 'deadline'
  limit?: number  // Default: 20
  offset?: number  // Default: 0
}
```

**Example Requests**:
```bash
# All design reviews
GET /api/v1/browse?content_type=design

# Paid reviews between $25-$75
GET /api/v1/browse?is_paid=true&min_price=25&max_price=75

# Standard tier reviews only
GET /api/v1/browse?review_tier=standard

# Sort by highest price first
GET /api/v1/browse?sort_by=price&order=desc
```

---

### Browse Response
```json
{
  "items": [
    {
      "id": 26,
      "title": "E-commerce Dashboard Design Review",
      "description": "Need feedback on checkout flow...",
      "content_type": "design",
      "status": "pending",
      "is_paid": true,
      "review_tier": "standard",
      "price_per_review": 50.00,
      "reviews_requested": 3,
      "reviews_claimed": 1,
      "reviews_completed": 0,
      "created_at": "2025-11-17T10:00:00Z",
      "deadline": "2025-11-22T10:00:00Z",
      "requester": {
        "id": 5,
        "full_name": "Jane Designer",
        "avatar_url": "/uploads/avatar-jane.jpg"
      },
      "slots": [
        {"status": "claimed", "reviewer_id": 12},
        {"status": "available", "reviewer_id": null},
        {"status": "available", "reviewer_id": null}
      ],
      "files_count": 4,
      "total_file_size": 12500000
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

### Privacy & Visibility Rules

**What Reviewers See in Browse**:
- ✅ Review title, description, type
- ✅ Number of available vs. claimed slots
- ✅ Pricing tier and amount (if paid)
- ✅ Requester public profile
- ✅ File count and total size
- ❌ Actual submitted reviews from other reviewers
- ❌ Requester's private info

**Slot Visibility**:
```python
# In browse endpoint
slots = [
    {
        "status": slot.status,
        "reviewer_id": slot.reviewer_id if slot.status != 'submitted' else None
    }
    for slot in review.slots
]
# Only show reviewer_id for claimed/available, hide for submitted reviews
```

---

## Claiming a Review Slot

### Prerequisites for Claiming
**User must**:
1. Be logged in
2. NOT be the review request owner
3. Review must have `status = 'pending'` or `status = 'in_review'`
4. At least one slot with `status = 'available'`
5. User must NOT already have a claimed slot on this review

---

### Claim Flow

**Location**: Review detail page `/review/{id}`
**Endpoint**: `POST /api/v1/browse/claim/{review_request_id}`

**Frontend Logic** (`action-bar.tsx:52-66`):
```typescript
const canClaimSlot = React.useMemo(() => {
  if (!currentUserId || isOwner) return false;

  // Allow claiming if review is pending or in_review with available slots
  if (review.status !== "pending" && review.status !== "in_review") {
    return false;
  }

  // Check if there are available slots
  const availableSlots = review.slots?.filter(
    (s) => s.status === "available"
  ).length || 0;
  if (availableSlots === 0) return false;

  // Check if user already has a claimed slot
  const userSlots = review.slots?.filter(
    (s) => s.reviewer_id === currentUserId
  ) || [];
  return userSlots.length === 0;
}, [currentUserId, isOwner, review]);
```

---

### Backend Claim Logic

**Request**:
```bash
POST /api/v1/browse/claim/26
Authorization: Bearer {token}
# OR uses httpOnly cookies
```

**Backend Processing** (`backend/app/api/v1/endpoints/browse.py`):
```python
@router.post("/claim/{review_request_id}")
async def claim_review_slot(
    review_request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch review request
    review = await db.get(ReviewRequest, review_request_id)
    if not review:
        raise HTTPException(404, "Review request not found")

    # 2. Check if user is owner
    if review.requester_id == current_user.id:
        raise HTTPException(400, "Cannot claim your own review")

    # 3. Check review status
    if review.status not in ['pending', 'in_review']:
        raise HTTPException(400, f"Review is {review.status}, cannot claim")

    # 4. Find available slot
    available_slot = await db.execute(
        select(ReviewSlot)
        .where(ReviewSlot.review_request_id == review_request_id)
        .where(ReviewSlot.status == 'available')
        .limit(1)
    )
    slot = available_slot.scalar_one_or_none()

    if not slot:
        raise HTTPException(400, "No available slots")

    # 5. Check if user already claimed
    existing = await db.execute(
        select(ReviewSlot)
        .where(ReviewSlot.review_request_id == review_request_id)
        .where(ReviewSlot.reviewer_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Already claimed a slot")

    # 6. Claim the slot
    slot.reviewer_id = current_user.id
    slot.status = 'claimed'
    slot.claimed_at = datetime.utcnow()
    slot.deadline = datetime.utcnow() + timedelta(days=get_turnaround_days(review.review_tier))

    # 7. Update review status to in_review if first claim
    if review.status == 'pending':
        review.status = 'in_review'

    await db.commit()

    return {"slot_id": slot.id, "message": "Slot claimed successfully"}
```

**Response**:
```json
{
  "slot_id": 142,
  "message": "Slot claimed successfully"
}
```

---

### Post-Claim Actions

**Frontend** (`action-bar.tsx:79-81`):
```typescript
toast.success("Slot claimed successfully!", {
  description: "Redirecting to review writing page...",
});

setTimeout(() => {
  router.push(`/reviewer/review/${result.slot_id}`);
}, 500);
```

**User is redirected to**: `/reviewer/review/142`

---

### Status Transitions on Claim

**Review Request Status**:
```
pending (0 claimed)
    ↓ [First claim]
in_review (1+ claimed, but not all)
    ↓ [All slots claimed]
in_review (all claimed)
```

**Review Slot Status**:
```
available
    ↓ [User claims]
claimed
```

---

## Review Submission

### Reviewer Dashboard
**Location**: `/dashboard` (reviewer view)
**Endpoint**: `GET /api/v1/review-slots/my-slots`

**Shows**:
- Active reviews (status: `claimed`)
- Submitted reviews (status: `submitted`)
- Accepted reviews (status: `accepted`)
- Deadlines and urgency indicators

**Click on review** → Redirect to `/reviewer/review/{slot_id}`

---

### Review Writing Interface
**Location**: `/reviewer/review/{slot_id}`
**Components**:
- `app/reviewer/review/[slotId]/page.tsx` - Page container
- `components/reviewer/review-editor.tsx` - Review form

**Current Features**:
- ⭐ Star rating (1-5 stars, required)
- 📝 Review text (50-10,000 chars, required)
- 📎 File attachments (optional)
- ✅ Quality checklist (3 items)
- 💾 Auto-save every 30 seconds
- 🔄 Character counter

**Planned Features** (from brainstorming):
- 📌 Pin annotations on images
- 🎯 Structured feedback sections
- 🗂️ Tabbed interface (Pins / Overall / Rating)

---

### Draft Auto-Save
**Endpoint**: `PUT /api/v1/review-slots/{slot_id}/draft`

**Auto-save triggers**:
- Every 30 seconds if content changed
- On blur of textarea
- Before navigation away

**Request**:
```json
PUT /api/v1/review-slots/142/draft
{
  "draft_text": "The dashboard layout is clean, but the color contrast...",
  "draft_rating": 4,
  "last_saved_at": "2025-11-17T14:23:00Z"
}
```

**Response**:
```json
{
  "message": "Draft saved",
  "slot_id": 142,
  "saved_at": "2025-11-17T14:23:05Z"
}
```

---

### Submit Review
**Endpoint**: `POST /api/v1/review-slots/{slot_id}/submit`

**Validation**:
```typescript
rating >= 1 && rating <= 5
reviewText.length >= 50 && reviewText.length <= 10000
qualityChecklist.every(item => item.checked === true)
```

**Request**:
```json
POST /api/v1/review-slots/142/submit
{
  "review_text": "Comprehensive feedback here...",
  "rating": 4,
  "attachments": [123, 456]  // File IDs
}
```

**Backend Processing**:
```python
# 1. Validate slot belongs to current user
# 2. Validate slot status is 'claimed'
# 3. Validate review content (length, rating)
# 4. Update slot
slot.status = 'submitted'
slot.review_text = review_text
slot.rating = rating
slot.submitted_at = datetime.utcnow()

# 5. Check if all slots are submitted
all_submitted = all(s.status == 'submitted' for s in review.slots)
if all_submitted:
    review.status = 'completed'
    # Notify requester

await db.commit()
```

**Response**:
```json
{
  "message": "Review submitted successfully",
  "slot_id": 142,
  "status": "submitted"
}
```

**Status Transitions**:
```
claimed
    ↓ [Reviewer submits]
submitted
```

---

## Review Lifecycle States

### Review Request Statuses

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| `draft` | Created but not published | Edit, Delete, Publish |
| `pending` | Published, no claims yet | Claim slot |
| `in_review` | 1+ slots claimed | Claim remaining slots, Submit review |
| `completed` | All reviews submitted | Accept/Reject reviews |
| `closed` | All reviews accepted | View only |

---

### Review Slot Statuses

| Status | Description | Who Can See | Next State |
|--------|-------------|-------------|------------|
| `available` | Open for claiming | Everyone | `claimed` |
| `claimed` | Reviewer claimed | Owner + Reviewer | `submitted` |
| `submitted` | Review written | Owner + Reviewer | `accepted` or `rejected` |
| `accepted` | Owner approved | Owner + Reviewer | Terminal |
| `rejected` | Owner rejected | Owner + Reviewer | Terminal |

---

### State Diagram

```
[Create Request]
    ↓
[draft] ──────────→ [Delete]
    ↓ publish
[pending] ─────────→ available slot
    ↓ first claim
[in_review]
    ↓ all claimed
[in_review] (all slots filled)
    ↓ all submitted
[completed] ───────→ Accept/Reject slots
    ↓ all accepted
[closed]
```

**Slot Lifecycle**:
```
[available]
    ↓ claim
[claimed] ───────→ Write review
    ↓ submit
[submitted] ─────→ Owner decision
    ↓
[accepted] or [rejected]
```

---

## User Roles & Permissions

### Requester Permissions

**Can**:
- ✅ Create review requests
- ✅ Edit own drafts
- ✅ Delete own drafts (not published)
- ✅ View all slots on their requests
- ✅ See all submitted reviews (even from other reviewers)
- ✅ Accept/reject submitted reviews
- ✅ Download attached files

**Cannot**:
- ❌ Claim own review requests
- ❌ Edit published requests
- ❌ See draft reviews before submission

---

### Reviewer Permissions

**Can**:
- ✅ Browse all published requests
- ✅ Claim available slots (1 per request max)
- ✅ Write and submit reviews
- ✅ View own claimed/submitted reviews
- ✅ Download files from claimed reviews
- ✅ Edit draft reviews before submission

**Cannot**:
- ❌ Claim own requests
- ❌ See other reviewers' submitted work (privacy)
- ❌ Claim multiple slots on same request
- ❌ Edit submitted reviews
- ❌ See requester contact info (unless accepted)

---

### Privacy Matrix

| Data | Requester | Assigned Reviewer | Other Reviewers | Public |
|------|-----------|-------------------|-----------------|--------|
| Review title/desc | ✅ | ✅ | ✅ | ✅ |
| Uploaded files | ✅ | ✅ | ❌ | ❌ |
| Available slots | ✅ | ✅ | ✅ | ✅ |
| Claimed slots | ✅ | ✅ (own) | ❌ (others) | ❌ |
| Submitted reviews | ✅ (all) | ✅ (own) | ❌ (others) | ❌ |
| Requester email | ✅ | ❌ | ❌ | ❌ |
| Reviewer email | ✅ | ✅ (own) | ❌ | ❌ |

**Key Privacy Rule**:
> Submitted reviews from other reviewers are HIDDEN until the owner accepts them. This prevents review bias and ensures independent feedback.

---

## Key Endpoints Summary

### Review Request Management
```bash
POST   /api/v1/reviews              # Create review request
GET    /api/v1/reviews/{id}         # Get review details
PUT    /api/v1/reviews/{id}         # Update draft
DELETE /api/v1/reviews/{id}         # Delete draft
GET    /api/v1/reviews/my-requests  # List my requests
```

### Browse & Discovery
```bash
GET    /api/v1/browse               # Browse all reviews
GET    /api/v1/browse?content_type=design&is_paid=true
```

### Claiming
```bash
POST   /api/v1/browse/claim/{review_request_id}
```

### Review Submission
```bash
GET    /api/v1/review-slots/my-slots          # My claimed reviews
GET    /api/v1/review-slots/{slot_id}         # Slot details
PUT    /api/v1/review-slots/{slot_id}/draft   # Save draft
POST   /api/v1/review-slots/{slot_id}/submit  # Submit review
```

### File Management
```bash
POST   /api/v1/files/upload         # Upload file
GET    /api/v1/files/{filename}     # Download file
```

### Payments (Paid Reviews)
```bash
POST   /api/v1/payments/create-payment-intent
GET    /api/v1/payments/status/{payment_intent_id}
```

---

## Example User Journeys

### Journey 1: Designer Requests Paid Review

1. **Sarah (Designer)** logs into Critvue
2. Clicks "Request a Review" from dashboard
3. Selects "Design" review type
4. Fills in:
   - Title: "Mobile App Onboarding Flow"
   - Description: "Need feedback on 3-screen onboarding..."
   - Uploads 3 PNG files (12MB total)
5. Sets preferences:
   - Number of reviews: 2
   - Feedback priority: Balanced
   - Target audience: "Gen Z mobile users"
6. Selects **Standard Review** tier ($50 per review)
   - Total cost: $100
7. Enters payment details (Stripe)
8. Payment succeeds ✅
9. Review published with 2 available slots
10. Receives confirmation email

**Database State**:
```python
ReviewRequest(
    id=27,
    status='pending',
    reviews_requested=2,
    is_paid=True,
    review_tier='standard',
    price_per_review=50.00,
    total_price=100.00,
    payment_status='succeeded'
)

ReviewSlot(id=143, status='available', reviewer_id=None)
ReviewSlot(id=144, status='available', reviewer_id=None)
```

---

### Journey 2: Reviewer Claims and Submits

1. **Alex (Reviewer)** browses `/browse`
2. Filters: `content_type=design`, `review_tier=standard`
3. Sees Sarah's "Mobile App Onboarding Flow" review
4. Clicks to view details
5. Sees "Claim Slot" button (status: pending, 2 available)
6. Clicks "Claim Slot"
7. Backend assigns slot #143 to Alex
8. Redirected to `/reviewer/review/143`
9. Sees review request details + files
10. Writes 800-word review over 2 days
11. Gives 4-star rating
12. Clicks "Submit Review"
13. Review saved with status `submitted`

**Database State**:
```python
ReviewSlot(
    id=143,
    status='submitted',
    reviewer_id=12,  # Alex
    review_text="The onboarding flow is clean...",
    rating=4,
    claimed_at='2025-11-17T10:00:00Z',
    submitted_at='2025-11-19T15:30:00Z'
)

# Review request still in_review (1 slot remaining)
ReviewRequest(id=27, status='in_review', reviews_claimed=1)
```

---

### Journey 3: Multiple Reviewers Complete

1. **Taylor (Reviewer)** claims slot #144
2. Writes review and submits
3. Now both slots are `submitted`
4. Review request auto-updates to `status='completed'`
5. **Sarah** receives email: "All reviews submitted!"
6. Sarah logs in, views both reviews
7. Accepts both reviews
8. Slots update to `status='accepted'`
9. Review request updates to `status='closed'`
10. Payments released to Alex and Taylor

---

## Technical Implementation Notes

### Database Models

**ReviewRequest**:
```python
id, title, description, content_type, status,
requester_id, reviews_requested, is_paid,
review_tier, price_per_review, total_price,
payment_status, stripe_payment_intent_id,
feedback_priority, target_audience, additional_context,
created_at, updated_at, deadline
```

**ReviewSlot**:
```python
id, review_request_id, slot_number, status,
reviewer_id, rating, review_text, attachments,
claimed_at, submitted_at, deadline,
created_at, updated_at
```

**File**:
```python
id, filename, original_filename, file_url,
file_size, mime_type, uploader_id,
uploaded_at
```

---

### Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | Dashboard | Show my requests + claimed reviews |
| `/review/create?type={type}` | CreateReview | 7-step creation flow |
| `/browse` | Browse | Discover reviews to claim |
| `/review/{id}` | ReviewDetail | View request + claim button |
| `/reviewer/review/{slotId}` | ReviewEditor | Write and submit review |
| `/profile` | Profile | User settings |

---

## Future Enhancements

### Planned Features
- [ ] Pin annotation system (visual feedback)
- [ ] Structured feedback templates per content type
- [ ] Real-time collaboration (multiple reviewers on call)
- [ ] Video feedback recordings
- [ ] Review disputes and mediation
- [ ] Reviewer reputation and badges
- [ ] Advanced search and filters
- [ ] Analytics dashboard for requesters
- [ ] Subscription plans for frequent users

---

## Questions for Team Discussion

1. **Pricing Strategy**:
   - Are the tier prices ($5-15, $25-75, $100-200+) appropriate?
   - Should we allow custom pricing within tiers?
   - Commission split between platform and reviewers?

2. **Quality Control**:
   - How do we ensure review quality?
   - Should we have minimum word counts per tier?
   - Reviewer vetting process?

3. **Dispute Resolution**:
   - What if requester rejects all reviews?
   - Refund policy for poor-quality reviews?
   - Escalation process?

4. **Turnaround Times**:
   - How to enforce deadlines?
   - Penalties for late submissions?
   - Auto-refund if deadline missed?

5. **Pin Annotation System**:
   - Should pins be required for design reviews?
   - How to handle non-visual content types?
   - Storage and display of annotated images?

---

**Document Version**: 1.0
**Next Review**: After team discussion
