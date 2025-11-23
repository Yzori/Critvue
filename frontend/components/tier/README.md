# Tier System Components

A comprehensive set of UI components for displaying and managing user tier progression in Critvue's reputation system.

## Overview

The tier system allows users to progress through 6 tiers by earning karma through quality reviews:

1. **🌱 Novice** (0-99 karma) - Starting tier
2. **🔷 Contributor** (100-499 karma) - Building reputation
3. **⭐ Skilled** (500-1,499 karma) - Recognized quality
4. **💎 Trusted Advisor** (1,500-4,999 karma) - First earning tier
5. **👑 Expert** (5,000-14,999 karma) - Elite reviewer
6. **🏆 Master** (15,000+ karma) - Pinnacle of excellence

## Components

### Core Components

#### `TierBadge`

Display a user's tier with icon, name, and optional sub-badge for Master tiers.

```tsx
import { TierBadge } from '@/components/tier';
import { UserTier, MasterTierType } from '@/lib/types/tier';

// Basic usage
<TierBadge tier={UserTier.SKILLED} />

// With size variants
<TierBadge tier={UserTier.EXPERT} size="sm" />  // sm, md, lg, xl
<TierBadge tier={UserTier.EXPERT} size="xl" />

// Master tier with type
<TierBadge
  tier={UserTier.MASTER}
  masterType={MasterTierType.CERTIFIED}
  size="lg"
/>

// Without tooltip
<TierBadge tier={UserTier.CONTRIBUTOR} showTooltip={false} />

// Icon only (no name text)
<TierBadge tier={UserTier.NOVICE} showName={false} />
```

**Props:**
- `tier` (required): User's current tier
- `masterType`: For Master tier, specify CERTIFIED or COMMUNITY
- `size`: Visual size - `sm`, `md`, `lg`, `xl` (default: `md`)
- `showName`: Show tier name text (default: `true`)
- `showTooltip`: Show tooltip with tier details (default: `true`)
- `className`: Custom CSS classes

---

#### `KarmaProgress`

Widget showing current karma, progress to next tier, and expandable requirements checklist.

```tsx
import { KarmaProgress } from '@/components/tier';
import { UserTierStatus } from '@/lib/types/tier';

const userStatus: UserTierStatus = {
  currentTier: UserTier.CONTRIBUTOR,
  karma: 250,
  totalReviews: 12,
  acceptanceRate: 85.5,
  helpfulRating: 4.2,
  currentStreak: 5,
  longestStreak: 12,
};

// Full widget
<KarmaProgress status={userStatus} />

// Compact inline mode
<KarmaProgress status={userStatus} compact={true} />
```

**Props:**
- `status` (required): User's current tier status
- `compact`: Compact mode for inline display (default: `false`)
- `className`: Custom CSS classes

**Features:**
- Current karma display
- Animated progress bar to next tier
- Expandable requirements checklist with checkmarks
- Next tier preview with benefits

---

#### `TierStatsCards`

Three-column dashboard cards showing tier progress, weekly karma, and streak.

```tsx
import { TierStatsCards } from '@/components/tier';

<TierStatsCards
  status={userStatus}
  weeklyKarma={45}
/>
```

**Props:**
- `status` (required): User's tier status
- `weeklyKarma`: Karma earned this week (default: `0`)
- `className`: Custom CSS classes

**Includes:**
1. **Your Tier Card** - Current tier, karma, progress bar
2. **This Week Card** - Weekly karma earned with goal tracking
3. **Streak Card** - Current streak, personal best, milestone progress

---

#### `CompactTierCard`

Single card showing tier and key stats - ideal for sidebars.

```tsx
import { CompactTierCard } from '@/components/tier';

<CompactTierCard status={userStatus} />
```

**Features:**
- Tier badge and karma
- Progress to next tier
- Quick stats: acceptance rate, streak

---

#### `TierProgressCard`

Focused card showing only tier progression.

```tsx
import { TierProgressCard } from '@/components/tier';

<TierProgressCard status={userStatus} />
```

**Features:**
- Visual tier ladder (current → next)
- Karma needed breakdown
- Progress percentage

---

### Tier Locked Components

Components for displaying reviews that require higher tiers.

#### `TierLockedBadge`

Badge indicating a review is locked.

```tsx
import { TierLockedBadge } from '@/components/tier/tier-locked-review';

<TierLockedBadge
  requiredTier={UserTier.EXPERT}
  currentTier={userStatus.currentTier}
/>
```

---

#### `TierLockedButton`

