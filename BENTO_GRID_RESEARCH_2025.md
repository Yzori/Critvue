# Bento Grid Layout Best Practices - Comprehensive Research 2025

## Executive Summary

This document provides evidence-based research on bento grid layouts in 2025, analyzing successful implementations, technical patterns, and design principles. Based on analysis of Apple.com, modern SaaS platforms, and your current Critvue implementation, this guide identifies what makes bento grids work well and provides concrete recommendations for improvement.

---

## 1. Visual Examples Analysis

### 1.1 Apple.com Product Pages

**Key Characteristics:**
- Originated the trend with promotional product specification slides
- Features displayed in varied rectangular compartments
- Clean visual hierarchy with 2-3 large "hero" tiles in first viewport
- Balance: Large tiles showcase priority content, smaller tiles complement
- Generous white space between elements
- Smooth transitions and subtle hover effects

**Success Factors:**
- Content-first approach: Important features get larger real estate
- Consistent 8px corner radius for polished aesthetics
- Limited color palette (2-3 accent colors max)
- Bold typography paired with minimalist design
- Sections limited to 4-8 compartments per view

### 1.2 SaaS Landing Pages (2024-2025)

**Notable Examples:**

1. **Gravitates**
   - Clean bento grid highlighting AI summaries and features
   - High importance cards use stronger glassmorphism
   - Responsive breakpoints from 1-4 columns

2. **Cosmic**
   - Grid-based layout supporting desktop and mobile elegantly
   - Asymmetric pattern creates visual interest
   - Featured cards have gradient border accents

3. **Bento.me**
   - User-customizable platform with varying block sizes
   - Demonstrates flexibility of the pattern
   - Balance of text, images, and icons

4. **10xDesigners (Lottie Lessons)**
   - Mix of playful illustrations and concise text
   - Clear content boundaries
   - Interactive hover states enhance engagement

5. **Procreate**
   - Five distinct content blocks with balanced clean lines
   - Mixed visual/textual elements
   - Professional minimalist aesthetic

**Common Success Patterns:**
- Whitespace utilization for clarity
- Mixed content types (text, images, icons)
- Interactive hover states
- Clear information compartmentalization
- Responsive design across device sizes

### 1.3 Dashboard Interfaces

**Best Practices:**
- Used for data visualization with varied emphasis
- Not ideal for complex interactive dashboards requiring frequent updates
- Works best when information is scannable, not deeply interactive
- Limit to 9 or fewer boxes to maintain clarity

**Warning Signs:**
- Bento grids for dashboards work best for overview/summary views
- Poor fit for applications requiring constant user interaction
- Can make information difficult to consume at a glance if overused

---

## 2. Layout Patterns

### 2.1 Card Size Distribution

**The 60-30-10 Design Rule:**
- **60% Standard Cards (1x1):** The foundation, maintains rhythm
- **30% Featured Cards (2x1, 1x2):** Creates visual interest
- **10% Hero Cards (2x2):** Focal points, maximum impact

**Common Size Ratios:**
- **1x1 (Square):** Base unit, standard cards
- **2x1 (Wide):** Horizontal content, promotions
- **1x2 (Tall):** Vertical content, image-heavy
- **2x2 (Large):** Hero cards, premium content
- **3x2 (Extra Large):** Rare, reserved for primary CTAs

**Distribution Pattern (per 10 cards):**
- 6 medium (1x1)
- 2-3 featured (2x1 or 1x2)
- 1-2 large (2x2)

### 2.2 Asymmetry vs Symmetry Balance

**Best Practices:**
- **Controlled Asymmetry:** Deliberate pattern, not random chaos
- **Repeating Rhythm:** Pattern repeats every 8-12 cards
- **Visual Anchors:** Large cards act as focal points
- **Reading Flow:** Maintains natural top-to-bottom, left-to-right scan

**Avoid:**
- Pure randomness (looks unprofessional)
- Too much symmetry (looks boring and corporate)
- Excessive large cards (overwhelming, destroys hierarchy)

**Optimal Balance:**
```
Pattern Example (12-card cycle):
[Large] [Medium] [Medium] [Wide  ] [Medium] [Medium]
[      ] [Tall  ] [Medium] [      ] [Tall  ] [Medium]
         [      ]                   [      ]
```

### 2.3 Visual Rhythm and Flow

**Creating Natural Flow:**
1. **Establish Focal Points:** Position 2-3 hero cards in first viewport
2. **Cluster Balance:** Group smaller tiles around large tiles
3. **Breathing Room:** Ensure large cards don't cluster together
4. **Diagonal Movement:** Create subtle diagonal reading paths

**Rhythm Patterns:**
- Alternating large/small creates bounce
- Consistent gaps create predictability
- Varied heights/widths create interest

### 2.4 White Space Management

**Critical Spacing Recommendations:**

**Gap Sizes (2025 Standards):**
- **Mobile:** 16px (1rem) - Maximize screen real estate
- **Tablet:** 20px (1.25rem) - Balanced density
- **Desktop:** 24px (1.5rem) - Professional spacing
- **Large screens:** 28-32px (1.75-2rem) - Premium feel

