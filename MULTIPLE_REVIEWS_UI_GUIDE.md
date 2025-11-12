# Multiple Reviews Feature - UI/UX Visual Guide

## Quick Visual Reference for Implementation Review

### 1. Number of Reviews Selection Step (Expert Reviews Only)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                   How many reviews?                               │
│     Getting multiple perspectives provides more comprehensive     │
│                         feedback                                  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │        [-]         [   5   ]         [+]                  │  │
│  │                    reviews                                 │  │
│  │                                                            │  │
│  │    Or drag the slider                                     │  │
│  │    ━━━━━━━━━●━━━━━━━━━━                                  │  │
│  │    1         5            10                               │  │
│  │                                                            │  │
│  │    Quick Select:                                           │  │
│  │    [ 3 reviews ] [ 5 reviews ] [ 10 reviews ]             │  │
│  │                                                            │  │
│  │    ┌─────────────────────────────────────────┐           │  │
│  │    │ Price per review: $49                    │           │  │
│  │    │ ✨ Volume discount (10%): -$25          │  GREEN    │  │
│  │    │ ──────────────────────────────────────── │           │  │
│  │    │ Total: $220                              │  PEACH    │  │
│  │    └─────────────────────────────────────────┘           │  │
│  │                                                            │  │
│  │    🎖️ Popular - Multiple viewpoints                       │  │
│  │                                                            │  │
│  │    ┌─────────────────────────────────────────┐           │  │
│  │    │ 👥 Why multiple reviews?                 │  SAGE    │  │
│  │    │ • Diverse perspectives from experts      │           │  │
│  │    │ • Identify patterns & common feedback    │           │  │
│  │    │ • Faster turnaround w/ parallel reviews  │           │  │
│  │    │ ✨ Unlock 10% volume discount!           │  GREEN    │  │
│  │    └─────────────────────────────────────────┘           │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

