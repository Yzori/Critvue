# Review Lifecycle - Developer Quick Reference Card

**Quick Links:**
- Full Spec: `REVIEW_LIFECYCLE_UX_DESIGN.md`
- Code Examples: `REVIEW_LIFECYCLE_COMPONENT_EXAMPLES.tsx`
- Mobile Layouts: `REVIEW_LIFECYCLE_MOBILE_MOCKUPS.md`
- Summary: `REVIEW_LIFECYCLE_SUMMARY.md`

---

## Design System Tokens (Copy-Paste Ready)

```typescript
// Colors
const colors = {
  'accent-blue': '#3B82F6',      // Primary actions
  'accent-peach': '#F97316',     // Expert reviews
  'accent-sage': '#4ADE80',      // Success, available
  'green-600': '#16A34A',        // Acceptance
  'amber-500': '#F59E0B',        // Warning
  'red-600': '#DC2626',          // Rejection/urgent
};

// Shadows
const shadows = {
  xs: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
  md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.06)',
  lg: '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.05)',
};

// Border Radius
const radius = {
  lg: '1rem',    // 16px
  xl: '1.5rem',  // 24px
  '2xl': '2rem', // 32px
};

// Touch Targets
const touchTargets = {
  min: '44px',      // Minimum (iOS standard)
  preferred: '48px', // Preferred
  primary: '56px',   // Primary CTAs
};
```

---

## Component Checklist

### For Every Component:

```typescript
// ✓ Brand compliance checklist
const ComponentTemplate = () => {
  return (
    <div className="
      rounded-2xl                        // ✓ Border radius from scale
      border border-border               // ✓ Semantic color variable
      bg-card                            // ✓ Semantic background
      p-4 sm:p-6                         // ✓ Responsive spacing (4pt scale)
      shadow-[0_2px_8px_rgba(0,0,0,0.04)] // ✓ Tiered shadow system
      hover:shadow-lg                    // ✓ Hover state
      transition-all duration-200        // ✓ Smooth transitions
    ">
      {/* Content */}
    </div>
  );
};

// ✓ Accessibility
<button
  className="min-h-[44px]"             // ✓ Touch target minimum
  aria-label="Clear description"       // ✓ Screen reader support
  onClick={handleClick}                // ✓ Native button element
>

// ✓ Responsive
<div className="
  flex flex-col sm:flex-row           // ✓ Mobile-first stacking
  gap-3 sm:gap-4                      // ✓ Responsive spacing
  text-sm sm:text-base                // ✓ Responsive typography
">
```

---

## Status Color Mapping

```typescript
const statusColors = {
  accepted: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
  },
  pending: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-900',
    icon: 'text-amber-600',
  },
  in_progress: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
  },
  available: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
    icon: 'text-gray-500',
  },
  rejected: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
  },
};
```

---

## Auto-Accept Timer States

```typescript
const getTimerState = (hoursRemaining: number) => {
  if (hoursRemaining < 24) {
    return {
      state: 'urgent',
      icon: <AlertCircle />,
      color: 'red',
      pulse: true,
      showButton: true,
      message: 'AUTO-ACCEPTS IN',
    };
  }
  if (hoursRemaining < 72) {
    return {
      state: 'warning',
      icon: <AlertTriangle />,
      color: 'amber',
      pulse: true,
      showButton: false,
      message: 'Auto-accepts in',
    };
  }
  return {
    state: 'normal',
    icon: <Clock />,
    color: 'blue',
    pulse: false,
    showButton: false,
    message: 'Auto-accepts in',
  };
};
```

---

## Button Styling Patterns

```typescript
// Primary CTA (Accept, Confirm)
<Button className="
  bg-green-600 hover:bg-green-700
  text-white
  shadow-lg shadow-green-600/20
  min-h-[56px]
  text-base font-semibold
  transition-all duration-200
  active:scale-[0.98]
">

// Destructive CTA (Reject, Delete)
<Button className="
  bg-red-600 hover:bg-red-700
  text-white
  shadow-lg shadow-red-600/20
  min-h-[56px]
  text-base font-semibold
  transition-all duration-200
  active:scale-[0.98]
">

// Secondary Action (Cancel, Back)
<Button variant="outline" className="
  border-border
  hover:bg-muted/50
  min-h-[48px]
  transition-colors
">

// Urgent Action (Review Now when < 24h)
<Button className="
  bg-red-600 hover:bg-red-700
  text-white
  min-h-[56px]
  shadow-lg
  animate-pulse
">
```