**Card Padding:**
- **Small cards:** 16px (p-4)
- **Medium cards:** 16-24px (p-4 to p-6)
- **Large cards:** 24-32px (p-6 to p-8)
- **Hero cards:** 32-40px (p-8 to p-10)

**Best Practice:**
Use uniform gaps (single value like 24px) rather than variable gaps. This creates visual consistency and professional appearance.

### 2.5 Grid Density Optimization

**Column Configuration:**

| Screen Width | Columns | Max Cards Visible | Optimal |
|--------------|---------|-------------------|---------|
| Mobile (<640px) | 1 | 2-3 | 2-3 |
| Tablet (640-1023px) | 2 | 4-6 | 4-5 |
| Desktop (1024-1535px) | 3 | 6-9 | 6-8 |
| Large (≥1536px) | 4 | 8-12 | 8-10 |

**Density Guidelines:**
- **Too Sparse:** Large gaps (>40px), very few cards per view
- **Optimal:** 6-10 cards visible in first viewport
- **Too Dense:** Small gaps (<12px), more than 12 cards per view

**Row Height Strategy:**
```css
/* Minimum heights with flexibility */
grid-auto-rows: minmax(280px, auto);  /* Mobile */
grid-auto-rows: minmax(300px, auto);  /* Tablet */
grid-auto-rows: minmax(320px, auto);  /* Desktop */
```

---

## 3. Technical Implementation

### 3.1 CSS Grid Best Practices

**Foundation Pattern:**
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-auto-rows: minmax(280px, auto);
  gap: 1.5rem;
}
```

**Responsive Columns (Recommended):**
```css
.bento-grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile first */
  grid-auto-rows: minmax(280px, auto);
  gap: 1rem;
}

@media (min-width: 640px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1536px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.75rem;
  }
}
```

**Card Spanning:**
```css
/* Use utility classes for flexibility */
.card-large {
  grid-column: span 2;
  grid-row: span 2;
}

.card-wide {
  grid-column: span 2;
  grid-row: span 1;
}

.card-tall {
  grid-column: span 1;
  grid-row: span 2;
}
```

**Modern CSS Features:**
```css
/* Aspect ratio for consistent proportions */
.bento-grid {
  aspect-ratio: var(--cols) / var(--rows);
}

/* Container queries for responsive content */
.card {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card-title {
    font-size: 1.25rem;
  }
}
```

### 3.2 Critical Decision: Grid-Auto-Flow

**DO NOT USE `grid-auto-flow: dense`**

**Why Dense Packing is Problematic:**
- Breaks logical reading order (accessibility fail)
- Visual order doesn't match DOM order
- Confusing for screen readers
- Unpredictable layout changes when filtering
- WCAG 2.1 Level AA violation (meaningful sequence)

**Better Approach:**
- Use intelligent card sizing algorithm
- Accept some white space as intentional design
- Maintain predictable top-to-bottom, left-to-right flow
- Visual order matches semantic order

### 3.3 Responsive Breakpoint Strategies

**Mobile-First Approach:**
```css
/* Base: Mobile (all cards equal) */
.card {
  grid-column: span 1;
  grid-row: span 1;
}

/* Tablet: Introduce variety */
@media (min-width: 640px) {
  .card-large {
    grid-column: span 2;
    grid-row: span 2;
  }
  .card-wide {
    grid-column: span 2;
  }
}

/* Desktop: Full bento effect */
@media (min-width: 1024px) {
  .card-tall {
    grid-row: span 2;
  }
}
```

**Smart Breakpoint Logic:**
1. **Mobile (< 640px):** Single column, limited size variation
2. **Tablet (640-1023px):** 2 columns, introduce large/wide cards
3. **Desktop (1024-1535px):** 3 columns, full size variety
4. **Large (≥ 1536px):** 4 columns, maximum density

### 3.4 Animation and Transition Patterns

**Entrance Animations:**
```css
.card {
  animation: fade-in 0.3s ease-out;
  animation-fill-mode: backwards;
}

/* Staggered delay */
.card:nth-child(1) { animation-delay: 0ms; }
.card:nth-child(2) { animation-delay: 50ms; }
.card:nth-child(3) { animation-delay: 100ms; }

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Hover Effects:**
```css
.card {
  transition: transform 0.3s ease-out,
              box-shadow 0.3s ease-out,
              filter 0.3s ease-out;
}

.card:hover {
  transform: translateY(-0.5rem);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}

/* Premium cards get more dramatic hover */
.card-premium:hover {
  transform: translateY(-0.75rem) scale(1.02);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
}
```

**Micro-interactions:**
```css
/* Gradient border animation */
.card-premium {
  background-image: linear-gradient(white, white),
                    linear-gradient(135deg, var(--blue), var(--orange));
  background-origin: border-box;
  background-clip: padding-box, border-box;
  border: 2px solid transparent;
  transition: background-position 0.5s ease;
}

.card-premium:hover {
  background-position: 100% 0, 0 0;
}
```

