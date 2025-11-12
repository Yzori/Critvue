# Bento Grid Quick Reference Card

## 🎯 At a Glance

**What:** Apple-style dynamic bento grid with intelligent card sizing
**Where:** `/app/browse/page.tsx` + `/components/browse/review-card.tsx`
**Why:** Better space utilization, visual hierarchy, professional aesthetic

## 📐 Responsive Breakpoints

| Screen | Width | Columns | Gap | Row Height |
|--------|-------|---------|-----|------------|
| Mobile | <640px | 1 | 16px | 280px min |
| Tablet | 640-1023px | 2 | 20px | 300px min |
| Desktop | 1024-1535px | 3 | 24px | 320px min |
| Large | ≥1536px | 4 | 28px | 320px min |

## 🎨 Card Sizes & Grid Spans

| Size | Mobile | Tablet | Desktop | Use Case |
|------|--------|--------|---------|----------|
| Small | 1x1 | 1x1 | 1x1 | Low priority, contrast |
| Medium | 1x1 | 1x1 | 1x1 | Standard reviews |
| Large | 1x1 | 2x2 | 2x2 | High importance, featured |
| Wide | 1x1 | 2x1 | 2x1 | Promotions, special |
| Tall | 1x1 | 1x1 | 1x2 | Image-heavy (future) |

## 📊 Importance Scoring

```
Base: 50

+ Expert review: +20
+ Price > $150: +20
+ Price > $75: +10
+ High urgency: +15
+ Medium urgency: +5
+ Featured: +30

Max: 100
```

**Thresholds:**
- 80-100: Large card, gradient border, bold text
- 60-79: Occasional large/wide
- 40-59: Medium cards
- 0-39: Small cards for contrast

## 🎪 Asymmetric Pattern

Pattern repeats every 10 cards:

```
Position 0: Large if importance > 60
Position 2: Small if importance < 60
Position 4: Wide if importance > 50
Position 7: Large if importance > 55
Position 9: Small if importance < 60
Others: Medium
```

## 🎨 Visual Hierarchy

### High Importance (80+)
```css
background: rgba(255, 255, 255, 0.85)
backdrop-blur: 16px
border: 2px gradient (blue → peach)
shadow: shadow-lg
hover: -translate-y-2, shadow-2xl
typography: bold, larger sizes
```

### Standard
```css
background: rgba(255, 255, 255, 0.8)
backdrop-blur: 12px
border: 1px rgba(255, 255, 255, 0.3)
shadow: shadow-md
hover: -translate-y-1, shadow-xl
typography: semibold, standard sizes
```

## 💻 Code Snippets

### Check Screen Size
```typescript
const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop" | "large">("desktop");

useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth;
    if (width < 640) setScreenSize("mobile");
    else if (width < 1024) setScreenSize("tablet");
    else if (width < 1536) setScreenSize("desktop");
    else setScreenSize("large");
  };

  handleResize();
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

### Calculate Importance
```typescript
const calculateImportance = (review: BrowseReviewItem): number => {
  let score = 50;
  if (review.review_type === "expert") score += 20;
  if (review.price > 150) score += 20;
  else if (review.price > 75) score += 10;
  if (review.urgency === "high") score += 15;
  if (review.is_featured) score += 30;
  return Math.min(score, 100);
};
```

### Render Card
```tsx
<ReviewCard
  review={review}
  size={getCardSize(review, index, reviews.length)}
  importance={calculateImportance(review)}
/>
```

## 🎯 Brand Token Usage

```css
/* Colors */
--accent-blue: #3B82F6
--accent-peach: #F97316

/* Glassmorphism */
background: rgba(255, 255, 255, 0.8)
backdrop-filter: blur(12px)

/* Shadows */
shadow-md: 0 4px 6px rgba(0,0,0,0.05)
shadow-lg: 0 10px 15px rgba(0,0,0,0.05)
shadow-xl: 0 20px 25px rgba(0,0,0,0.08)

/* Radius */
rounded-2xl: 16px (standard cards)
rounded-3xl: 24px (large cards)

/* Typography */
text-sm: 14px
text-base: 16px
text-lg: 18px
text-xl: 20px
text-2xl: 24px

font-semibold: 600
font-bold: 700
```

## ✅ Testing Checklist

```bash
# Responsive
□ Mobile 375px: Single column
□ Tablet 768px: 2 columns, some large
□ Desktop 1280px: 3 columns, full pattern
□ Large 1920px: 4 columns, maximum density

# Visual Hierarchy
□ Expert reviews are prominently displayed
□ High-price reviews get large cards
□ Featured reviews have gradient borders
□ Urgent reviews stand out

# Interactions
□ Smooth hover effects all sizes
□ Keyboard navigation works
□ Focus rings visible
□ Reduced motion respected

# Layout
□ No overflow/broken layouts
□ Consistent gaps
□ Images maintain aspect ratio
□ Text doesn't overflow
```

## 🚀 Performance

- **CSS Grid:** Native browser layout engine
- **GPU Acceleration:** `will-change: transform`
- **No JS Layout:** Pure CSS responsive
- **Bundle Size:** +0KB
- **Animation:** Hardware-accelerated transforms

## 📝 Common Tasks

### Add New Size Variant
1. Update `ReviewCardProps` type
2. Add size class to `sizeClasses` object
3. Add CSS to `.bento-grid` utilities
4. Update `getCardSize()` logic

### Adjust Importance Thresholds
Edit `calculateImportance()` in `/app/browse/page.tsx`

### Change Pattern Frequency
Modify `patternIndex = index % 10` (change 10)

### Customize Visual Hierarchy
Edit `isHighImportance` threshold and styling in `/components/browse/review-card.tsx`

## 🐛 Troubleshooting

**Cards not resizing?**
- Check screen size state is updating
- Verify Tailwind breakpoints match CSS
- Ensure `cn()` is combining classes correctly

**Layout breaking?**
- Check grid container has `display: grid`
- Verify card size classes are applied
- Inspect with browser DevTools grid overlay

**Performance issues?**
- Ensure `will-change` is applied
- Check for excessive re-renders
- Verify resize handler is debounced

**Visual hierarchy not clear?**
- Review importance scoring logic
- Check gradient border styling
- Verify shadow/blur values

## 📚 Related Files

```
/app/browse/page.tsx              - Main browse page, sizing logic
/components/browse/review-card.tsx - Card component, visual hierarchy
/app/globals.css                  - Bento grid CSS utilities
/lib/api/browse.ts                - Review data types
BENTO_GRID_REDESIGN.md            - Full documentation
```

## 🎓 Design Philosophy

**Principles:**
1. **Content-first:** Important content gets prominent placement
2. **Asymmetric rhythm:** Deliberate pattern, not random
3. **Progressive enhancement:** Works on all devices
4. **Brand consistency:** Uses Critvue design tokens
5. **Performance:** CSS-first, minimal JavaScript

**Inspiration:**
- Apple.com product grids
- macOS app layouts
- Modern dashboard designs
- Editorial magazine layouts

## 📞 Support

**Questions?** Check:
1. `BENTO_GRID_REDESIGN.md` - Full documentation
2. Code comments in source files
3. Browser DevTools grid overlay
4. Critvue design system docs

---

**Version:** 1.0.0
**Last Updated:** 2025-11-11
**Maintained by:** Frontend Brand Guardian