Disabled button state for locked reviews.

```tsx
import { TierLockedButton } from '@/components/tier/tier-locked-review';

<TierLockedButton
  requiredTier={UserTier.EXPERT}
  currentTier={userStatus.currentTier}
  size="md"  // sm, md, lg
/>
```

---

#### `TierLockedOverlay`

Full overlay for locked review cards.

```tsx
import { TierLockedOverlay } from '@/components/tier/tier-locked-review';

<div className="relative">
  {/* Review card content */}
  <TierLockedOverlay
    requiredTier={UserTier.TRUSTED_ADVISOR}
    reviewPrice={500}
  />
</div>
```

---

#### `TierUpgradeMessage`

Inline message encouraging tier upgrade.

```tsx
import { TierUpgradeMessage } from '@/components/tier/tier-locked-review';

<TierUpgradeMessage
  requiredTier={UserTier.EXPERT}
  currentTier={userStatus.currentTier}
/>
```

---

### Notification Components

Toast notifications for tier-related events.

#### `showTierUnlockNotification`

Celebratory notification when user unlocks a new tier (includes confetti).

```tsx
import { showTierUnlockNotification } from '@/components/tier';
import { UserTier } from '@/lib/types/tier';

showTierUnlockNotification({
  oldTier: UserTier.CONTRIBUTOR,
  newTier: UserTier.SKILLED,
  karma: 500,
  unlockedBenefits: [
    'Accept reviews up to $250',
    'Verified reviewer badge',
    '+10% karma bonus on all reviews',
  ],
});
```

---

#### `showBenefitUnlockNotification`

Simple notification for new benefit unlock.

```tsx
import { showBenefitUnlockNotification } from '@/components/tier';

showBenefitUnlockNotification(
  'New unlock: You can now accept paid reviews up to $500'
);
```

---

#### `showKarmaMilestoneNotification`

Notification for karma milestones.

```tsx
import { showKarmaMilestoneNotification } from '@/components/tier';

showKarmaMilestoneNotification(1000, 50); // milestone, bonusKarma
```

---

#### `showStreakNotification`

Notification for streak achievements.

```tsx
import { showStreakNotification } from '@/components/tier';

showStreakNotification(7, 25); // streakDays, bonusKarma
```

---

#### `useTierUnlockCheck`

React hook to check for tier unlock on mount.

```tsx
import { useTierUnlockCheck } from '@/components/tier';

function Dashboard() {
  const { currentTier } = useUser();
  const previousTier = usePrevious(currentTier);

  useTierUnlockCheck(currentTier, previousTier);

  // Component renders...
}
```

---

## Pages

### Karma Transaction History

**Path:** `/dashboard/karma`

Displays paginated karma transaction history with filtering.

**Features:**
- Summary cards (total, gained, lost)
- Filter by action type
- Pagination
- Color-coded transactions

---

### Tier Information (Marketing)

**Path:** `/tiers`

Comprehensive tier system overview.

**Sections:**
1. Hero with CTA
2. How It Works (3-column features)
3. Tier Ladder (all 6 tiers with requirements & benefits)
4. Expert Application vs Organic Progression comparison
5. Benefits comparison table
6. Final CTA

---

### Tier Demo (Development)

**Path:** `/dashboard/tier-demo`

Interactive showcase of all tier components.

**Features:**
- User status selector
- All badge variants
- Dashboard cards
- Progress widgets
- Locked components
- Notification triggers

---

## TypeScript Types

All types are exported from `/lib/types/tier.ts`:

```tsx
import {
  UserTier,              // Enum of all tiers
  MasterTierType,        // CERTIFIED | COMMUNITY
  TierInfo,              // Complete tier configuration
  UserTierStatus,        // User's current status
  TierRequirements,      // Requirements for a tier
  TierBenefits,          // Benefits of a tier
  TierProgressData,      // Calculated progress data
  KarmaAction,           // Enum of karma actions
  KarmaTransaction,      // Karma transaction record
  TIER_CONFIG,           // Complete tier configuration
  getTierInfo,           // Get tier info by enum
  getTierByKarma,        // Get tier by karma amount
  getNextTier,           // Get next tier
  calculateTierProgress, // Calculate progress to next tier
  canPromoteToNextTier,  // Check if user can be promoted
} from '@/lib/types/tier';
```

---

## Design System Compliance

All components follow Critvue's brand guidelines:

### Colors
- **Primary Blue:** `#3B82F6` (var(--accent-blue))
- **Accent Peach:** `#F97316` (var(--accent-peach))
- **Tier-specific colors:** Each tier has a unique color from the config