### 3.5 Performance Considerations

**CSS Performance:**
```css
.card {
  /* GPU acceleration for transforms */
  will-change: transform;

  /* Contain layout changes */
  contain: layout;

  /* Optimize animations */
  transform: translateZ(0);
}
```

**JavaScript Optimization:**
```typescript
// Debounce resize handler
const debouncedResize = useMemo(
  () => debounce(handleResize, 150),
  []
);

// Memoize card size calculations
const cardSize = useMemo(
  () => calculateCardSize(review, index),
  [review, index]
);

// Virtualize long lists
import { useVirtualizer } from '@tanstack/react-virtual';
```

**Bundle Size:**
- Pure CSS Grid: 0 additional KB
- No JavaScript layout libraries needed
- Leverage native browser capabilities

---

## 4. Common Mistakes to Avoid

### 4.1 Layout Issues

**MISTAKE: Overcrowding**
- Problem: Too many cards, gaps too small (<12px)
- Impact: Cluttered, overwhelming, poor scannability
- Solution: Limit to 6-10 visible cards, use 20-32px gaps

**MISTAKE: Forced Space Filling**
- Problem: Using `grid-auto-flow: dense` to eliminate gaps
- Impact: Breaks reading order, accessibility issues
- Solution: Accept white space, use intelligent sizing

**MISTAKE: Inconsistent Gaps**
- Problem: Variable gaps (16px, 20px, 24px mixed)
- Impact: Unprofessional appearance, visual chaos
- Solution: Single gap value per breakpoint

**MISTAKE: Breaking on Responsive**
- Problem: Layout collapses or overflows at breakpoints
- Impact: Poor mobile/tablet experience
- Solution: Test all breakpoints, use mobile-first approach

### 4.2 Visual Hierarchy Problems

**MISTAKE: Too Many Large Cards**
- Problem: More than 20% of cards are 2x2
- Impact: Destroys hierarchy, everything competes
- Solution: Follow 60-30-10 rule strictly

**MISTAKE: No Focal Points**
- Problem: All cards same size or random sizing
- Impact: Flat, boring, no visual interest
- Solution: Establish 2-3 hero cards per viewport

**MISTAKE: Poor Importance Scoring**
- Problem: Random or content-agnostic sizing
- Impact: Low-value content gets prominence
- Solution: Calculate importance based on business metrics

**MISTAKE: Weak Visual Differentiation**
- Problem: High importance cards look like standard cards
- Impact: Users miss important content
- Solution: Use stronger glassmorphism, borders, shadows

### 4.3 Spacing/Gap Issues

**MISTAKE: Mobile Gaps Too Large**
- Problem: Using 32px+ gaps on mobile screens
- Impact: Very few cards visible, excessive scrolling
- Solution: 12-16px on mobile, scale up on larger screens

**MISTAKE: No Internal Padding Variation**
- Problem: All cards have same padding regardless of size
- Impact: Large cards feel cramped, small cards feel empty
- Solution: Scale padding with card size (16px → 32px)

**MISTAKE: Inconsistent Border Radius**
- Problem: Mixed radius values (12px, 16px, 20px)
- Impact: Lacks cohesion and polish
- Solution: 16px standard, 24px for large cards only

### 4.4 Card Size Proportion Mistakes

**MISTAKE: No Pattern or Pure Random**
- Problem: Card sizes assigned randomly
- Impact: Chaotic, unprofessional appearance
- Solution: Create repeating pattern (8-12 card cycle)

**MISTAKE: Tall Cards on Mobile**
- Problem: 1x2 cards on small screens
- Impact: Excessive scrolling, poor UX
- Solution: Tall cards only on desktop (1024px+)

**MISTAKE: Wrong Aspect Ratios**
- Problem: Very tall (1x3) or very wide (3x1) cards
- Impact: Awkward proportions, breaks grid flow
- Solution: Stick to 1x1, 1x2, 2x1, 2x2 maximum

### 4.5 Content Adaptation Failures

**MISTAKE: Same Content for All Sizes**
- Problem: Large and small cards show identical content
- Impact: Wasted space or cramped content
- Solution: Adapt content density to card size

**MISTAKE: Image Aspect Ratios Not Maintained**
- Problem: Images stretch or crop awkwardly
- Impact: Unprofessional appearance
- Solution: Use consistent aspect ratios (16:9, 4:3, 1:1)

**MISTAKE: Text Overflow**
- Problem: No line clamping, text breaks layout
- Impact: Cards vary wildly in height
- Solution: Use line-clamp-2, line-clamp-3, etc.

---

## 5. Design Principles

### 5.1 Content-First Sizing Logic

