# Mobile UX Action Items - Reviewer Workflow

**Priority Implementation List**
**Generated:** 2025-11-15

---

## Priority 1 - Critical (Implement Before Launch)

### 1. Haptic Feedback System ⚡

**Why:** Mobile users expect tactile feedback for important actions.

**Implementation:**
- Create `/home/user/Critvue/frontend/lib/haptics.ts`
- Add to: Claim button, Accept/Reject actions, Swipe gestures

**Code:** See MOBILE_UX_REVIEW.md Section 14 - Haptic Feedback System

**Estimated Time:** 2 hours

**Apply to:**
```tsx
// Browse page - Claim button
const handleClaim = () => {
  haptics.medium();
  // ... claim logic
  haptics.success();
};

// Review acceptance - Accept button
const handleAccept = () => {
  haptics.medium();
  // ... accept logic
  haptics.success();
};

// Filter bottom sheet - Swipe dismiss
const handleSwipeDismiss = () => {
  haptics.light();
};
```

---

### 2. Form Input Mobile Optimization 📱

**Why:** 44px inputs are too small for comfortable mobile typing.

**Files to Update:**
- `/home/user/Critvue/frontend/components/ui/input.tsx`
- `/home/user/Critvue/frontend/components/ui/textarea.tsx`

**Changes:**
```tsx
// Update Input component default size
const inputVariants = cva(
  "...",
  {
    variants: {
      size: {
        default: "h-12 text-base", // Change from h-10, add text-base
        lg: "h-14 text-lg",
      }
    },
    defaultVariants: {
      size: "default" // Now 48px by default
    }
  }
);

// Prevent iOS auto-zoom
className="text-base" // Minimum 16px font size
```

**Apply to all form components:**
- BasicInfoStep (title, description)
- FeedbackAreasStep (custom feedback)
- Accept/Reject modals (testimonial, reason)

**Estimated Time:** 3 hours

---

### 3. Keyboard-Aware Layout ⌨️

**Why:** Virtual keyboard hides form content, frustrating users.

**Implementation:**
- Create `/home/user/Critvue/frontend/hooks/useKeyboardHeight.ts`
- Apply to all form pages

**Code:** See MOBILE_UX_REVIEW.md Section 14 - Keyboard-Aware Layout Hook

**Usage:**
```tsx
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

function ReviewForm() {
  const keyboardHeight = useKeyboardHeight();

  return (
    <div style={{ paddingBottom: keyboardHeight }}>
      {/* Form content */}
    </div>
  );
}
```

**Apply to:**
- New Review Request Flow (all steps with inputs)
- Review Writing Page
- Accept Review Modal (testimonial)
- Reject Review Modal (reason)

**Estimated Time:** 4 hours

---

### 4. Mobile File Upload Enhancement 📸

**Why:** Users expect camera access and image preview on mobile.

**Implementation:**
- Create `/home/user/Critvue/frontend/components/ui/mobile-file-upload.tsx`
- Update FileUploadStep to use new component

**Features:**
- Camera access via `capture="environment"`
- Image preview before upload
- Automatic compression for mobile data
- Progress indicators

**Code:** See MOBILE_UX_REVIEW.md Section 14 - Mobile File Upload Component

**Replace in:**
- `/home/user/Critvue/frontend/components/review-flow/file-upload-step.tsx`

**Estimated Time:** 6 hours

---

## Priority 2 - Important (Implement Within 2 Weeks)

### 5. Review Writing Page 📝

**Why:** Core reviewer workflow - submit review text.

**File:** `/home/user/Critvue/frontend/app/review/write/[slotId]/page.tsx` (create)

**Required Features:**
1. Keyboard-aware layout
2. Auto-save every 2 seconds
3. Mobile-friendly rich text editor (TipTap)
4. File upload from camera
5. Orientation change persistence
6. Preview mode
7. Floating submit button
8. Unsaved changes warning

**Code Examples:** See MOBILE_UX_REVIEW.md Section 8

**Estimated Time:** 16 hours

---

### 6. Convert Modals to Bottom Sheets (Mobile) 📲

**Why:** Bottom sheets are more ergonomic on mobile.

**Files to Update:**
- `/home/user/Critvue/frontend/components/dashboard/accept-review-modal.tsx`
- `/home/user/Critvue/frontend/components/dashboard/reject-review-modal.tsx`

**Implementation:**
```tsx
<DialogContent
  className={cn(
    "max-w-2xl",
    // Desktop: centered modal
    "lg:max-h-[90vh] lg:overflow-y-auto",
    // Mobile: bottom sheet
    "sm:max-h-[85vh] sm:rounded-t-3xl sm:rounded-b-none",
    "sm:fixed sm:bottom-0 sm:left-0 sm:right-0 sm:top-auto",
    "sm:translate-y-0 sm:data-[state=closed]:slide-out-to-bottom"
  )}
>
  {/* Add drag handle on mobile */}
  <div className="flex justify-center py-4 sm:block hidden">
    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
  </div>

  {/* Modal content */}
</DialogContent>
```

**Estimated Time:** 4 hours

---

### 7. Pull-to-Refresh 🔄

**Why:** Expected mobile pattern for refreshing lists.

**Implementation:**
- Create `/home/user/Critvue/frontend/components/ui/pull-to-refresh.tsx`
- Wrap Dashboard and Browse page content

