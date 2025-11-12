# Critvue Homepage - Visual Design Guide
## Quick Reference for Implementation

---

## Color Palette Quick Reference

```css
/* Primary Brand Colors */
--accent-blue: #3B82F6;      /* Primary CTA, links, accents */
--accent-peach: #F97316;      /* Secondary accent, gradients */
--accent-sage: #4ADE80;       /* Success states, progress */

/* Neutrals */
--background: #FFFFFF;
--background-subtle: #F9FAFB;
--foreground: #111827;        /* Primary text */
--foreground-muted: #6B7280;  /* Secondary text */
--border: #E5E7EB;
--border-light: rgba(0,0,0,0.05);

/* Glassmorphism */
--glass-light: rgba(255, 255, 255, 0.7);
--glass-medium: rgba(255, 255, 255, 0.8);
--glass-heavy: rgba(255, 255, 255, 0.9);
```

---

## Typography Scale

```
Hero H1:     56px (desktop) / 36px (mobile)  • font-bold
Section H2:  48px (desktop) / 32px (mobile)  • font-bold
Card H3:     24px (desktop) / 20px (mobile)  • font-semibold
Large Body:  20px                             • font-normal
Body:        16px                             • font-normal
Small:       14px                             • font-normal
XSmall:      12px                             • font-normal

Line Heights:
- Headlines: 1.1 (tight)
- Body: 1.6 (relaxed)
```

---

## Spacing System

```
Section gaps:
  Desktop: 128px (py-32)
  Mobile:  64px (py-16)

Card gaps:
  Desktop: 24px (gap-6)
  Mobile:  16px (gap-4)

Internal padding:
  Large cards:  32px (p-8)
  Medium cards: 24px (p-6)
  Small cards:  16px (p-4)
```

---

## Shadow System

```css
/* Level 1: Subtle - Standard cards at rest */
shadow-card: 0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)

/* Level 2: Medium - Hover state */
shadow-card-hover: 0 8px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)

/* Level 3: Strong - Premium cards */
shadow-card-premium: 0 12px 24px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.06)

/* Level 4: Maximum - Hero elements */
shadow-hero: 0 25px 50px rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.08)
```

---

## Border Radius Scale

```
Badges:       8px  (rounded-lg)
Buttons:      16px (rounded-2xl)
Cards:        24px (rounded-2xl)
Hero Cards:   32px (rounded-3xl)
Pills:        9999px (rounded-full)
```

---

## Component Examples (Copy-Paste Ready)

### Primary CTA Button

```jsx
<Button
  className="bg-gradient-to-r from-accent-blue to-accent-peach
    hover:shadow-xl hover:scale-105
    text-white font-semibold px-8 py-6 text-lg rounded-2xl
    min-h-[56px] transition-all duration-300
    active:scale-[0.98]"
>
  Get Your First Review Free
  <ArrowRight className="ml-2 size-5" />
</Button>
```

### Secondary CTA Button

```jsx
<Button
  variant="outline"
  className="border-2 border-accent-blue/30
    hover:border-accent-blue hover:bg-accent-blue/5
    font-semibold px-8 py-6 text-lg rounded-2xl
    min-h-[56px] transition-all duration-300
    active:scale-[0.98]"
>
  Browse Expert Reviewers
</Button>
```

### Glassmorphic Card

```jsx
<div className="rounded-2xl bg-white/70 backdrop-blur-md
  border border-white/40 shadow-lg
  hover:shadow-xl hover:-translate-y-2
  transition-all duration-300 p-6">
  {/* Card content */}
</div>
```

### Premium Featured Card

```jsx
<div className="rounded-3xl bg-white/90 backdrop-blur-xl
  border-2 border-white/60 shadow-2xl
  hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]
  hover:-translate-y-2 hover:scale-[1.02]
  transition-all duration-300 p-8
  ring-1 ring-accent-peach/20">
  {/* Card content */}
</div>
```