**Importance Scoring Framework:**
```typescript
function calculateImportance(item: ReviewItem): number {
  let score = 50; // Base score

  // Business value indicators
  if (item.review_type === 'expert') score += 25;
  if (item.is_featured) score += 35;

  // Monetary value
  if (item.price > 150) score += 20;
  else if (item.price > 100) score += 15;
  else if (item.price > 75) score += 10;

  // Urgency
  if (item.urgency === 'high') score += 20;
  else if (item.urgency === 'medium') score += 8;

  // Creator quality
  if (item.creator_rating >= 4.5) score += 10;
  else if (item.creator_rating >= 4.0) score += 5;

  return Math.min(score, 100);
}
```

**Thresholds:**
- **85-100:** Premium hero cards (2x2 or 2x1)
- **70-84:** Featured cards (2x1 or 1x2)
- **55-69:** Elevated standard (1x1, occasional wide)
- **40-54:** Standard cards (1x1)
- **< 40:** Small accent cards for contrast

### 5.2 Visual Weight Distribution

**The 60-30-10 Rule Applied:**
- **60% Visual Weight:** Standard cards, foundation
- **30% Visual Weight:** Featured content, variety
- **10% Visual Weight:** Hero cards, focal points

**Balance Techniques:**
1. **Cluster smaller tiles around large tiles**
2. **Distribute large cards throughout viewport**
3. **Never stack large cards in same column**
4. **Create diagonal "reading paths"**

### 5.3 Focal Point Creation

**Establishing Primary Focal Point:**
1. Place first hero card in top-left quadrant
2. Use strongest visual treatment (gradient border)
3. Premium glassmorphism (90% opacity)
4. Largest typography (2xl-3xl)
5. Most dramatic hover effect

**Secondary Focal Points:**
- Distribute 2-3 throughout page
- Use consistent but slightly less dramatic styling
- Create visual anchors for scanning

**Avoid:**
- More than 3 hero cards per viewport
- Hero cards in bottom-right (weakest position)
- Clustering all focal points together

### 5.4 Balance and Tension

**Creating Visual Tension:**
- Asymmetry: Controlled variation in sizes
- Contrast: Large vs small creates interest
- Rhythm: Predictable pattern with surprises
- White space: Intentional breathing room

**Maintaining Balance:**
- Equal visual weight per quadrant
- No single quadrant dominates
- Distribute colors and imagery evenly
- Balance text-heavy and image-heavy cards

**The "Squint Test":**
Close your eyes halfway and blur your vision. You should see:
- Clear distinction between large and small cards
- Even distribution of visual weight
- Natural reading path
- No overwhelming clusters

---

## 6. Accessibility Considerations

### 6.1 Reading Order

**CRITICAL: DOM Order = Visual Order**
```html
<!-- GOOD: Logical order maintained -->
<div class="bento-grid">
  <div class="card-1">...</div>  <!-- Visually: Top-left -->
  <div class="card-2">...</div>  <!-- Visually: Top-right -->
  <div class="card-3">...</div>  <!-- Visually: Middle-left -->
</div>

<!-- BAD: Visual order doesn't match DOM -->
<div class="bento-grid" style="grid-auto-flow: dense">
  <!-- Card order changes visually based on size -->
</div>
```

### 6.2 Keyboard Navigation

**Best Practices:**
```css
.card:focus-within {
  outline: none;
  ring: 2px solid var(--accent-blue);
  ring-offset: 2px;
}

/* Skip link for filter bypass */
.skip-to-results:focus {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 9999;
}
```

### 6.3 Screen Reader Support

**Semantic HTML:**
```html
<div class="bento-grid" role="list" aria-label="Browse review requests">
  <article role="listitem" aria-labelledby="card-1-title">
    <h3 id="card-1-title">Review Title</h3>
    <!-- Card content -->
  </article>
</div>
```