**Code:** See MOBILE_UX_REVIEW.md Section 14 - Pull-to-Refresh Component

**Usage:**
```tsx
<PullToRefresh onRefresh={async () => await refetch()}>
  {/* Dashboard/Browse content */}
</PullToRefresh>
```

**Apply to:**
- Dashboard page (refresh reviews)
- Browse page (refresh marketplace)

**Estimated Time:** 4 hours

---

### 8. Claim Confirmation Bottom Sheet ✅

**Why:** Better user confidence before claiming reviews.

**File:** `/home/user/Critvue/frontend/components/browse/claim-confirmation-sheet.tsx` (create)

**Features:**
- Review details preview
- Terms and conditions
- 56px CTA button
- Haptic feedback

**Code:** See MOBILE_UX_REVIEW.md Section 9 - Claim Confirmation Modal

**Estimated Time:** 6 hours

---

## Priority 3 - Enhancement (Nice to Have)

### 9. Image Optimization Service 🖼️

**File:** `/home/user/Critvue/frontend/lib/image-optimization.ts` (create)

**Features:**
- WebP conversion
- Responsive images (srcset)
- Lazy loading

**Estimated Time:** 4 hours

---

### 10. Offline Support 📡

**Implementation:**
- Service worker
- Cache static assets
- Save drafts locally

**Estimated Time:** 8 hours

---

### 11. Native Share API 🔗

**Implementation:**
```tsx
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: review.title,
      text: review.description,
      url: window.location.href
    });
  }
};
```

**Estimated Time:** 2 hours

---

### 12. Swipe Actions on Lists 👆

**Implementation:**
- Swipe left/right for quick actions
- Archive, view, delete

**Estimated Time:** 6 hours

---

## Quick Wins (< 2 hours each)

### A. Increase Touch Targets to 48px

**Files:**
- Dashboard tabs (line 252): Change `min-h-[44px]` to `min-h-[48px]`
- Review cards (line 435, 449): Change `min-h-[44px]` to `min-h-[48px]`

**Total Estimated Time:** 30 minutes

---

### B. Add Swipe Hint Animation

**File:** `/home/user/Critvue/frontend/app/browse/page.tsx`

**Add to review cards:**
```tsx
{/* First card only */}
{index === 0 && (
  <div className="absolute bottom-4 right-4 animate-bounce">
    <div className="bg-accent-blue text-white text-xs px-3 py-2 rounded-full">
      Swipe for more →
    </div>
  </div>
)}
```

**Estimated Time:** 30 minutes

---

### C. Add Loading States

**All async actions should show loading:**
- Claim button
- Accept/Reject buttons
- Form submissions

**Example:**
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="size-4 animate-spin" />
      Loading...
    </>
  ) : (
    'Claim Review'
  )}
</Button>
```

**Estimated Time:** 1 hour

---

## Testing Checklist

After implementing Priority 1 items:

- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone 14 Pro
- [ ] Test on Android device
- [ ] Verify all touch targets ≥ 48px
- [ ] Test keyboard behavior in all forms
- [ ] Test file upload from camera
- [ ] Verify haptic feedback works
- [ ] Test swipe gestures
- [ ] Check performance on 3G network
- [ ] Run accessibility audit (VoiceOver, TalkBack)

---

## Total Time Estimates

**Priority 1 (Critical):**
- Haptic feedback: 2 hours
- Form optimization: 3 hours
- Keyboard handling: 4 hours
- File upload: 6 hours
- **Total: 15 hours** ⏱️

**Priority 2 (Important):**
- Review writing page: 16 hours
- Bottom sheets: 4 hours
- Pull-to-refresh: 4 hours
- Claim confirmation: 6 hours
- **Total: 30 hours** ⏱️

**Priority 3 (Enhancement):**
- **Total: 20 hours** ⏱️

**Quick Wins:**
- **Total: 2 hours** ⏱️

**Grand Total: 67 hours** (approximately 2 weeks of focused development)

---

## Implementation Order

### Week 1
1. Day 1-2: Haptic feedback + Form optimization (5 hours)
2. Day 3: Keyboard-aware layout (4 hours)
3. Day 4-5: Mobile file upload (6 hours)
4. **Milestone:** Priority 1 complete, test on devices

### Week 2
1. Day 6-8: Review writing page (16 hours)
2. Day 9: Bottom sheets + Pull-to-refresh (8 hours)
3. Day 10: Claim confirmation + Quick wins (8 hours)
4. **Milestone:** Priority 2 complete, comprehensive testing

### Week 3 (Optional)
- Priority 3 enhancements
- Performance optimization
- Polish and refinement

---

## Success Metrics

**Target Mobile UX Score: 95/100**

**Current: 85/100**

After Priority 1: **90/100** (+5)
After Priority 2: **95/100** (+5)
After Priority 3: **98/100** (+3)

---

## Reference Components

**Exemplary Implementations to Learn From:**

1. **Dashboard Quick Actions** - Perfect swipeable card pattern
2. **Filter Bottom Sheet** - Textbook mobile modal pattern
3. **Accept Review Modal** - Exemplary touch target implementation
4. **Review Acceptance Page** - Perfect sticky button pattern

---

## Questions or Issues?

Contact: Mobile UX Architect
Review Document: `/home/user/Critvue/MOBILE_UX_REVIEW.md`
