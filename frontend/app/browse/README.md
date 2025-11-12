# Browse Marketplace - Documentation

## Overview

The Browse Marketplace is a modern, innovative public page where reviewers can discover and claim open review requests. It features a **Bento Grid layout** with **glassmorphism aesthetic**, implementing the latest 2024-2025 UX research patterns.

## Features

### 1. Bento Grid Layout (Apple-style)
- **Variable card sizes** based on review importance
  - Large cards: Featured/Expert reviews (2x2 grid span on desktop)
  - Medium cards: Standard reviews (1x1 grid span)
  - Small cards: Quick/Free reviews (compact 1x1 grid span)
- **Asymmetric, intentional layout** for visual interest
- **Responsive** - Single column on mobile, multi-column on desktop

### 2. Glassmorphism Aesthetic
- Consistent with Critvue's design system
- Backdrop blur effects on cards and filter panels
- Subtle borders and shadows for depth
- Premium, modern feel

### 3. Filter System
- **Horizontal scrollable chips** (not dropdowns)
- Multi-select with visual feedback
- Gradient backgrounds when selected
- Categories:
  - Content Type: All | Design | Code | Video | Audio | Writing | Art
  - Review Type: All | Free | Expert
  - Sort: Most Recent | Highest Paid | Lowest Paid | Urgent

### 4. Mobile-First Design
- **Bottom sheet** for filters on mobile (not sidebar)
- Touch-friendly interactions (48px minimum targets)
- Progressive disclosure
- Drag-to-dismiss gesture support

### 5. Rich Card Previews
- Hover elevation and glow effects
- Preview images for design reviews
- Metadata badges (price, deadline, type, urgency)
- Creator rating display
- Featured review highlighting

## File Structure

```
frontend/
├── app/
│   └── browse/
│       ├── page.tsx          # Main browse page with Bento Grid
│       └── README.md         # This file
├── components/
│   └── browse/
│       ├── index.ts                      # Barrel exports
│       ├── review-card.tsx               # Glassmorphic review card
│       ├── filter-chips.tsx              # Filter chip system
│       ├── filter-bottom-sheet.tsx       # Mobile filter panel
│       ├── review-card-skeleton.tsx      # Loading states
│       └── empty-state.tsx               # No results state
├── lib/
│   └── api/
│       └── browse.ts         # Browse API client
└── app/
    └── globals.css           # Extended with glassmorphism tokens
```

## Component API

### ReviewCard

```tsx
<ReviewCard
  review={browseReviewItem}
  size="large" // "small" | "medium" | "large"
  className="custom-class"
/>
```

**Props:**
- `review: BrowseReviewItem` - Review data object
- `size?: "small" | "medium" | "large"` - Card size for Bento Grid
- Standard HTML div attributes

**Features:**
- Glassmorphic background with backdrop blur
- Hover elevation and gradient glow
- Badge system for content type, review type, urgency
- Preview image support (16:9 aspect ratio)
- Metadata display (price, deadline, rating)
- Call-to-action buttons (View Details, Claim)

### FilterChips

```tsx
<FilterChips
  contentType={contentType}
  reviewType={reviewType}
  sortBy={sortBy}
  onContentTypeChange={setContentType}
  onReviewTypeChange={setReviewType}
  onSortByChange={setSortBy}
/>
```

**Props:**
- Filter state values and change handlers
- Three filter categories: content type, review type, sort

**Features:**
- Horizontal scrollable on mobile
- Glassmorphic unselected state
- Gradient background when selected
- Visual checkmark on selection
- Touch-friendly (44px minimum height)

### FilterBottomSheet

```tsx
<FilterBottomSheet
  open={showFilters}
  onOpenChange={setShowFilters}
  contentType={contentType}
  reviewType={reviewType}
  sortBy={sortBy}
  onContentTypeChange={setContentType}
  onReviewTypeChange={setReviewType}
  onSortByChange={setSortBy}
  onReset={handleReset}
  onApply={handleApply}
/>
```

**Props:**
- `open: boolean` - Sheet visibility
- `onOpenChange: (open: boolean) => void` - Toggle handler
- Filter state and handlers
- `onReset: () => void` - Reset all filters
- `onApply: () => void` - Apply filters and close

**Features:**
- Slides up from bottom (85vh height)
- Backdrop blur overlay
- Drag handle with gesture support
- Body scroll lock when open
- Apply/Reset action buttons

### ReviewCardSkeleton

```tsx
<ReviewCardSkeleton size="medium" />
<ReviewCardSkeletonGrid count={8} />
```

**Features:**
- Shimmer animation effect
- Matches card layout for each size
- Grid helper for initial loading
- Glassmorphic aesthetic

### EmptyState

```tsx
<EmptyState onClearFilters={handleClearFilters} />
```

**Features:**
- Friendly illustration with icons
- Clear messaging
- Call-to-action to clear filters
- Helpful tips section

## API Integration

### Browse API Client (`lib/api/browse.ts`)