### 6.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none !important;
    transition: none !important;
  }
}
```

### 6.5 Color Contrast

**WCAG 2.1 Level AA Requirements:**
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

**Testing:**
```
Text on white/80 background:
- Gray-900 (#111827): 18.2:1 ✓
- Gray-800 (#1F2937): 14.8:1 ✓
- Gray-600 (#4B5563): 7.8:1 ✓
```

---

## 7. Marketplace-Specific Recommendations

### 7.1 Browse Page Context

**Unique Requirements:**
- Users scan quickly for relevant reviews
- Price and deadline are critical decision factors
- Trust indicators (ratings, expert status) must be prominent
- Clear CTAs (View Details, Claim) needed

**Bento Grid Advantages:**
- Naturally highlights high-value reviews
- Creates visual interest in potentially dry listings
- Accommodates varied content (images, text, metadata)
- Differentiates from competitor marketplaces

### 7.2 Filter Interaction

**Best Practices:**
1. Maintain grid layout during filtering
2. Smooth transitions when cards appear/disappear
3. Empty state should be clear and actionable
4. Loading skeletons match grid structure

**Animation Strategy:**
```css
.card {
  animation: fade-in 0.3s ease-out;
}

/* Smooth removal */
.card-removing {
  animation: fade-out 0.2s ease-in;
}
```

### 7.3 Scroll Behavior

**Infinite Scroll Considerations:**
- Maintain bento pattern across pages
- Track importance scores across batches
- Consider pagination for better control
- Preserve scroll position when returning

### 7.4 Mobile Commerce UX

**Mobile-Specific Patterns:**
- Single column reduces cognitive load
- Maintain importance-based styling (even without size variation)
- Larger tap targets (48px minimum)
- Simplified metadata on small screens

**Performance:**
- Lazy load images below fold
- Use smaller image variants on mobile
- Minimize animations on low-end devices

---

## 8. Critique of Current Implementation

### 8.1 What's Working Well

**Strengths:**
1. **Importance Scoring:** Well-thought-out algorithm considering multiple factors
2. **Responsive Breakpoints:** Appropriate column counts per screen size
3. **Glassmorphism:** Modern aesthetic with proper backdrop blur
4. **Visual Hierarchy:** Clear differentiation between premium and standard cards
5. **Accessibility:** Good semantic HTML and focus states
6. **Documentation:** Comprehensive docs in BENTO_GRID_REDESIGN.md

### 8.2 Issues Identified

#### 8.2.1 Grid Density and White Space

**Current State:**
```css
gap: 3 sm:gap-4 lg:gap-5  /* 12px → 16px → 20px */
```

**Problem:**
- Gaps are too small for a professional bento grid
- 12px on mobile feels cramped
- 20px on desktop is below 2025 standards (24-32px)

**Recommendation:**
```css
gap: 1rem sm:gap-5 lg:gap-6 xl:gap-7
/* 16px → 20px → 24px → 28px */
```

#### 8.2.2 Card Sizing Pattern

**Current Algorithm:**
- Uses importance thresholds (85, 70, 55)
- Alternates patterns based on index
- Good foundation but creates some issues

**Problems:**
1. Pattern at position 7-9 can create large card clusters
2. "Tall" cards on tablet (640px) too early
3. Mobile "wide" cards (2x1 on 1-column grid) don't make sense

**Recommendation:**
```typescript
// Mobile: No size variation (or minimal)
if (screenSize === "mobile") {
  return "medium"; // All equal for simplicity
}

// Tablet: Introduce large and wide only
if (screenSize === "tablet") {
  if (importanceScore >= 85) return "large";
  if (importanceScore >= 70) return "wide";
  return "medium";
}

// Desktop+: Full variety
// Current logic is good here
```

#### 8.2.3 Visual Hierarchy Execution

**Current Glassmorphism Levels:**
- Premium: 90% opacity
- High: 85% opacity
- Medium: 80% opacity
- Standard: 75% opacity

**Problem:**
Subtle differences (5% steps) may not be noticeable to users.

**Recommendation:**
Create more dramatic steps:
- Premium: 90% opacity + gradient border + shadow-2xl
- High: 82% opacity + solid border + shadow-xl
- Standard: 75% opacity + subtle border + shadow-md

#### 8.2.4 Gap Spacing Consistency

**Current Implementation:**
Gaps are defined but internal padding could be more systematic.

**Recommendation:**
Create clear padding scale:
```typescript
const paddingClasses = {
  small: "p-3",      // 12px
  medium: "p-4 md:p-5",  // 16px → 20px
  large: "p-6 md:p-8",   // 24px → 32px
  wide: "p-4 md:p-6",    // 16px → 24px
  tall: "p-5 md:p-7",    // 20px → 28px
};
```

#### 8.2.5 Card Density Per Viewport

**Current State:**
With current grid setup, first viewport shows approximately:
- Mobile: 2-3 cards
- Tablet: 4-6 cards
- Desktop: 6-9 cards
- Large: 8-12 cards

**Assessment:**
This is actually quite good! Aligns with best practices.

**Minor Tweak:**
Consider increasing `grid-auto-rows` minimum height slightly:
```css
/* Current: 280px → 300px → 320px */
/* Recommended: 300px → 320px → 340px */
```
This would reduce cards per view slightly but increase individual card presence.

---

## 9. Do's and Don'ts Checklist

### DO:

- Use importance-based sizing to create natural hierarchy
- Maintain 60-30-10 distribution (standard-featured-hero)
- Establish 2-3 focal points per viewport
- Use consistent gap spacing (single value per breakpoint)
- Scale padding with card size (small: 16px, large: 32px)
- Create repeating pattern (8-12 card cycle)
- Accept white space as intentional design element
- Test all breakpoints thoroughly
- Maintain DOM order = visual order
- Use mobile-first responsive approach
- Limit to 6-10 cards per viewport
- Differentiate premium cards with gradient borders
- Use glassmorphism appropriately (75-90% opacity range)
- Implement smooth hover effects (translate, shadow)
- Line-clamp text to prevent overflow
- Load images lazily below fold
- Support reduced motion preference
- Use semantic HTML (role="list", role="listitem")
- Implement proper focus indicators
- Test with keyboard navigation

### DON'T:

- Use `grid-auto-flow: dense` (breaks reading order)
- Make more than 20% of cards large (2x2)
- Cluster large cards together
- Use gaps smaller than 12px
- Use gaps larger than 40px
- Create random/unpredictable sizing
- Allow text overflow (no line-clamp)
- Use excessive animation (over 300ms)
- Ignore mobile optimization
- Force all space to be filled
- Use more than 3 card sizes per breakpoint
- Stack hero cards in same column
- Use inconsistent border radius
- Make small cards too cramped (min 16px padding)
- Make large cards too spacious (max 40px padding)
- Overcrowd viewport (more than 12 cards visible)
- Create white space due to poor sizing (vs intentional)
- Use tall cards on mobile
- Ignore importance scoring
- Apply same styling to all cards

---

## 10. Code Examples & Patterns

### 10.1 Complete CSS Grid Setup

```css
/* Professional Bento Grid - 2025 Standards */
.bento-grid {
  display: grid;
  gap: 1rem; /* 16px mobile */

  /* Mobile: Single column */
  grid-template-columns: 1fr;
  grid-auto-rows: minmax(300px, auto);
}

/* Tablet: 2 columns, introduce variety */
@media (min-width: 640px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem; /* 20px */
    grid-auto-rows: minmax(320px, auto);
  }
}

/* Desktop: 3 columns, full bento effect */
@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem; /* 24px */
    grid-auto-rows: minmax(340px, auto);
  }
}