---

## API Integration Patterns

```typescript
// Optimistic updates for better UX
const handleAccept = async (reviewId: string) => {
  // 1. Update UI immediately
  setReviewStatus('accepted');
  showToast('Review accepted!');

  try {
    // 2. Call API
    await api.acceptReview(reviewId);

    // 3. Refetch to sync with backend
    await queryClient.invalidateQueries(['reviews']);
  } catch (error) {
    // 4. Rollback on error
    setReviewStatus('pending');
    showToast('Failed to accept review', 'error');
  }
};

// Loading states
const { data, isLoading, error } = useQuery(['review', reviewId], () =>
  api.getReview(reviewId)
);

if (isLoading) return <ReviewSkeleton />;
if (error) return <ErrorState error={error} />;
```

---

## Common Animation Patterns

```typescript
// Staggered list animations
{reviews.map((review, index) => (
  <motion.div
    key={review.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.3,
      delay: index * 0.1,
    }}
  >
    <ReviewCard review={review} />
  </motion.div>
))}

// Modal entrance
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2 }}
>

// Count-up number animation
<motion.span
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  key={count} // Re-animate when count changes
>
  {count}
</motion.span>
```

---

## Responsive Breakpoint Patterns

```typescript
// Mobile-first approach
<div className="
  // Base (mobile): 375px+
  flex flex-col gap-3 p-4 text-sm

  // Large mobile: 428px+
  xs:gap-4 xs:p-5

  // Tablet: 768px+
  sm:flex-row sm:gap-6 sm:p-6 sm:text-base

  // Desktop: 1024px+
  lg:gap-8 lg:p-8

  // Large desktop: 1536px+
  2xl:max-w-7xl 2xl:mx-auto
">
```

---

## Accessibility Quick Checks

```typescript
// ✓ Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>

// ✓ Screen reader labels
<button aria-label="Accept review from jane_designer">
  Accept
</button>

// ✓ Live regions for dynamic content
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {statusMessage}
</div>

// ✓ Focus management
useEffect(() => {
  if (isModalOpen) {
    modalRef.current?.focus();
  }
}, [isModalOpen]);

// ✓ Reduced motion
const prefersReducedMotion = useReducedMotion();

<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0 }}
  animate={{ opacity: 1 }}
/>
```

---

## Error Handling Patterns

```typescript
// User-friendly error messages
const errorMessages = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  NOT_FOUND: 'Review not found. It may have been deleted.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
};

// Error boundary for component crashes
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error) => logError(error)}
>
  <ReviewComponent />
</ErrorBoundary>

// Inline error states
{error && (
  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
    <div className="flex gap-3">
      <AlertCircle className="size-5 text-red-600 flex-shrink-0" />
      <div>
        <p className="font-semibold text-red-900">{error.title}</p>
        <p className="text-sm text-red-700">{error.message}</p>
        <Button
          onClick={retry}
          className="mt-3 bg-red-600 hover:bg-red-700"
        >
          Try Again
        </Button>
      </div>
    </div>
  </div>
)}
```

---

## Testing Patterns

```typescript
// Component test template
describe('ReviewAcceptanceFlow', () => {
  it('renders review content correctly', () => {
    const review = mockReview();
    render(<ReviewDetailPage review={review} />);

    expect(screen.getByText(review.title)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeEnabled();
  });

  it('accepts review on button click', async () => {
    const onAccept = jest.fn();
    render(<ReviewDetailPage onAccept={onAccept} />);

    await userEvent.click(screen.getByRole('button', { name: /accept/i }));

    expect(onAccept).toHaveBeenCalledWith(expect.any(String));
  });

  it('shows confirmation before rejection', async () => {
    render(<ReviewDetailPage />);

    await userEvent.click(screen.getByRole('button', { name: /reject/i }));

    expect(screen.getByText(/why are you rejecting/i)).toBeInTheDocument();
  });
});

// Accessibility test
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<ReviewDetailPage />);
  const results = await axe(container);

  expect(results).toHaveNoViolations();
});
```

