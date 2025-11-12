# Review Lifecycle UX Design
## Complete UX Flow for Review Acceptance/Rejection & Multi-Review Management

**Last Updated:** 2025-11-12
**Status:** Design Specification
**Brand Compliance:** High Priority

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Challenge 1: Free Reviews - Number Selection](#challenge-1-free-reviews---number-selection)
3. [Challenge 2: Review Submission & Acceptance Flow](#challenge-2-review-submission--acceptance-flow)
4. [Challenge 3: Multiple Reviews Management](#challenge-3-multiple-reviews-management)
5. [Challenge 4: Review Quality Assurance](#challenge-4-review-quality-assurance)
6. [Challenge 5: Auto-Accept Policy](#challenge-5-auto-accept-policy)
7. [Component Specifications](#component-specifications)
8. [Mobile Optimizations](#mobile-optimizations)
9. [Accessibility Requirements](#accessibility-requirements)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Design Philosophy

### Brand-Aligned Principles

1. **Clarity Over Cleverness**: Every state, action, and consequence should be immediately clear
2. **Progressive Disclosure**: Show complexity only when needed, maintain clean defaults
3. **Trust Through Transparency**: Users should always know what happens next
4. **Mobile-First Excellence**: 44px+ touch targets, thumb-friendly layouts, swipe patterns
5. **Micro-Interactions**: Subtle animations that reinforce actions and state changes

### Design System Tokens Used

```css
/* Colors */
--accent-blue: #3B82F6      /* Primary actions, selected states */
--accent-peach: #F97316     /* Expert reviews, premium features */
--accent-sage: #4ADE80      /* Success, available slots */
--amber-500: #F59E0B        /* Warnings, urgency */
--red-600: #DC2626          /* Errors, rejections */
--green-600: #16A34A        /* Success, acceptance */

/* Shadows (2025 tiered system) */
--shadow-xs: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)
--shadow-md: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.06)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.05)

/* Border Radius */
--radius-lg: 1rem (16px)
--radius-xl: 1.5rem (24px)
--radius-2xl: 2rem (32px)

/* Spacing (4pt/8pt scale) */
Increments: 4px, 8px, 12px, 16px, 24px, 32px, 48px
```

---

## Challenge 1: Free Reviews - Number Selection

### Decision: Allow 1-3 Reviews for Free Users

**Rationale:**
- Reduces friction for new users
- Allows comparison of multiple perspectives (product-market fit)
- Creates upgrade path (4-10 requires paid tier)
- Differentiates from single-review competitors

### UX Implementation

#### Updated Review Type Step Component

**Location:** `/components/review-flow/review-type-step.tsx` (modifications)

```typescript
// Updated review types configuration
const reviewTypes: ReviewTypeOption[] = [
  {
    type: "free",
    icon: <Sparkles className="size-6 text-white" />,
    title: "Quick Feedback",
    price: "Free",
    description: "AI-powered analysis plus up to 3 community reviews",
    features: [
      "Instant AI analysis",
      "Up to 3 community reviews",         // CHANGED
      "Basic insights",
      "Public reviews visible to all",
    ],
    // ... rest unchanged
  },
  {
    type: "expert",
    // ... price now shows "Starting at $29"
    description: "In-depth review from 1-10 industry professionals",  // CHANGED
    features: [
      "Choose 1-10 expert reviewers",      // NEW
      "Professional reviewer match",
      "Detailed written feedback",
      "Video walkthrough included",
      "1-on-1 follow-up session",
    ],
  },
];
```

#### Number of Reviews UI - Component Design

**Component:** `NumberOfReviewsSelector`
**File:** `/components/review-flow/number-of-reviews-selector.tsx`

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  How many reviews do you want?                                  │
│                                                                  │
│  [Slider: 1 ━━━━━●━━━━━ 3]  FREE                              │
│         ^         ^         ^                                   │
│         1         2         3                                   │
│                                                                  │
│  Get multiple perspectives on your work                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  💡 Pro Tip                                                │ │
│  │  Request 2-3 reviews to get diverse feedback and identify │ │
│  │  common themes across reviewers.                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**For Paid/Expert Reviews:**

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  How many expert reviews? (1-10)                                │
│                                                                  │
│  [Slider: 1 ━━━━━━●━━━━━━━━━━━━ 10]  $58                      │
│         ^           ^           ^                               │
│         1           5          10                               │
│                                                                  │
│  Budget adjusts automatically ($29 × 2 = $58)                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ⚡ Fast Track Available                                   │ │
│  │  Get all reviews completed within 6 hours                  │ │
│  │  2 experts selected: Est. $58 • Within 4 hours            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Visual Hierarchy

```typescript
// Component structure
<div className="space-y-6">
  {/* Header */}
  <div className="space-y-2">
    <Label className="text-lg font-semibold">
      How many {selectedType === 'free' ? 'reviews' : 'expert reviews'} do you want?
    </Label>
    <p className="text-sm text-muted-foreground">
      {selectedType === 'free'
        ? 'Get up to 3 different perspectives (free)'
        : 'Choose 1-10 expert reviewers (recommended: 2-3)'
      }
    </p>
  </div>

  {/* Slider with touch-optimized 48px thumb */}
  <div className="relative py-4">
    <input
      type="range"
      min="1"
      max={selectedType === 'free' ? '3' : '10'}
      className="[&::-webkit-slider-thumb]:size-12 [&::-webkit-slider-thumb]:rounded-full"
    />
  </div>

  {/* Quick select buttons */}
  <div className="grid grid-cols-3 gap-2">
    <Button variant="outline" onClick={() => setCount(1)}>1</Button>
    <Button variant="outline" onClick={() => setCount(2)}>2</Button>
    <Button variant="outline" onClick={() => setCount(3)}>3</Button>
    {selectedType === 'expert' && (
      <>
        <Button variant="outline" onClick={() => setCount(5)}>5</Button>
        <Button variant="outline" onClick={() => setCount(7)}>7</Button>
        <Button variant="outline" onClick={() => setCount(10)}>10</Button>
      </>
    )}
  </div>

  {/* Info card */}
  <div className="rounded-xl bg-accent-blue/5 border border-accent-blue/20 p-4">
    {/* Context-specific messaging */}
  </div>
</div>
```

#### Upgrade Prompt (for free users considering 4+)

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  🚀 Want more than 3 reviews?                                   │
│                                                                  │
│  Upgrade to Expert Review to get:                               │
│  ✓ Up to 10 professional reviewers                             │
│  ✓ Detailed video walkthroughs                                 │
│  ✓ 1-on-1 follow-up sessions                                   │
│  ✓ Priority response time (2-6 hours)                          │
│                                                                  │
│  [ View Expert Options → ]                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Component File:** `/components/review-flow/upgrade-prompt.tsx`

---

## Challenge 2: Review Submission & Acceptance Flow

### User Journey

```
Reviewer submits review
    ↓
Requester receives notification
    ↓
Requester navigates to review reading page
    ↓
Requester reads review
    ↓
Decision: Accept OR Reject
    ↓
[If Accept] → Review marked accepted → Thank you message
[If Reject] → Rejection modal → Reason selection → Confirmation
```

### 2.1 Notification System

#### A. Dashboard Notification Badge

**Location:** Navigation bar and dashboard header

```ascii
┌──────────────────────────────────────────────┐
│  Critvue    Dashboard    Reviews    Profile  │
│                            (3) ← Badge       │
└──────────────────────────────────────────────┘
```

```typescript
// Notification badge component
<Badge
  variant="error"
  showDot
  pulse
  size="sm"
  className="absolute -top-1 -right-1"
>
  3
</Badge>
```

#### B. Dashboard Alert Banner

**Component:** `PendingReviewAlert`
**File:** `/components/dashboard/pending-review-alert.tsx`

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  ⏰ You have 3 reviews awaiting your feedback                   │
│                                                                  │
│  Auto-accepting in 5 days • [ Review Now → ]                   │
└─────────────────────────────────────────────────────────────────┘
```

**Styling:**
```typescript
<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6
                shadow-[0_2px_8px_rgba(0,0,0,0.04)]
                flex items-center justify-between gap-4 flex-wrap">
  <div className="flex items-center gap-3">
    <Clock className="size-6 text-amber-600" />
    <div>
      <p className="font-semibold text-amber-900">
        You have {count} review{count > 1 ? 's' : ''} awaiting your feedback
      </p>
      <p className="text-sm text-amber-700">
        Auto-accepting in {daysRemaining} days
      </p>
    </div>
  </div>
  <Button
    className="bg-amber-600 hover:bg-amber-700 text-white min-h-[44px]"
    onClick={handleReviewNow}
  >
    Review Now →
  </Button>
</div>
```

#### C. Email Notification Template

**Subject:** New review submitted for "[Project Title]"

```html
<!-- Plain text structure -->

Hi [User Name],

Great news! A reviewer has submitted feedback for your project:

📝 Project: "Logo Design Feedback"
👤 Reviewer: @jane_designer
⭐ Preview: "Great use of negative space, but..."

[Read Full Review →]

⏰ Important: Reviews auto-accept in 7 days
Please review and accept/reject within 7 days to maintain quality.

---

Questions? Reply to this email or visit our Help Center.

Best,
The Critvue Team
```

### 2.2 Review Reading Page

**Route:** `/dashboard/reviews/[id]/submitted/[reviewId]`

**Page Structure:**

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard           [Share] [...]                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Review of "Logo Design Feedback"                               │
│  Submitted 2 hours ago by @jane_designer ⭐⭐⭐⭐⭐            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ⏳ Auto-accepts in 6 days 22 hours                        │ │
│  │  Please review carefully before accepting                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Overall Rating: ⭐⭐⭐⭐⭐ (5/5)                           │ │
│  │                                                            │ │
│  │  Summary                                                   │ │
│  │  Your logo demonstrates excellent use of negative space   │ │
│  │  and modern typography. The color palette is cohesive...  │ │
│  │                                                            │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │                                                            │ │
│  │  Strengths                                                 │ │
│  │  ✓ Clean, minimalist design                               │ │
│  │  ✓ Scalable at all sizes                                  │ │
│  │  ✓ Memorable and unique                                   │ │
│  │                                                            │ │
│  │  Areas for Improvement                                     │ │
│  │  • Consider adding a secondary logo variant for...        │ │
│  │  • The tagline font could be more legible at...           │ │
│  │                                                            │ │
│  │  Detailed Feedback                                         │ │
│  │  [Full review content with formatting, images, etc.]      │ │
│  │                                                            │ │
│  │  📎 Attachments (2)                                        │ │
│  │  [annotated-logo.png] [alternative-mockup.pdf]            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Was this review helpful?                                  │ │
│  │                                                            │ │
│  │  [ ✓ Accept Review ]          [ ✕ Reject Review ]        │ │
│  │   Green, primary action        Red, secondary action      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [ Report Inappropriate Content ]                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Component:** `ReviewSubmissionDetailPage`
**File:** `/app/dashboard/reviews/[id]/submitted/[reviewId]/page.tsx`

#### Accept/Reject Button Styling

```typescript
// Accept Button (primary action)
<Button
  onClick={handleAccept}
  className="flex-1 bg-green-600 hover:bg-green-700 text-white
             shadow-lg shadow-green-600/20 min-h-[56px] text-base font-semibold
             transition-all duration-200 active:scale-[0.98]"
>
  <Check className="size-5 mr-2" />
  Accept Review
</Button>

// Reject Button (destructive secondary)
<Button
  onClick={handleReject}
  variant="outline"
  className="flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400
             min-h-[56px] text-base font-semibold
             transition-all duration-200 active:scale-[0.98]"
>
  <X className="size-5 mr-2" />
  Reject Review
</Button>
```

**Mobile Layout (stacked):**

```ascii
┌──────────────────────────────┐
│                              │
│  [ ✓ Accept Review ]        │
│    Full width, prominent     │
│                              │
│  [ ✕ Reject Review ]        │
│    Full width, secondary     │
│                              │
└──────────────────────────────┘
```

### 2.3 Rejection Flow

#### Rejection Modal

**Component:** `RejectReviewModal`
**File:** `/components/reviews/reject-review-modal.tsx`

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  Why are you rejecting this review?                             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Please help us understand why this review didn't meet your     │
│  expectations. This helps us maintain quality standards.        │
│                                                                  │
│  ○ Low quality / Not helpful                                    │
│     Review lacks depth or actionable feedback                   │
│                                                                  │
│  ○ Off-topic / Didn't address my questions                      │
│     Reviewer didn't focus on requested feedback areas           │
│                                                                  │
│  ○ Spam or abusive content                                      │
│     Review contains inappropriate or harmful content            │
│                                                                  │
│  ○ Plagiarized or AI-generated                                  │
│     Content appears copied or entirely automated                │
│                                                                  │
│  ○ Other (please explain)                                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Additional details (optional)                           │  │
│  │                                                          │  │
│  │  [Text area - min 20 chars if "Other" selected]         │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ⚠️  Important                                                  │
│  Rejecting a review is permanent and will:                      │
│  • Return the review slot to available                          │
│  • Not refund the reviewer (they still get paid for effort)    │
│  • Allow you to request a replacement review                    │
│                                                                  │
│  [ Cancel ]                    [ Confirm Rejection ]           │
│                                 ^^^^^^^^^^^^^^^^^^^^            │
│                                 Requires reason selected        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Styling Details:**

```typescript
// Radio button options
<div className="space-y-3">
  {rejectionReasons.map((reason) => (
    <label
      key={reason.id}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
        "hover:bg-accent/5 min-h-[64px]",
        selectedReason === reason.id
          ? "border-accent-blue bg-accent-blue/5"
          : "border-border"
      )}
    >
      <input
        type="radio"
        name="reason"
        className="mt-1 size-4"
      />
      <div>
        <p className="font-semibold text-foreground">{reason.label}</p>
        <p className="text-sm text-muted-foreground">{reason.description}</p>
      </div>
    </label>
  ))}
</div>

// Confirm button (disabled until reason selected)
<Button
  onClick={handleConfirmRejection}
  disabled={!selectedReason}
  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300
             text-white min-h-[48px] px-8"
>
  Confirm Rejection
</Button>
```

#### Post-Rejection Confirmation

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  Review Rejected                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ✓ The review has been rejected                                 │
│  ✓ Review slot returned to available                            │
│  ✓ Reviewer has been notified                                   │
│                                                                  │
│  What's next?                                                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Your review request still has 1 available slot             │ │
│  │  Waiting for reviewers to claim                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [ Back to Dashboard ]                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Challenge 3: Multiple Reviews Management

### Dashboard View for Multi-Review Requests

**Component:** `MultiReviewStatusCard`
**File:** `/components/dashboard/multi-review-status-card.tsx`

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  Logo Design Feedback                    [...] [Share]          │
│  Expert Review • Requested 2 days ago                           │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Progress: 3 of 5 reviews submitted                             │
│  ████████████░░░░░░░░ 60%                                       │
│                                                                  │
│  ┌────────┬────────┬────────┬────────┐                         │
│  │ ✓ 2    │ ⏳ 1   │ 🔄 1   │ 📭 1   │                         │
│  │ Accept │ Review │ Progress│ Open   │                         │
│  └────────┴────────┴────────┴────────┘                         │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  ✓ Review by @jane_designer                  [View Details →] │
│  ⭐⭐⭐⭐⭐ Excellent feedback on color theory                 │
│  Accepted 2 hours ago                                           │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  ✓ Review by @design_pro                     [View Details →] │
│  ⭐⭐⭐⭐ Great insights on typography hierarchy               │
│  Accepted 5 hours ago                                           │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  ⏳ Review by @mike_ux                       ACTION NEEDED     │
│  Submitted 1 hour ago • Auto-accepts in 6 days 23 hours        │
│                                                                  │
│  [ Read & Review ]                                              │
│  ^^^^^^^^^^^^^^^ Primary CTA, accent-blue background            │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  🔄 Review in progress by @sarah_dev                           │
│  Claimed 3 hours ago • Due in 21 hours                         │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                  │
│  📭 1 slot available                                            │
│  Waiting for reviewers to claim                                │
│  [Boost Visibility →] ← Optional paid feature                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Progress Bar Component

```typescript
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="font-medium text-foreground">
      Progress: {submittedCount} of {totalRequested} reviews submitted
    </span>
    <span className="text-muted-foreground">
      {Math.round((submittedCount / totalRequested) * 100)}%
    </span>
  </div>

  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
    <div
      className={cn(
        "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
        isFullyComplete ? "bg-green-500" :
        hasUrgentReviews ? "bg-amber-500" :
        "bg-accent-sage"
      )}
      style={{ width: `${(submittedCount / totalRequested) * 100}%` }}
    />
  </div>
</div>
```

### Status Pills Component

```typescript
// Summary stats pills
<div className="grid grid-cols-4 gap-2">
  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
    <div className="text-2xl font-bold text-green-700">{acceptedCount}</div>
    <div className="text-xs text-green-600">Accepted</div>
  </div>

  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
    <div className="text-2xl font-bold text-amber-700">{awaitingCount}</div>
    <div className="text-xs text-amber-600">Review</div>
  </div>

  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
    <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
    <div className="text-xs text-blue-600">Progress</div>
  </div>

  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
    <div className="text-2xl font-bold text-gray-700">{availableCount}</div>
    <div className="text-xs text-gray-600">Open</div>
  </div>
</div>
```

### Individual Review Card States

#### 1. Accepted Review Card

```typescript
<div className="rounded-xl border border-green-200 bg-green-50/50 p-4
                hover:shadow-md transition-all cursor-pointer group">
  <div className="flex items-start gap-3">
    <div className="size-10 rounded-full bg-green-600 flex items-center justify-center">
      <Check className="size-5 text-white" />
    </div>

    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-semibold text-foreground">Review by @jane_designer</h4>
        <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="size-3 text-amber-500 fill-amber-500" />
        ))}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
        Excellent feedback on color theory and visual hierarchy...
      </p>

      <p className="text-xs text-green-700 font-medium">
        Accepted 2 hours ago
      </p>
    </div>
  </div>
</div>
```

#### 2. Awaiting Review Card (ACTION NEEDED)

```typescript
<div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4
                shadow-lg animate-pulse-subtle">
  <div className="flex items-center gap-2 mb-3">
    <Clock className="size-5 text-amber-700" />
    <Badge variant="warning" showDot pulse>ACTION NEEDED</Badge>
  </div>

  <div className="mb-3">
    <h4 className="font-semibold text-foreground mb-1">Review by @mike_ux</h4>
    <p className="text-sm text-muted-foreground">
      Submitted 1 hour ago
    </p>
  </div>

  <div className="rounded-lg bg-white/80 border border-amber-200 p-3 mb-3">
    <div className="flex items-center gap-2 text-sm">
      <Clock className="size-4 text-amber-600" />
      <span className="font-medium text-amber-900">
        Auto-accepts in <span className="font-bold">6 days 23 hours</span>
      </span>
    </div>
  </div>

  <Button
    className="w-full bg-amber-600 hover:bg-amber-700 text-white
               min-h-[48px] font-semibold shadow-lg"
    onClick={handleReadReview}
  >
    Read & Review
  </Button>
</div>
```

#### 3. In Progress Card

```typescript
<div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
  <div className="flex items-start gap-3">
    <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
      <RefreshCw className="size-5 text-blue-600 animate-spin-slow" />
    </div>

    <div className="flex-1">
      <h4 className="font-semibold text-foreground mb-1">
        Review in progress by @sarah_dev
      </h4>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span>Claimed 3 hours ago</span>
        </div>

        <div className="rounded-lg bg-white border border-blue-200 p-2">
          <p className="text-xs text-blue-700 font-medium">
            Due in 21 hours
          </p>
          <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full"
                 style={{width: '65%'}} />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 4. Available Slot Card

```typescript
<div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
  <div className="flex items-center gap-3 mb-3">
    <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center">
      <Users className="size-5 text-gray-500" />
    </div>
    <div>
      <h4 className="font-semibold text-foreground">1 slot available</h4>
      <p className="text-sm text-muted-foreground">
        Waiting for reviewers to claim
      </p>
    </div>
  </div>

  <Button
    variant="outline"
    className="w-full min-h-[44px]"
    onClick={handleBoostVisibility}
  >
    <Zap className="size-4 mr-2" />
    Boost Visibility
  </Button>
</div>
```

### Mobile Optimizations for Multi-Review

**Horizontal Scroll Stats:**

```ascii
Mobile (< 640px):
┌────────────────────────────────┐
│ Swipe to see all stats →      │
│ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │ ✓ 2  │ │ ⏳ 1 │ │ 🔄 1 │  │
│ │Accept│ │Review│ │Prog  │   │
│ └──────┘ └──────┘ └──────┘   │
│ ●○○○ swipe indicators         │
└────────────────────────────────┘
```

---

## Challenge 4: Review Quality Assurance

### For Reviewers: Pre-Submission Checks

**Component:** `ReviewSubmissionForm`
**File:** `/components/reviews/review-submission-form.tsx`

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  Submit Your Review                                              │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [Text editor with character count]                             │
│  500 / 100 min ✓                                                │
│                                                                  │
│  Quality Checklist                                               │
│  ✓ At least 100 characters                                      │
│  ✓ Addresses feedback areas requested                           │
│  ✗ Includes specific examples (recommended)                     │
│  ✗ Attached supporting materials (optional)                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  📝 Preview Your Review                                    │ │
│  │                                                            │ │
│  │  [Preview of formatted review]                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [ Save Draft ]              [ Preview & Submit ]              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### For Requesters: Rating System

**Component:** `ReviewRatingModal`
**File:** `/components/reviews/review-rating-modal.tsx`

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  Rate This Review                                                │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  How helpful was @jane_designer's review?                       │
│                                                                  │
│  ⭐ ⭐ ⭐ ⭐ ⭐ (5/5)                                            │
│  Tap to rate                                                     │
│                                                                  │
│  What did you find most valuable?                               │
│                                                                  │
│  ☑ Specific, actionable feedback                                │
│  ☑ Addressed my questions directly                              │
│  ☑ Professional and constructive tone                           │
│  ☐ Provided examples/references                                 │
│  ☐ Went above and beyond expectations                           │
│                                                                  │
│  Additional comments (optional)                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ✨ Reviews with ratings help others find great reviewers!      │
│                                                                  │
│  [ Skip for Now ]              [ Submit Rating ]               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Challenge 5: Auto-Accept Policy

### Countdown Timer Component

**Component:** `AutoAcceptTimer`
**File:** `/components/reviews/auto-accept-timer.tsx`

```typescript
// States based on time remaining
const getUrgencyState = (hoursRemaining: number) => {
  if (hoursRemaining < 24) return 'urgent';      // Red
  if (hoursRemaining < 72) return 'warning';     // Amber
  return 'normal';                                // Blue/neutral
};
```

#### Normal State (7-3 days remaining)

```ascii
┌────────────────────────────────────────┐
│  ⏰ Auto-accepts in 6 days 14 hours   │
│  Please review and accept/reject       │
└────────────────────────────────────────┘
```

```typescript
<div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
  <div className="flex items-center gap-2 text-sm">
    <Clock className="size-4 text-blue-600" />
    <span className="text-blue-900">
      Auto-accepts in <strong>6 days 14 hours</strong>
    </span>
  </div>
  <p className="text-xs text-blue-700 mt-1">
    Please review and accept/reject
  </p>
</div>
```

#### Warning State (72-24 hours remaining)

```ascii
┌────────────────────────────────────────┐
│  ⚠️  Auto-accepts in 2 days 8 hours   │
│  Review soon to maintain quality       │
└────────────────────────────────────────┘
```

```typescript
<div className="rounded-lg bg-amber-50 border-2 border-amber-400 p-3
                animate-pulse-subtle">
  <div className="flex items-center gap-2 text-sm">
    <AlertTriangle className="size-4 text-amber-600" />
    <span className="text-amber-900 font-medium">
      Auto-accepts in <strong className="text-lg">2 days 8 hours</strong>
    </span>
  </div>
  <p className="text-xs text-amber-700 mt-1 font-medium">
    Review soon to maintain quality
  </p>
</div>
```

#### Urgent State (<24 hours remaining)

```ascii
┌────────────────────────────────────────┐
│  🚨 AUTO-ACCEPTS IN 18 HOURS          │
│  Act now to review before auto-accept  │
│  [ Review Now ]                        │
└────────────────────────────────────────┘
```

```typescript
<div className="rounded-lg bg-red-50 border-2 border-red-500 p-4
                shadow-lg animate-pulse">
  <div className="flex items-center gap-2 mb-2">
    <AlertCircle className="size-5 text-red-600" />
    <span className="text-red-900 font-bold text-base">
      AUTO-ACCEPTS IN {hoursRemaining} HOURS
    </span>
  </div>
  <p className="text-sm text-red-700 mb-3">
    Act now to review before auto-accept
  </p>
  <Button
    className="w-full bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
    onClick={handleReviewNow}
  >
    Review Now
  </Button>
</div>
```

### Email Reminder Strategy

```
Day 7:  Review submitted (immediate notification)
Day 5:  "You have 2 days left to review"
Day 2:  "Final reminder: Review auto-accepts in 48 hours"
Day 1:  "URGENT: Review auto-accepts tomorrow"
6 hours:"Last chance: Auto-accepting in 6 hours"
```

### Post Auto-Accept Grace Period

```ascii
┌─────────────────────────────────────────────────────────────────┐
│  Review Auto-Accepted                                            │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  This review was automatically accepted after 7 days.            │
│                                                                  │
│  ✓ Review marked as accepted                                    │
│  ✓ Reviewer has been paid                                       │
│                                                                  │
│  Not satisfied with the review?                                  │
│                                                                  │
│  You can still dispute this review within 48 hours.              │
│  Disputes are reviewed by our moderation team.                   │
│                                                                  │
│  [ File a Dispute ]              [ Keep Review ]               │
│                                                                  │
│  ⏰ Dispute deadline: Nov 19, 2025 at 3:42 PM                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Core Components to Build

1. **NumberOfReviewsSelector** (`/components/review-flow/number-of-reviews-selector.tsx`)
   - Slider with 1-3 for free, 1-10 for paid
   - Quick select buttons
   - Dynamic pricing calculator
   - Upgrade prompt for free users

2. **PendingReviewAlert** (`/components/dashboard/pending-review-alert.tsx`)
   - Dashboard banner for pending reviews
   - Countdown display
   - Quick action button

3. **MultiReviewStatusCard** (`/components/dashboard/multi-review-status-card.tsx`)
   - Progress bar
   - Status pills (accepted, pending, in progress, available)
   - Individual review cards with different states

4. **ReviewSubmissionDetailPage** (`/app/dashboard/reviews/[id]/submitted/[reviewId]/page.tsx`)
   - Full review display
   - Auto-accept timer
   - Accept/Reject buttons

5. **RejectReviewModal** (`/components/reviews/reject-review-modal.tsx`)
   - Reason selection (radio buttons)
   - Optional explanation textarea
   - Confirmation step

6. **AutoAcceptTimer** (`/components/reviews/auto-accept-timer.tsx`)
   - Three urgency states (normal, warning, urgent)
   - Countdown display
   - Contextual messaging

7. **ReviewRatingModal** (`/components/reviews/review-rating-modal.tsx`)
   - Star rating input
   - Helpful aspects checkboxes
   - Optional comment field

---

## Mobile Optimizations

### Touch Targets

All interactive elements MUST be:
- Minimum 44px height (iOS/Android standard)
- 48px preferred for primary actions
- Adequate spacing between targets (8px minimum)

### Gesture Support

```typescript
// Horizontal scroll for stats
<div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
  {/* Cards snap to center */}
</div>

// Pull-to-refresh for dashboard
// Swipe gestures for accept/reject (optional, advanced)
```

### Mobile-Specific Layouts

```typescript
// Stack buttons vertically on mobile
<div className="flex flex-col sm:flex-row gap-3">
  <Button className="w-full sm:w-auto">Accept</Button>
  <Button className="w-full sm:w-auto">Reject</Button>
</div>

// Collapsible sections for long content
<Collapsible>
  <CollapsibleTrigger>View Full Review</CollapsibleTrigger>
  <CollapsibleContent>{fullReview}</CollapsibleContent>
</Collapsible>
```

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance

1. **Color Contrast**
   - Text: 4.5:1 minimum
   - Large text (18pt+): 3:1 minimum
   - Interactive elements: 3:1 minimum

2. **Keyboard Navigation**
   - All actions accessible via keyboard
   - Visible focus indicators
   - Logical tab order

3. **Screen Reader Support**
   ```typescript
   // Example: Auto-accept timer
   <div
     role="status"
     aria-live="polite"
     aria-label={`Review auto-accepts in ${daysRemaining} days`}
   >
   ```

4. **ARIA Labels**
   ```typescript
   <Button
     aria-label="Accept review from @jane_designer"
     onClick={handleAccept}
   >
     Accept Review
   </Button>
   ```

5. **Skip Links**
   ```typescript
   <a href="#review-content" className="sr-only focus:not-sr-only">
     Skip to review content
   </a>
   ```

---

## Implementation Roadmap

### Phase 1: Core Acceptance Flow (Week 1-2)
- [ ] Build ReviewSubmissionDetailPage
- [ ] Implement Accept/Reject buttons
- [ ] Create RejectReviewModal
- [ ] Add basic notification system

### Phase 2: Multi-Review Management (Week 2-3)
- [ ] Build MultiReviewStatusCard
- [ ] Create individual review state cards
- [ ] Implement progress bar component
- [ ] Add status pills

### Phase 3: Number Selection & Pricing (Week 3-4)
- [ ] Build NumberOfReviewsSelector
- [ ] Update review-type-step with 1-3 free reviews
- [ ] Add dynamic pricing for paid reviews
- [ ] Create upgrade prompts

### Phase 4: Auto-Accept System (Week 4-5)
- [ ] Build AutoAcceptTimer component
- [ ] Implement three urgency states
- [ ] Add email reminder system (backend)
- [ ] Create grace period dispute flow

### Phase 5: Quality Assurance (Week 5-6)
- [ ] Build ReviewRatingModal
- [ ] Add pre-submission checklist for reviewers
- [ ] Implement review preview system
- [ ] Create quality badges/indicators

### Phase 6: Polish & Testing (Week 6-7)
- [ ] Mobile optimization pass
- [ ] Accessibility audit
- [ ] Animation polish
- [ ] Cross-browser testing
- [ ] User acceptance testing

---

## Brand Compliance Checklist

- [ ] All shadows use tiered system (xs, md, lg, xl, 2xl)
- [ ] Border radius uses 1rem, 1.5rem, 2rem scale
- [ ] Colors use CSS variables (--accent-blue, --accent-peach, etc.)
- [ ] Typography uses Inter (sans) and IBM Plex Mono (mono)
- [ ] Spacing follows 4pt/8pt scale
- [ ] Touch targets minimum 44px height
- [ ] Animations use duration tokens (150ms, 300ms, 500ms)
- [ ] Glass morphism uses --glass-* variables
- [ ] Hover states include scale + shadow changes
- [ ] Focus states use --ring color with 2-4px outline

---

## Microcopy Guidelines

### Tone: Friendly, Clear, Empowering

**Do:**
- "You have 3 reviews awaiting your feedback"
- "Auto-accepts in 6 days 14 hours"
- "Review slot returned to available"

**Don't:**
- "Reviews pending" (too formal)
- "Will be automatically accepted" (passive voice)
- "Slot reopened" (unclear)

### Action Buttons

**Primary Actions:**
- "Accept Review" (not "Accept")
- "Read & Review" (not "View")
- "Confirm Rejection" (not "Reject")

**Secondary Actions:**
- "View Details" (not "More")
- "Save Draft" (not "Save")
- "Skip for Now" (not "Cancel")

---

## Success Metrics

### User Behavior
- Review acceptance rate: Target 85%+
- Time to review: Target < 24 hours
- Rejection rate: Target < 10%
- Multi-review completion rate: Target 90%+

### Quality
- Review rating average: Target 4.2/5+
- Dispute rate: Target < 2%
- Auto-accept rate: Target < 15% (users should review proactively)

### Engagement
- Dashboard return rate for pending reviews: Target 70%+
- Email notification open rate: Target 50%+
- Mobile completion rate: Target 80%+ of desktop

---

**End of Design Specification**

For questions or clarifications, consult this document or reach out to the design team.