### Section Container

```jsx
<section className="py-24 bg-gradient-to-b from-background
  via-accent-blue/5 to-background">
  <div className="max-w-7xl mx-auto px-6">
    {/* Section content */}
  </div>
</section>
```

### Bento Grid Container

```jsx
<div className="bento-grid-v2 max-w-7xl mx-auto">
  {/* Cards automatically adapt:
      Mobile: 1 column
      Tablet: 2 columns
      Desktop: 3 columns
      XL: 4 columns */}
</div>
```

---

## Animation Timing

```
Fast:    150ms  • Micro-interactions (hover states)
Normal:  300ms  • Standard transitions (scale, shadow)
Slow:    500ms  • Major state changes (layout shifts)

Stagger delays:
  Cards:  50ms per item
  Text:   100ms per line
```

---

## Framer Motion Variants (Copy-Paste)

### Fade In + Slide Up

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  {/* Content */}
</motion.div>
```

### Stagger Children

```jsx
<motion.div
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }}
  initial="hidden"
  animate="visible"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

### Scroll-Triggered

```jsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  {/* Content */}
</motion.div>
```

### Pulse Animation

```jsx
<motion.div
  animate={{
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 0 0 rgba(59, 130, 246, 0.4)",
      "0 0 0 10px rgba(59, 130, 246, 0)",
      "0 0 0 0 rgba(59, 130, 246, 0)"
    ]
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
>
  {/* Pulsing element */}
</motion.div>
```

---

## Responsive Breakpoints

```jsx
/* Mobile First Approach */

// Base (Mobile): < 640px
className="text-4xl px-4 py-12"

// Small (Large Mobile): >= 640px
className="sm:text-5xl sm:px-6 sm:py-16"

// Medium (Tablet): >= 768px
className="md:px-8"

// Large (Desktop): >= 1024px
className="lg:text-6xl lg:px-12 lg:py-24"

// XL (Large Desktop): >= 1280px
className="xl:px-16"

// 2XL (Extra Large): >= 1536px
className="2xl:px-20"
```

---

## Gradient Presets

```css
/* Primary CTA Gradient */
.gradient-cta {
  background: linear-gradient(135deg, #3B82F6 0%, #F97316 100%);
}

/* Subtle Background Gradient */
.gradient-bg-subtle {
  background: linear-gradient(180deg,
    rgba(59, 130, 246, 0.03) 0%,
    rgba(249, 115, 22, 0.02) 50%,
    rgba(59, 130, 246, 0.03) 100%
  );
}

/* Stat Card Gradient */
.gradient-stat-card {
  background: linear-gradient(135deg,
    #3B82F6 0%,
    #5B9DF8 50%,
    #F97316 100%
  );
}

/* Glow Effect */
.gradient-glow {
  background: radial-gradient(
    circle at center,
    rgba(59, 130, 246, 0.15) 0%,
    rgba(249, 115, 22, 0.08) 50%,
    transparent 100%
  );
}

/* Text Gradient */
.gradient-text {
  background: linear-gradient(135deg, #3B82F6, #F97316);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Icon Sizes

```
XSmall:  12px (size-3)
Small:   16px (size-4)
Base:    20px (size-5)
Medium:  24px (size-6)
Large:   32px (size-8)
XLarge:  48px (size-12)
Hero:    64px (size-16)
```

---

## Touch Target Sizes (Mobile)

```
Minimum:   44px × 44px (iOS/Android standard)
Button:    56px min-height
Card:      68px min-height (if clickable)
Icon-only: 48px × 48px minimum
```

---

## Accessibility Checklist

```
✓ Color contrast ratio >= 4.5:1 for normal text
✓ Color contrast ratio >= 3:1 for large text (18px+)
✓ Focus states visible on all interactive elements
✓ Keyboard navigation support (Tab, Enter, Space)
✓ Semantic HTML (h1, h2, section, button, nav)
✓ Alt text on all images
✓ ARIA labels for icon-only buttons
✓ Reduced motion support (@media prefers-reduced-motion)
```

---

## Performance Guidelines

```
✓ Images: Use next/image with lazy loading
✓ Animations: GPU-accelerated only (transform, opacity)
✓ Avoid: width, height, top, left in animations
✓ Use: will-change sparingly (only during animation)
✓ Debounce: Scroll and resize event handlers
✓ Optimize: Bundle size < 200KB initial load
```

---

## Common Patterns

### Card with Hover Lift

```jsx
<div className="transform transition-all duration-300
  hover:-translate-y-2 hover:shadow-xl
  active:scale-[0.98]">
  {/* Card content */}