```typescript
// Fetch browse reviews
const response = await getBrowseReviews({
  content_type: "design",
  review_type: "expert",
  sort_by: "recent",
  search: "UI design",
  limit: 20,
  offset: 0,
});

// Get single review
const review = await getBrowseReview(reviewId);

// Claim a review (requires auth)
const result = await claimReview(reviewId);
```

**Types:**
- `BrowseReviewItem` - Extended review with marketplace metadata
- `BrowseResponse` - Paginated response with items
- `BrowseParams` - Filter and pagination parameters

## Design System Integration

### CSS Variables (Added to `globals.css`)

```css
/* Accents */
--accent-blue: #3B82F6;
--accent-peach: #F97316;
--accent-sage: #4ADE80;

/* Accent RGB for gradients */
--accent-blue-rgb: 59, 130, 246;
--accent-peach-rgb: 249, 115, 22;
--accent-sage-rgb: 74, 222, 128;

/* Glass Effects */
--glass-light: rgba(255, 255, 255, 0.7);
--glass-medium: rgba(255, 255, 255, 0.8);
--glass-heavy: rgba(255, 255, 255, 0.9);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-border-dark: rgba(0, 0, 0, 0.1);

/* Shadows */
--shadow-xs: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
--shadow-md: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.05);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04);
--shadow-2xl: 0 25px 50px rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.08);
```

### Utility Classes

```css
.glass-light { background: var(--glass-light); backdrop-filter: blur(8px); }
.glass-medium { background: var(--glass-medium); backdrop-filter: blur(12px); }
.glass-heavy { background: var(--glass-heavy); backdrop-filter: blur(16px); }
```

## Brand Compliance

### Typography
- **Font**: Inter (system default)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold)
- **Sizes**:
  - Card titles: 18px (medium), 20-24px (large)
  - Body text: 14px
  - Metadata: 12px

### Colors
- **Primary**: Blue (#3B82F6)
- **Secondary**: Peach (#F97316)
- **Accent**: Sage (#4ADE80)
- **Gradients**: Blue to Peach for CTAs

### Spacing
- **8pt grid**: 4px, 8px, 16px, 24px, 32px
- **Card padding**: 16px (mobile), 24px (desktop)
- **Grid gap**: 24px

### Border Radius
- **Cards**: 16px (rounded-2xl)
- **Chips**: 12px (rounded-full)
- **Modals**: 24px (rounded-3xl)
- **Images**: 12px (rounded-xl)

### Animations
- **Duration**: 200-300ms for interactions
- **Easing**: ease-out for most transitions
- **Hover**: translateY(-4px) elevation
- **Active**: scale(0.98) press effect

## Accessibility

### WCAG 2.1 Level AA Compliance
- Color contrast ratios: 4.5:1 for text, 3:1 for large text
- 48px minimum touch targets on mobile
- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels for interactive elements
- Focus visible states on all controls
- Reduced motion support (`prefers-reduced-motion`)

### Keyboard Shortcuts
- `Tab` - Navigate between interactive elements
- `Enter` - Activate buttons/links
- `Escape` - Close bottom sheet (mobile)

### Screen Reader Support
- Semantic HTML elements
- Descriptive ARIA labels
- Status announcements for filter changes
- Loading and error state announcements

## Performance Optimizations

### Bundle Size
- Tree-shakeable component exports
- Lazy loading for images
- CSS-in-JS avoided (using utility classes)

### Rendering
- Skeleton screens for perceived performance
- Staggered card animations
- Efficient grid layout with CSS Grid

### Network
- API request debouncing on search
- Pagination support for large datasets
- Preview image optimization

## Responsive Breakpoints

```css
/* Mobile */
< 640px: Single column, bottom sheet filters

/* Tablet */
640px - 1024px: 2 columns, inline filters

/* Desktop */
1024px - 1536px: 3 columns, sidebar filters

/* Large Desktop */
> 1536px: 4 columns, sidebar filters
```

## Future Enhancements

### Phase 2
- [ ] Infinite scroll pagination
- [ ] Save favorite reviews
- [ ] Share review links
- [ ] Advanced search with keywords
- [ ] Date range filters

### Phase 3
- [ ] Review request notifications
- [ ] Reviewer matching algorithm
- [ ] Real-time availability updates
- [ ] Collaborative filtering

## Testing

### Manual Testing Checklist
- [ ] All filters work correctly
- [ ] Cards display correct information
- [ ] Hover states function properly
- [ ] Mobile bottom sheet opens/closes
- [ ] Drag-to-dismiss gesture works
- [ ] Loading states appear correctly
- [ ] Empty state displays when no results
- [ ] Search functionality works
- [ ] Responsive at all breakpoints
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Reduced motion is respected

### Browser Compatibility
- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

## Support

For questions or issues with the browse marketplace:
1. Check this documentation
2. Review component source code
3. Check API endpoint responses
4. Verify backend data structure matches `BrowseReviewItem` type

## License

Part of the Critvue application. All rights reserved.