/* Large: 4 columns, maximum density */
@media (min-width: 1536px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.75rem; /* 28px */
  }
}

/* Card size spans */
.card-small {
  grid-column: span 1;
  grid-row: span 1;
}

.card-medium {
  grid-column: span 1;
  grid-row: span 1;
}

.card-large {
  grid-column: span 1;
  grid-row: span 1;
}

@media (min-width: 640px) {
  .card-large {
    grid-column: span 2;
    grid-row: span 2;
  }

  .card-wide {
    grid-column: span 2;
    grid-row: span 1;
  }
}

@media (min-width: 1024px) {
  .card-tall {
    grid-column: span 1;
    grid-row: span 2;
  }
}

/* Performance optimization */
.card {
  will-change: transform;
  contain: layout;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none !important;
    transition: none !important;
  }
}
```

### 10.2 Improved Card Sizing Algorithm

```typescript
type CardSize = "small" | "medium" | "large" | "wide" | "tall";
type ScreenSize = "mobile" | "tablet" | "desktop" | "large";

function getCardSize(
  review: BrowseReviewItem,
  index: number,
  screenSize: ScreenSize
): CardSize {
  // Mobile: Keep it simple, all equal (or minimal variation)
  if (screenSize === "mobile") {
    return "medium";
  }

  // Calculate importance (0-100)
  const importance = calculateImportance(review);

  // Position in pattern (12-card cycle for balance)
  const patternIndex = index % 12;

  // TIER 1: Premium Featured (85-100)
  // These are hero cards, maximum visual impact
  if (importance >= 85) {
    // Alternate between large and wide for variety
    if (screenSize === "desktop" || screenSize === "large") {
      return patternIndex % 2 === 0 ? "large" : "wide";
    }
    // Tablet: Large cards only
    return "large";
  }

  // TIER 2: High Importance (70-84)
  // Featured content, prominent but not dominating
  if (importance >= 70) {
    // Pattern: wide, tall, medium, repeat
    const subPattern = patternIndex % 3;

    if (subPattern === 0) return "wide";

    // Tall cards only on desktop+
    if (subPattern === 1 && (screenSize === "desktop" || screenSize === "large")) {
      return "tall";
    }

    return "medium";
  }

  // TIER 3: Medium Importance (55-69)
  // Elevated standard cards with occasional accent
  if (importance >= 55) {
    // Every 5th card gets wide treatment for rhythm
    if (patternIndex === 5 || patternIndex === 10) {
      return "wide";
    }
    return "medium";
  }

  // TIER 4: Standard (<55)
  // Foundation cards, consistent sizing
  return "medium";
}