</div>
```

### Icon with Background Circle

```jsx
<div className="size-12 rounded-xl bg-accent-blue/10
  flex items-center justify-center">
  <Icon className="size-6 text-accent-blue" />
</div>
```

### Badge with Dot and Pulse

```jsx
<div className="inline-flex items-center gap-2 px-3 py-1
  rounded-full bg-green-50 text-green-700 text-sm font-medium">
  <span className="relative flex size-2">
    <span className="animate-ping absolute inline-flex h-full w-full
      rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full size-2
      bg-green-500" />
  </span>
  Active
</div>
```

### Gradient Border Card

```jsx
<div
  className="rounded-2xl p-6 bg-white"
  style={{
    backgroundImage:
      "linear-gradient(white, white), linear-gradient(135deg, var(--accent-blue), var(--accent-peach))",
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    border: "2px solid transparent"
  }}
>
  {/* Card content */}
</div>
```

---

## Z-Index Scale

```
Base:           0
Raised:         10
Dropdown:       1000
Sticky:         1020
Modal Overlay:  1030
Modal:          1040
Tooltip:        1050
Toast:          1060
```

---

## Sample Copy (Ready to Use)

### Headlines
```
Hero:        "Turn feedback into your creative advantage"
How It Works: "Simple process. Powerful results."
Dual View:    "Built for both sides of the creative process"
Social Proof: "Trusted by creators worldwide"
Final CTA:    "Ready to transform your creative process?"
```

### CTAs
```
Primary:      "Get Your First Review Free"
Secondary:    "Browse Expert Reviewers"
Reviewer:     "Apply to Review"
Final:        "Get Started Free"
```

### Trust Signals
```
"No credit card required"
"Free AI reviews"
"5 minute setup"
"2,500+ reviews delivered"
"98% satisfaction"
"24hr avg turnaround"
```

---

## Quick Decision Guide

**When to use which card size:**
- Small: Stats, badges, quick info
- Medium: Standard feature cards
- Large: Hero features, detailed content
- Wide: Testimonials, timelines
- Tall: Vertical content, lists

**When to use which shadow:**
- shadow-card: Default state
- shadow-card-hover: Hover state
- shadow-card-premium: Important/premium content
- shadow-hero: Hero section elements

**When to use which glassmorphism:**
- glass-light: Background elements, subtle cards
- glass-medium: Standard content cards
- glass-heavy: Hero cards, modals

**When to use gradient vs solid:**
- Gradient: Primary CTAs, premium elements, backgrounds
- Solid: Standard buttons, text, borders

---

## Implementation Tips

1. **Start with the design system**: Use existing components (Button, Badge, Card) as base
2. **Mobile first**: Build mobile layout first, then enhance for desktop
3. **Test on real devices**: Emulators don't show true performance
4. **Measure performance**: Use Lighthouse, aim for 90+ scores
5. **A/B test**: Different headlines, CTA placements, layouts
6. **Get feedback early**: User test with 5-10 people before launch
7. **Iterate based on analytics**: Heat maps, scroll depth, conversion funnels

---

**This visual guide complements the full design spec. Use it as a quick reference during implementation.**