BRAND COLORS USED:
• Blue (#3B82F6): Slider thumb, primary accents
• Peach (#F97316): Total price, premium features
• Sage Green (#84CC16): Benefits section background
• Green (#10B981): Success indicators, high discounts
• Amber (#F59E0B): Medium urgency states
```

---

### 2. Browse Card - Claim Status Variations

#### A. Multiple Slots Available (Healthy State)
```
┌─────────────────────────────────────────────────────────┐
│ [Preview Image]                                          │
│                                                          │
│ [Design] [Expert] [👥 3 of 5 slots] 🟢                 │
│                                                          │
│ UI/UX Dashboard Redesign Review                         │
│ Looking for comprehensive feedback on...                 │
│                                                          │
│ Review slots                     3 of 5 claimed         │
│ ████████████░░░░░░░░                                    │
│ ^ SAGE GREEN PROGRESS                                   │
│                                                          │
│ $150 | 3 days | ★ 4.9                                   │
│                                                          │
│ [View Details] [Claim]                                  │
└─────────────────────────────────────────────────────────┘
```

#### B. Only 1 Slot Left (Urgent)
```
┌─────────────────────────────────────────────────────────┐
│ [Preview Image]                                          │
│                                                          │
│ [Code] [Expert] [⚠️ Only 1 slot left!] 🔶 PULSE        │
│                                                          │
│ React Component Architecture Review                      │
│ Need expert eyes on state management...                 │
│                                                          │
│ Review slots                     4 of 5 claimed         │
│ ████████████████████░░░░                                │
│ ^ AMBER PROGRESS (urgency)                              │
│                                                          │
│ $200 | 1 day | ★ 5.0                                    │
│                                                          │
│ [View Details] [Claim Now!]                             │
└─────────────────────────────────────────────────────────┘
```

#### C. All Slots Claimed (Complete)
```
┌─────────────────────────────────────────────────────────┐
│ [Preview Image]                                          │
│                                                          │
│ [Video] [Expert] [👥 All slots claimed] ⚫              │
│                                                          │
│ Tutorial Video Script Review                            │
│ Looking for feedback on pacing and...                   │
│                                                          │
│ Review slots                     5 of 5 claimed         │
│ ████████████████████████████                            │
│ ^ GREEN PROGRESS (complete)                             │
│                                                          │
│ $75 | 2 days | ★ 4.8                                    │
│                                                          │
│ [View Details] [Claimed ✓]                              │
└─────────────────────────────────────────────────────────┘
```

#### D. Standard Single Review (No Progress Bar)
```
┌─────────────────────────────────────────────────────────┐
│ [Preview Image]                                          │
│                                                          │
│ [Writing] [Expert] ⭐                                    │
│                                                          │
│ Blog Post SEO Review                                    │
│ Need help optimizing for search engines...              │
│                                                          │
│ (No progress bar - single review)                       │
│                                                          │
│ $50 | 5 days | ★ 4.7                                    │
│                                                          │
│ [View Details] [Claim]                                  │
└─────────────────────────────────────────────────────────┘
```

---

### 3. Dashboard Review Items - Claim Progress

#### A. Partially Claimed Multi-Review
```
┌───────────────────────────────────────────────────────────┐
│  [🎨]  Landing Page Hero Section Redesign    [Pending]    │
│        Need feedback on visual hierarchy and CTA...        │
│                                                            │
│        👥 2 of 4 reviews claimed          2 slots available│
│        ████████████░░░░░░░░░░░░░░░░                       │
│        ^ SAGE GREEN PROGRESS                               │
│                                                            │
│        🕐 2 hours ago • Expert Review                      │
└───────────────────────────────────────────────────────────┘
```

#### B. Almost Fully Claimed (Urgent)
```
┌───────────────────────────────────────────────────────────┐
│  [📱]  Mobile App Navigation Review         [In Review]    │
│        Looking for UX improvements for...                  │
│                                                            │
│        👥 2 of 3 reviews claimed           1 slot available│
│        ████████████████████░░░░░░░░                       │
│        ^ AMBER PROGRESS (urgency)                          │
│                                                            │
│        🕐 5 hours ago • Expert Review                      │
└───────────────────────────────────────────────────────────┘
```

#### C. Fully Claimed Multi-Review
```
┌───────────────────────────────────────────────────────────┐
│  [💻]  API Documentation Clarity Review   [In Review]     │
│        Need expert feedback on developer docs...           │
│                                                            │
│        👥 5 of 5 reviews claimed        All slots filled ✓│
│        ████████████████████████████████                   │
│        ^ GREEN PROGRESS (complete)                         │
│                                                            │
│        🕐 1 day ago • Expert Review                        │
└───────────────────────────────────────────────────────────┘
```

#### D. Single Review (No Progress)
```
┌───────────────────────────────────────────────────────────┐
│  [🎨]  Portfolio Website Color Scheme        [Completed]   │
│        Simple feedback request on color palette...         │
│                                                            │
│        (No progress bar - single review request)           │
│                                                            │
│        🕐 3 days ago • Quick Feedback                      │
└───────────────────────────────────────────────────────────┘
```

---

### 4. Review Flow Progress Indicator

#### Free Review Flow (6 steps total)
```
Step 1: Content Type
Step 2: Basic Info
Step 3: File Upload
Step 4: Feedback Areas
Step 5: Review Type [Free selected]
Step 6: (SKIPPED - Number of Reviews)
Step 7: Review & Submit

Progress Dots: ●━●━●━●━●━● (6 active)
```

#### Expert Review Flow (7 steps total)
```
Step 1: Content Type
Step 2: Basic Info
Step 3: File Upload
Step 4: Feedback Areas
Step 5: Review Type [Expert selected]
Step 6: Number of Reviews ← NEW STEP
Step 7: Review & Submit

Progress Dots: ●━●━●━●━●━●━● (7 active)
```

---

### 5. Mobile Optimizations

#### Touch Target Sizing
```
┌─────────────────────────────┐
│  How many reviews?           │
│                              │
│  ┌────┐  ┌──────┐  ┌────┐  │
│  │ -  │  │   5  │  │ +  │  │  ← 56px × 56px
│  │    │  │      │  │    │  │     (44px min)
│  └────┘  └──────┘  └────┘  │
│         reviews             │
│                              │
│  ━━━━━━━●━━━━━━━           │  ← 48px thumb
│                              │
│  ┌──────────────────────┐  │
│  │    3 reviews         │  │  ← 48px height
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │    5 reviews         │  │  ← 48px height
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │    10 reviews        │  │  ← 48px height
│  └──────────────────────┘  │
└─────────────────────────────┘
```

#### Active States (Tactile Feedback)
```
Normal State:      [    3 reviews    ]
Active State:      [  3 reviews  ]  ← scale(0.95)
                       (0.98 scale)
```

---

### 6. Color System Quick Reference

```
┌──────────────────────────────────────────────────────────┐
│ CLAIM STATUS COLORS                                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 🟢 Sage Green (#84CC16)  → Multiple slots available      │
│    Usage: Progress bars, available slot badges           │
│    Background: bg-accent-sage/20                          │
│    Text: text-accent-sage                                 │
│                                                           │
│ 🔶 Amber (#F59E0B)       → Only 1 slot left (urgent)     │
│    Usage: Warning badges, urgent progress bars           │
│    Background: bg-amber-500/10                            │
│    Animation: animate-pulse                               │
│                                                           │
│ 🟩 Green (#10B981)       → All slots claimed             │
│    Usage: Complete state, success indicators             │
│    Background: bg-green-500/10                            │
│    Text: text-green-600                                   │
│                                                           │
│ ⚫ Neutral Gray          → Neutral/disabled states        │
│    Usage: "All slots claimed" badge                       │
│    Background: bg-muted                                   │
│    Text: text-muted-foreground                            │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ PRICING & PREMIUM COLORS                                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 🔵 Blue (#3B82F6)        → Primary actions, accents      │
│    Usage: Slider thumb, primary buttons, links           │
│    Gradient: from-accent-blue to-accent-peach             │
│                                                           │
│ 🍑 Peach (#F97316)       → Pricing, premium features     │
│    Usage: Total price, premium badges, volume tiers      │
│    Background: bg-accent-peach/10                         │
│    Border: border-accent-peach/20                         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

### 7. Animation Timing Reference

```
┌──────────────────────────────────────────────────────────┐
│ TRANSITION SPEEDS                                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 200ms  → Hover states, button interactions               │
│          transition-all duration-200                      │
│                                                           │
│ 300ms  → Step transitions, slide-ins                     │
│          animate-in fade-in slide-in duration-300         │
│                                                           │
│ 500ms  → Progress bar fills, major state changes         │
│          transition-all duration-500                      │
│                                                           │
│ 1000ms → Shimmer effects, ambient animations             │
│          transition-transform duration-1000               │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ SCALE TRANSFORMS                                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ hover:scale-110    → Icon/element emphasis               │
│ active:scale-95    → Button press feedback               │
│ active:scale-[0.98]→ Card press feedback                 │
│ animate-pulse      → Urgent states (1 slot left)         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

### 8. Accessibility Patterns

```
┌──────────────────────────────────────────────────────────┐
│ ARIA LABELS & SEMANTIC HTML                               │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ <button aria-label="Increase number of reviews">         │
│   <Plus className="size-5" />                             │
│ </button>                                                 │
│                                                           │
│ <input                                                    │
│   type="range"                                            │
│   aria-label="Number of reviews slider"                  │
│   min="1" max="10" step="1"                               │
│ />                                                        │
│                                                           │
│ <button aria-label="Set to 3 reviews">                   │
│   3 reviews                                               │
│ </button>                                                 │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ KEYBOARD NAVIGATION                                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Tab      → Move between increment, slider, quick select  │
│ Space    → Activate buttons                               │
│ Enter    → Activate buttons, submit form                 │
│ ←/→      → Navigate slider (when focused)                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist for Brand Compliance Review

### Visual Design ✅
- [x] Glassmorphism aesthetic maintained
- [x] Brand colors used correctly (blue, peach, sage, green, amber)
- [x] Proper shadow hierarchy (sm, md, lg, xl, 2xl)
- [x] Consistent border radius (rounded-lg, rounded-xl, rounded-2xl)
- [x] Gradient usage follows brand guidelines

### Typography ✅
- [x] Font weights: medium (500), semibold (600), bold (700)
- [x] Text sizes: xs (12px), sm (14px), base (16px), lg (18px), xl (20px)
- [x] Line heights: leading-none, leading-snug, leading-relaxed
- [x] Proper text color hierarchy (foreground, muted-foreground)

### Spacing & Layout ✅
- [x] 4px spacing scale (px-3, px-4, px-6, px-8)
- [x] Gap utilities (gap-2, gap-3, gap-4, gap-6)
- [x] Padding consistency (p-4, p-6, p-8)
- [x] Mobile-first responsive breakpoints (sm:, md:, lg:, xl:)

### Interactions ✅
- [x] Hover states with proper transitions
- [x] Active states with scale feedback
- [x] Focus rings for accessibility
- [x] Smooth animations (no jarring movements)
- [x] Loading states with spinners

### Mobile Optimization ✅
- [x] Touch targets ≥ 44px
- [x] touch-manipulation class applied
- [x] Responsive text scaling
- [x] Horizontal scrolling prevented
- [x] Active state visual feedback

### Accessibility ✅
- [x] ARIA labels on all controls
- [x] Keyboard navigation support
- [x] Semantic HTML (button, label, section)
- [x] Color contrast ratios met (WCAG AA)
- [x] Screen reader friendly text

---

**This guide serves as the visual reference for:**
1. QA testing the implementation
2. Ensuring brand compliance
3. Validating responsive behavior
4. Checking accessibility standards
5. Coordinating with backend team on expected UI states
