# Critvue Browse Page - Bento Grid Redesign

## Overview

The browse page has been redesigned with an intelligent, Apple-style bento grid layout that creates visual interest through asymmetric card sizing, importance-based visual hierarchy, and responsive column layouts.

## Key Improvements

### 1. Intelligent Card Sizing Algorithm

**Location:** `/app/browse/page.tsx` - `getCardSize()` and `calculateImportance()`

Cards are now sized based on:
- **Content importance** (expert reviews, high prices, urgency, featured status)
- **Asymmetric pattern** that repeats every 10 cards for visual rhythm
- **Screen size** (mobile, tablet, desktop, large)

**Importance Scoring:**
```typescript
Base score: 50
+ Expert review: +20
+ Price > $150: +20
+ Price > $75: +10
+ High urgency: +15
+ Medium urgency: +5
+ Featured: +30
Max score: 100
```

**Size Distribution:**
- **Large (2x2):** ~20% - High importance cards (80+ score)
- **Medium (1x1):** ~60% - Standard cards
- **Wide (2x1):** ~10% - Special promotions
- **Small (1x1):** ~10% - Lower importance for contrast
- **Tall (1x2):** Reserved for future image-heavy content

### 2. Responsive Grid System

**Breakpoints:**

| Screen Size | Columns | Gap | Grid Auto Rows |
|------------|---------|-----|----------------|
| Mobile (<640px) | 1 | 16px | 280px min |
| Tablet (640-1023px) | 2 | 20px | 300px min |
| Desktop (1024-1535px) | 3 | 24px | 320px min |
| Large (≥1536px) | 4 | 28px | 320px min |

**CSS Implementation:**
- Location: `/app/globals.css` - `.bento-grid` utilities
- Uses CSS Grid with `grid-template-columns` and `auto-rows`
- Responsive gap sizing for optimal spacing
- Smooth transitions between breakpoints

### 3. Visual Hierarchy Through Design

**High Importance Cards (Score ≥80):**
- Stronger glassmorphism (`bg-white/85` vs `bg-white/80`)
- Gradient border accent (blue to peach)
- Larger shadow (`shadow-lg` vs `shadow-md`)
- More dramatic hover effect (`-translate-y-2` vs `-translate-y-1`)
- Bold typography
- Larger buttons

**Standard Cards:**
- Regular glassmorphism
- Standard hover effects
- Medium typography

**Small Cards:**
- Compact padding (16px vs 20-24px)
- Lighter glassmorphism (`bg-white/75`)
- Condensed content (no description, limited metadata)

### 4. Adaptive Content Layout

Cards intelligently adapt their content based on size:

**Small Cards:**
- Compact padding (16px)
- No preview image
- Title only (2 lines, small font)
- No description
- Minimal metadata
- Small buttons

**Medium Cards:**
- Standard padding (16-24px)
- Preview image (16:9 aspect)
- Title (2 lines, medium font)
- Description (2 lines)
- Full metadata
- Small buttons

**Large Cards:**
- Generous padding (24-32px)
- Larger preview image (4:3 aspect)
- Title (3 lines, 2xl font, bold)
- Description (4 lines, large font)
- Full metadata with more detail
- Standard-sized buttons

**Wide Cards:**
- Horizontal layout optimization
- Standard preview (16:9)
- Title (2 lines, large font)
- Description (2 lines)
- Full metadata

**Tall Cards:**
- Vertical layout optimization
- Standard preview
- Title (2 lines)
- Extended description (3 lines)
- Full metadata

## Implementation Details

### Component Structure

**Browse Page (`/app/browse/page.tsx`):**
```typescript
// Screen size detection
const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop" | "large">("desktop");

// Importance calculation
const calculateImportance = (review: BrowseReviewItem): number => { ... }

// Intelligent sizing
const getCardSize = (review, index, _totalReviews): CardSize => { ... }

// Render with importance
<ReviewCard
  review={review}
  size={cardSize}
  importance={importance}
/>
```

**Review Card (`/components/browse/review-card.tsx`):**
```typescript
interface ReviewCardProps {
  review: BrowseReviewItem;
  size?: "small" | "medium" | "large" | "wide" | "tall";
  importance?: number;
}

// Adaptive styling based on importance
const isHighImportance = importance >= 80;

// Responsive size classes
const sizeClasses = {
  small: "col-span-1 row-span-1",
  medium: "col-span-1 row-span-1",
  large: "col-span-1 row-span-1 sm:col-span-2 sm:row-span-2",
  wide: "col-span-1 row-span-1 sm:col-span-2 sm:row-span-1",
  tall: "col-span-1 row-span-1 lg:col-span-1 lg:row-span-2",
};
```

### CSS Architecture

**Global Styles (`/app/globals.css`):**

```css
/* Bento grid base */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile */
  grid-auto-rows: minmax(280px, auto);
  gap: 1rem;
}

/* Responsive columns */
@media (min-width: 640px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet */
  }
}

@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr); /* Desktop */
  }
}

@media (min-width: 1536px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr); /* Large */
  }
}

/* Card size utilities */
.card-large {
  grid-column: span 2;
  grid-row: span 2;
}

/* Performance optimization */
.review-card {
  will-change: transform;
}
```