### Typography
- Font family: Inter (system default)
- Consistent sizing: `text-xs`, `text-sm`, `text-base`, etc.
- Font weights: `font-medium` (500), `font-semibold` (600), `font-bold` (700)

### Spacing
- Following 4pt/8pt scale: `gap-1`, `gap-2`, `gap-3`, `gap-4`, etc.
- Padding: `p-2`, `p-3`, `p-4`, `p-6`

### Border Radius
- Small: `rounded-lg` (0.5rem)
- Medium: `rounded-xl` (0.75rem)
- Full: `rounded-full` (pill shape)

### Shadows
- Cards: `shadow-sm`, `shadow-md`
- Elevated: `shadow-lg`, `shadow-xl`
- Colored shadows: `shadow-accent-blue/25`

### Animations
- Duration: `duration-200`, `duration-300`, `duration-500`
- Easing: `ease-out`, `ease-in-out`
- Entrance: `animate-in zoom-in fade-in slide-in-from-top-4`

### Accessibility
- All interactive elements have proper focus states
- Tooltips provide context for tier badges
- Color coding supplemented with icons and text
- Semantic HTML structure
- ARIA attributes on custom components

---

## Integration Guide

### 1. Add to User Dashboard

```tsx
import { TierStatsCards } from '@/components/tier';

function Dashboard() {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      <TierStatsCards
        status={user.tierStatus}
        weeklyKarma={user.weeklyKarma}
      />
      {/* Other dashboard content */}
    </div>
  );
}
```

### 2. Add to User Profile

```tsx
import { TierBadge, CompactTierCard } from '@/components/tier';

function UserProfile({ user }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Avatar src={user.avatar} />
        <div>
          <h2>{user.name}</h2>
          <TierBadge tier={user.tierStatus.currentTier} size="sm" />
        </div>
      </div>

      <CompactTierCard status={user.tierStatus} className="mt-4" />
    </div>
  );
}
```

### 3. Add to Review Cards

```tsx
import { TierLockedOverlay } from '@/components/tier/tier-locked-review';

function ReviewCard({ review, userTier }) {
  const isLocked = userTier < review.requiredTier;

  return (
    <div className="relative">
      <Card>
        {/* Review card content */}
      </Card>

      {isLocked && (
        <TierLockedOverlay
          requiredTier={review.requiredTier}
          reviewPrice={review.price}
        />
      )}
    </div>
  );
}
```

### 4. Handle Tier Unlocks

```tsx
import { useTierUnlockCheck } from '@/components/tier';

function App() {
  const { user } = useUser();
  const previousTier = usePrevious(user.tierStatus.currentTier);

  // Automatically shows notification when tier changes
  useTierUnlockCheck(user.tierStatus.currentTier, previousTier);

  return <AppContent />;
}
```

---

## API Integration

Components expect data from these backend endpoints (to be implemented):

### GET `/api/users/me/tier`

Returns current user tier status:

```json
{
  "currentTier": "CONTRIBUTOR",
  "karma": 250,
  "totalReviews": 12,
  "acceptanceRate": 85.5,
  "helpfulRating": 4.2,
  "currentStreak": 5,
  "longestStreak": 12,
  "nextTier": "SKILLED",
  "karmaToNextTier": 250
}
```

### GET `/api/users/me/karma/history`

Returns paginated karma transaction log:

```json
{
  "transactions": [
    {
      "id": "tx-123",
      "action": "REVIEW_ACCEPTED",
      "points": 50,
      "reason": "Your review was accepted",
      "createdAt": "2024-11-23T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 5,
    "total": 48
  }
}
```

### GET `/api/tiers`

Returns all tier configuration (uses TIER_CONFIG from types):

```json
{
  "tiers": [
    {
      "tier": "NOVICE",
      "name": "Novice",
      "icon": "🌱",
      "requirements": { ... },
      "benefits": { ... }
    }
  ]
}
```

---

## Testing

Visit `/dashboard/tier-demo` to interactively test all components with mock data.

---

## Future Enhancements

1. **Animated Tier Transitions** - Smooth animations when tier changes
2. **Leaderboard Integration** - Show top users by tier/karma
3. **Tier Comparison Tool** - Compare benefits across tiers
4. **Achievement Badges** - Special badges for milestones
5. **Tier History Timeline** - Visual timeline of tier progression
6. **Social Sharing** - Share tier achievements
7. **Custom Tier Icons** - User-selectable icons for Master tier