function calculateImportance(review: BrowseReviewItem): number {
  let score = 50; // Neutral baseline

  // Business value
  if (review.is_featured) score += 35;      // Strongest signal
  if (review.review_type === "expert") score += 25;

  // Monetary value
  if (review.price > 150) score += 20;
  else if (review.price > 100) score += 15;
  else if (review.price > 75) score += 10;

  // Time sensitivity
  if (review.urgency === "high") score += 20;
  else if (review.urgency === "medium") score += 8;

  // Social proof
  if (review.creator_rating >= 4.5) score += 10;
  else if (review.creator_rating >= 4.0) score += 5;

  return Math.min(score, 100);
}
```

### 10.3 Visual Hierarchy Styling

```typescript
function getCardStyles(importance: number, size: CardSize) {
  const isPremium = importance >= 85;
  const isHigh = importance >= 70;
  const isMedium = importance >= 55;

  return {
    // Background opacity
    bgOpacity: isPremium ? "bg-white/90" :
               isHigh ? "bg-white/82" :
               isMedium ? "bg-white/78" :
               "bg-white/75",

    // Backdrop blur
    blur: isPremium ? "backdrop-blur-xl" :
          isHigh ? "backdrop-blur-lg" :
          "backdrop-blur-md",

    // Border
    border: isPremium ? "border-2 border-transparent" :
            isHigh ? "border-2 border-white/40" :
            "border border-white/20",

    // Shadow
    shadow: isPremium ? "shadow-2xl" :
            isHigh ? "shadow-xl" :
            isMedium ? "shadow-lg" :
            "shadow-md",

    // Hover elevation
    hoverTransform: isPremium ? "hover:-translate-y-2 hover:scale-[1.02]" :
                    isHigh ? "hover:-translate-y-2" :
                    "hover:-translate-y-1",

    // Hover shadow
    hoverShadow: isPremium ? "hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]" :
                 isHigh ? "hover:shadow-2xl" :
                 isMedium ? "hover:shadow-xl" :
                 "hover:shadow-lg",

    // Typography weight
    fontWeight: isPremium ? "font-bold" :
                isHigh ? "font-semibold" :
                "font-semibold",

    // Border radius
    radius: size === "large" ? "rounded-3xl" : "rounded-2xl",

    // Padding
    padding: size === "small" ? "p-3" :
             size === "large" ? "p-6 md:p-8" :
             "p-4 md:p-6",
  };
}
```

### 10.4 Gradient Border for Premium Cards

```css
/* CSS approach */
.card-premium {
  background:
    linear-gradient(white, white) padding-box,
    linear-gradient(135deg, var(--accent-blue), var(--accent-peach)) border-box;
  border: 2px solid transparent;
}

/* OR React inline style approach */
```

```typescript
const premiumStyle = {
  backgroundImage:
    "linear-gradient(white, white), " +
    "linear-gradient(135deg, var(--accent-blue), var(--accent-peach))",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
  border: "2px solid transparent",
};
```

### 10.5 Responsive Image Handling

```typescript
function getImageAspectRatio(size: CardSize): string {
  const ratios = {
    small: "", // No image on small cards
    medium: "aspect-video", // 16:9
    large: "aspect-[4/3]", // 4:3 for more presence
    wide: "aspect-video", // 16:9
    tall: "aspect-[3/4]", // 3:4 vertical
  };

  return ratios[size] || "aspect-video";
}

// Component usage
{review.preview_image_url && size !== "small" && (
  <div className={cn(
    "relative w-full rounded-xl overflow-hidden bg-gray-100",
    getImageAspectRatio(size)
  )}>
    <img
      src={review.preview_image_url}
      alt={review.title}
      loading={index > 4 ? "lazy" : "eager"}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  </div>
)}
```

---

## 11. Testing Strategy

### 11.1 Visual Regression Testing

**Manual Testing Checklist:**
- [ ] Mobile (375px): All cards equal, single column
- [ ] Tablet (768px): 2 columns, large/wide cards appear
- [ ] Desktop (1280px): 3 columns, tall cards appear
- [ ] Large (1920px): 4 columns, full pattern visible
- [ ] Ultra-wide (2560px): Layout doesn't stretch awkwardly

**Automated Testing:**
```typescript
// Playwright/Cypress screenshot comparison
test('bento grid layout matches snapshot', async ({ page }) => {
  await page.goto('/browse');
  await page.waitForSelector('.bento-grid');

  // Desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page).toHaveScreenshot('bento-desktop.png');

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page).toHaveScreenshot('bento-tablet.png');

  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page).toHaveScreenshot('bento-mobile.png');
});
```

### 11.2 Accessibility Testing

**Automated Tools:**
- axe DevTools
- Lighthouse audit
- WAVE browser extension

**Manual Testing:**
```bash
# Keyboard navigation
Tab through all cards
Shift+Tab backwards
Enter to activate links
Space to activate buttons

# Screen reader testing
- VoiceOver (macOS/iOS)
- NVDA (Windows)
- TalkBack (Android)

# Check:
- Reading order matches visual order
- All cards announced correctly
- Role="list" and role="listitem" read properly
- Images have alt text
- Focus indicators visible
```

### 11.3 Performance Testing

**Metrics to Track:**
```typescript
// Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