## Brand Compliance

### Colors
All colors use Critvue's design tokens:
- **Primary Blue:** `var(--accent-blue)` - #3B82F6
- **Accent Peach:** `var(--accent-peach)` - #F97316
- **Glassmorphism:** `rgba(255, 255, 255, 0.8)` with backdrop-blur

### Typography
- **Font Family:** Inter (system default)
- **Size Scale:**
  - Small cards: 14px (text-sm)
  - Medium cards: 16-18px (text-base/lg)
  - Large cards: 20-24px (text-xl/2xl)
- **Weight:**
  - Standard: 600 (font-semibold)
  - High importance: 700 (font-bold)

### Spacing
- Uses 4px/8px spacing scale
- Padding:
  - Small: 16px (p-4)
  - Medium: 16-24px (p-4 md:p-6)
  - Large: 24-32px (p-6 md:p-8)
- Gap:
  - Mobile: 16px
  - Tablet: 20px
  - Desktop: 24px
  - Large: 28px

### Shadows
- Standard: `shadow-md` (0 4px 6px rgba(0,0,0,0.05))
- Important: `shadow-lg` (0 10px 15px rgba(0,0,0,0.05))
- Hover: `shadow-xl` / `shadow-2xl`

### Border Radius
- Standard cards: `rounded-2xl` (16px)
- Large cards: `rounded-3xl` (24px)
- Elements: `rounded-xl` (12px)

## Accessibility

### Keyboard Navigation
- All cards are keyboard navigable via buttons
- Focus indicators visible on all interactive elements
- Focus ring: `ring-2 ring-accent-blue/50`

### Screen Readers
- Semantic HTML structure maintained
- Cards read in logical order (not visual order)
- All images have alt text
- Badges provide context

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .bento-grid > * {
    animation: none !important;
  }
}
```

### Color Contrast
- Text on white: 4.5:1 minimum (WCAG AA)
- Interactive elements: 3:1 minimum
- High importance cards: Enhanced contrast

## Performance Optimizations

### CSS Performance
```css
.review-card {
  will-change: transform;
  /* GPU acceleration for transforms */
}

.bento-grid > * {
  transition: grid-column 0.3s ease, grid-row 0.3s ease;
  /* Smooth responsive transitions */
}
```

### React Performance
- Screen size state updated via debounced resize handler
- Card sizing memoized per render
- Importance calculated once per card
- Staggered animation delays for smooth entrance

### Bundle Size
- No additional dependencies
- Pure CSS Grid (no JS layout calculations)
- Minimal inline styles (only for gradient borders)

## Testing Checklist

### Responsive Behavior
- [ ] Mobile (375px): Single column, all cards equal
- [ ] Tablet (768px): 2 columns, some large cards
- [ ] Desktop (1280px): 3 columns, varied sizes
- [ ] Large (1920px): 4 columns, full bento effect

### Visual Hierarchy
- [ ] Expert reviews are larger and more prominent
- [ ] High-price reviews ($150+) get large cards
- [ ] Featured reviews have gradient borders
- [ ] Urgent reviews are visually highlighted

### Layout Integrity
- [ ] No card overflow or broken layouts
- [ ] Gaps are consistent across breakpoints
- [ ] Grid doesn't break with varying content lengths
- [ ] Images maintain aspect ratio

### Interactions
- [ ] Hover effects work on all card sizes
- [ ] Focus indicators visible on keyboard navigation
- [ ] Buttons are properly sized per card size
- [ ] Smooth transitions between states

### Filters
- [ ] Grid adapts when filter results change
- [ ] Card sizing works with different result counts
- [ ] Empty state displays correctly
- [ ] Loading skeletons match grid layout

## Future Enhancements

### Potential Improvements
1. **Smart spacers:** Programmatically insert empty cells for breathing room
2. **Tall card variants:** Better support for image-heavy content
3. **Custom patterns:** Allow users to preference card size distribution
4. **Animation variety:** Different entrance animations per card size
5. **Infinite scroll:** Maintain bento pattern with lazy loading

### A/B Testing Opportunities
- Test different importance thresholds
- Compare pattern intervals (10 vs 8 vs 12 cards)
- Measure engagement by card size
- Track claim rates by position and size

## Migration Notes

### Breaking Changes
- Card size prop now accepts 5 values instead of 3
- New `importance` prop required for full functionality
- Grid class changed from `.browse-grid` to `.bento-grid`

### Backward Compatibility
- Old card sizes still work (small, medium, large)
- Default importance is 50 (neutral)
- Graceful degradation on mobile

## Documentation

**Files Modified:**
- `/app/browse/page.tsx` - Browse page with intelligent sizing
- `/components/browse/review-card.tsx` - Card component with hierarchy
- `/app/globals.css` - Bento grid CSS utilities

**Design System Integration:**
- All colors use Critvue design tokens
- Typography follows established scale
- Spacing uses 4px/8px system
- Shadows match design system
- Border radius consistent with brand

**Brand Guidelines:**
- Maintains glassmorphism aesthetic
- Blue/peach gradient accent for premium cards
- Consistent with overall Critvue visual language
- Professional, modern, Apple-inspired