---

## Performance Optimization Patterns

```typescript
// Lazy load heavy components
const ReviewRatingModal = lazy(() => import('./ReviewRatingModal'));

<Suspense fallback={<Skeleton />}>
  {showRating && <ReviewRatingModal />}
</Suspense>

// Memoize expensive computations
const reviewStats = useMemo(() => {
  return calculateReviewStatistics(reviews);
}, [reviews]);

// Debounce expensive operations
const debouncedSearch = useDebouncedCallback(
  (query) => searchReviews(query),
  300
);

// Virtual scrolling for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: reviews.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 100,
});
```

---

## Common Pitfalls to Avoid

```typescript
// ❌ Don't use hard-coded colors
<div className="bg-blue-500">

// ✓ Use semantic tokens
<div className="bg-accent-blue">

// ❌ Don't skip accessibility
<div onClick={handleClick}>Click me</div>

// ✓ Use proper elements
<button onClick={handleClick}>Click me</button>

// ❌ Don't forget responsive spacing
<div className="p-4">

// ✓ Use responsive classes
<div className="p-4 sm:p-6 lg:p-8">

// ❌ Don't ignore loading states
{data && <Component data={data} />}

// ✓ Handle all states
{isLoading && <Skeleton />}
{error && <ErrorState />}
{data && <Component data={data} />}

// ❌ Don't forget touch targets
<button className="px-2 py-1">

// ✓ Meet minimum size
<button className="min-h-[44px] px-4">
```

---

## Quick Copy-Paste Snippets

### Toast Notification

```typescript
import { toast } from 'sonner';

// Success
toast.success('Review accepted!', {
  description: 'The reviewer has been notified.',
});

// Error
toast.error('Failed to accept review', {
  description: 'Please try again later.',
});

// With action
toast('Review auto-accepts in 2 days', {
  action: {
    label: 'Review Now',
    onClick: () => navigate('/review'),
  },
});
```

### Skeleton Loader

```typescript
const ReviewSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-6 bg-muted rounded w-3/4" />
    <div className="h-4 bg-muted rounded w-1/2" />
    <div className="h-32 bg-muted rounded" />
  </div>
);
```

### Confirmation Dialog

```typescript
import { AlertDialog } from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger>Delete</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Git Commit Message Format

```bash
# Feature commits
feat(reviews): add review acceptance buttons
feat(dashboard): implement multi-review status card

# Bug fixes
fix(reviews): correct auto-accept countdown calculation
fix(mobile): resolve touch target sizing on iOS

# Refactoring
refactor(reviews): extract review card into separate component

# Styling
style(reviews): update shadow to match design system

# Tests
test(reviews): add acceptance flow integration tests

# Documentation
docs(reviews): add component usage examples
```

---

## File Organization

```
frontend/
├── app/
│   └── dashboard/
│       └── reviews/
│           └── [id]/
│               └── submitted/
│                   └── [reviewId]/
│                       └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── multi-review-status-card.tsx
│   │   └── pending-review-alert.tsx
│   ├── reviews/
│   │   ├── auto-accept-timer.tsx
│   │   ├── reject-review-modal.tsx
│   │   ├── review-rating-modal.tsx
│   │   └── review-slot-card.tsx
│   └── review-flow/
│       └── number-of-reviews-selector.tsx
├── hooks/
│   ├── useReviews.ts
│   ├── useReviewAcceptance.ts
│   └── useAutoAcceptTimer.ts
├── lib/
│   └── api/
│       └── reviews.ts
└── types/
    └── review.ts
```

---

## Need Help?

- **Full Specification:** `REVIEW_LIFECYCLE_UX_DESIGN.md`
- **Code Examples:** `REVIEW_LIFECYCLE_COMPONENT_EXAMPLES.tsx`
- **Mobile Layouts:** `REVIEW_LIFECYCLE_MOBILE_MOCKUPS.md`
- **Project Summary:** `REVIEW_LIFECYCLE_SUMMARY.md`
- **Design System:** `/app/globals.css` (tokens and utilities)
- **Component Library:** `/components/ui/` (base components)

**Questions?** Tag @design-team in Slack or create a GitHub discussion.

---

**Last Updated:** 2025-11-12
**Version:** 1.0.0