// Custom metrics
- Time to first card render: < 500ms
- Grid layout paint time: < 100ms
- Hover animation smoothness: 60fps
```

**Lighthouse Audit Goals:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### 11.4 User Testing

**Tasks to Observe:**
1. "Find an expert review for a design project"
2. "Locate the most expensive review"
3. "Find a review with an urgent deadline"
4. "Claim a review you're interested in"

**Questions to Ask:**
- Did the important reviews stand out?
- Was the layout easy to scan?
- Did anything feel cluttered or confusing?
- Were you able to find what you needed quickly?

---

## 12. Recommendations Summary

### 12.1 Critical (Implement Now)

1. **Increase Gap Spacing**
   - Change from `gap-3 sm:gap-4 lg:gap-5` to `gap-4 sm:gap-5 lg:gap-6 xl:gap-7`
   - New values: 16px → 20px → 24px → 28px
   - Impact: More professional spacing, aligns with 2025 standards

2. **Remove Mobile Size Variations**
   - All cards "medium" on mobile (< 640px)
   - Eliminates awkward "wide" cards on single column
   - Simpler, cleaner mobile experience

3. **Adjust Tall Card Breakpoint**
   - Only enable tall cards on desktop+ (1024px+)
   - Currently activating too early on tablet
   - Better proportions on 2-column layouts

4. **Strengthen Visual Hierarchy**
   - Increase opacity differences: 90%, 82%, 78%, 75%
   - Current 5% steps too subtle
   - Make premium cards more obviously special

### 12.2 Important (Next Sprint)

5. **Refine Card Sizing Pattern**
   - Implement 12-card repeating cycle
   - Current pattern can create clusters
   - Better distribution of large cards

6. **Add Content Adaptation Logic**
   - Different typography sizes for each card size
   - Adaptive line clamping (small: 2, large: 4)
   - Scale metadata visibility with card size

7. **Optimize Grid Auto Rows**
   - Increase minimum heights: 300px → 320px → 340px
   - Slightly reduces cards per view for better presence
   - Cards feel less cramped

8. **Implement Loading Skeletons**
   - Match bento grid structure
   - Show varied skeleton sizes
   - Smooth transition to real content

### 12.3 Enhancements (Future)

9. **Advanced Animations**
   - Staggered entrance per card
   - Smooth transitions on filter changes
   - Micro-interactions on hover

10. **Infinite Scroll**
    - Maintain pattern across pages
    - Preserve importance scoring
    - Virtual scrolling for performance

11. **User Preferences**
    - Toggle between bento and list view
    - Adjust density (compact/comfortable/spacious)
    - Save preference to localStorage

12. **A/B Testing Framework**
    - Test different importance thresholds
    - Compare pattern intervals (8, 10, 12 cards)
    - Measure engagement by card size

---

## 13. Industry Trends (2025)

### What's Hot:
- **Glassmorphism 2.0:** More subtle, professional implementations
- **Gradient borders:** Replacing solid borders for premium feel
- **Micro-interactions:** Subtle hover effects and transitions
- **Container queries:** Responsive components, not just layouts
- **Dark mode support:** Bento grids adapting to color schemes
- **3D depth:** Subtle shadows and layering for realism

### What's Cooling:
- **Dense packing:** Moving away from tight, cluttered grids
- **Pure randomness:** Deliberate patterns replacing chaos
- **Neumorphism:** Soft shadows being replaced by glassmorphism
- **Excessive animation:** Simpler, faster transitions preferred

### Emerging:
- **AI-driven layouts:** Dynamic sizing based on user behavior
- **Personalized grids:** Different layouts per user preference
- **Hybrid patterns:** Combining bento with other layout systems
- **Performance-first:** Leaner implementations prioritizing speed

---

## 14. Resources & Further Reading

### Official Documentation:
- **MDN Web Docs - CSS Grid Layout:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **CSS Container Queries:** https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries

### Design Inspiration:
- **Apple Product Pages:** https://www.apple.com
- **BentoGrids.com:** Curated collection of examples
- **Dribbble (Bento Grid tag):** Community designs
- **SaaSFrame Bento Patterns:** 43+ examples with Figma files

### Technical Guides:
- **iamsteve.me - Bento Layout CSS Grid:** Practical implementation
- **FreeCodeCamp - Bento Grids in Web Design:** Comprehensive tutorial
- **Codemotion - Bento Box Layout Modern CSS:** Advanced techniques

### Accessibility:
- **WebAIM:** Accessibility resources and testing tools
- **A11y Project:** Accessibility checklist and patterns
- **ARIA Authoring Practices:** Proper semantic HTML usage

---

## 15. Conclusion

Bento grids, when implemented thoughtfully, create visually stunning and highly functional layouts. The key is balancing asymmetry with predictability, creating hierarchy through importance-based sizing, and maintaining accessibility throughout.

**Your current implementation is strong**, with good foundations in place. The primary areas for improvement are:

1. **Spacing refinement** (increase gaps to modern standards)
2. **Mobile simplification** (remove size variations on smallest screens)
3. **Visual hierarchy strengthening** (more dramatic styling differences)
4. **Pattern optimization** (prevent large card clustering)

By implementing the Critical and Important recommendations, your bento grid will align with 2025 best practices and provide an exceptional marketplace browsing experience.

The marketplace context adds unique requirements around trust signals, pricing visibility, and urgency indicators. Your importance scoring algorithm addresses these well. Continue to iterate based on user behavior data and A/B testing results.

**Remember:** Great bento grids feel effortless to users while being carefully orchestrated behind the scenes. Every card size, every gap, every hover effect should serve the goal of helping users quickly find and claim the most relevant reviews.

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-12
**Author:** Technology Trends Research Analyst
**Target Audience:** Critvue Frontend Development Team
**Review Cycle:** Quarterly (Q1 2025 next review)
