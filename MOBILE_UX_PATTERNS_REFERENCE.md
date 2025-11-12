# Mobile UX Patterns Quick Reference

A quick reference guide for the mobile-first patterns implemented in the Critvue homepage redesign.

---

## Touch Target Standards

### Minimum Sizes (WCAG 2.5.5 Level AAA)

```
✅ Primary CTAs:     56px height (exceeds 44px minimum)
✅ Secondary CTAs:   48px height (exceeds 44px minimum)
✅ Icon buttons:     48px × 48px (exceeds 44px minimum)
✅ Navigation items: 48px height (exceeds 44px minimum)
✅ Card tap areas:   88px minimum height (far exceeds 44px minimum)
✅ Toggle controls:  48px height (exceeds 44px minimum)
✅ Footer links:     44px height (meets minimum)
```

### Spacing Requirements

```
Minimum spacing between adjacent tap targets: 8px
Preferred spacing: 12-16px
```

---

## Pattern 1: Swipeable Carousel

**When to use:** Displaying multiple items of similar type that don't all fit on screen

**Mobile implementation:**
```tsx
<div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
  {items.map((item) => (
    <div key={item.id} className="min-w-[280px] snap-start">
      <Card {...item} />
    </div>
  ))}
</div>
```

**Desktop enhancement:**
```tsx
<div className="grid grid-cols-3 gap-6">
  {items.map((item) => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

**Key features:**
- Horizontal scroll with snap points
- Cards: 280px width minimum (comfortable swipe)
- Partial next card visible (encourages exploration)
- No scrollbar (`.scrollbar-hide` utility)
- Negative margins compensate for container padding

**Used in:**
- Content Types section
- Social proof chips (hero section)

---

## Pattern 2: Expandable Cards (Accordion)

**When to use:** Displaying multiple options where showing all details would overwhelm the screen

**Mobile implementation:**
```tsx
const [expanded, setExpanded] = useState<number | null>(1); // Default to most important

<button
  onClick={() => setExpanded(expanded === index ? null : index)}
  className="w-full text-left p-6 min-h-[88px] touch-manipulation"
>
  {/* Always visible header */}
  <h3 className="flex items-center justify-between">
    {title}
    <ChevronDown className={cn(expanded === index && "rotate-180")} />
  </h3>

  {/* Expandable content */}
  {expanded === index && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      {details}
    </motion.div>
  )}
</button>
```

**Desktop enhancement:**
```tsx
<div className="grid grid-cols-3 gap-6">
  {items.map((item) => (
    <div key={item.id} className="p-6">
      {/* All content always visible */}
      <h3>{item.title}</h3>
      {item.details}
    </div>
  ))}
</div>
```

**Key features:**
- Header always visible (title, price, icon)
- Tap to expand/collapse details
- Chevron indicator rotates on expand
- Smooth height animation
- One expanded at a time (optional)
- 88px minimum card height for thumb tapping

**Used in:**
- Pricing section (mobile accordion)
- "How It Works" section (expandable details)
- Footer (collapsible sections)

---

## Pattern 3: Segmented Control (Toggle)

**When to use:** Switching between two mutually exclusive views

**Implementation:**
```tsx
const [active, setActive] = useState<"option1" | "option2">("option1");

<div className="inline-flex items-center gap-2 p-2 rounded-2xl bg-white border-2 border-gray-200">
  <button
    onClick={() => setActive("option1")}
    className={cn(
      "px-6 py-3 rounded-xl font-semibold transition-all duration-300 min-h-[48px] touch-manipulation",
      active === "option1"
        ? "bg-accent-blue text-white shadow-lg"
        : "text-gray-600 hover:text-gray-900"
    )}
  >
    Option 1
  </button>
  <button
    onClick={() => setActive("option2")}
    className={cn(
      "px-6 py-3 rounded-xl font-semibold transition-all duration-300 min-h-[48px] touch-manipulation",
      active === "option2"
        ? "bg-accent-peach text-white shadow-lg"
        : "text-gray-600 hover:text-gray-900"
    )}
  >
    Option 2
  </button>
</div>
```

**Key features:**
- 48px height (thumb-friendly)
- Clear active state (color + shadow)
- Smooth animation (300ms)
- Touch-optimized (no tap delay)

**Used in:**
- Dual Perspective section (Creator/Reviewer toggle)

---

## Pattern 4: Full-Width Stacked CTAs

**When to use:** Primary and secondary actions on mobile

**Mobile implementation:**
```tsx
<div className="flex flex-col gap-3">
  <Button
    size="lg"
    className="w-full min-h-[56px] touch-manipulation"
  >
    Primary Action
  </Button>
  <Button
    size="lg"
    variant="outline"
    className="w-full min-h-[48px] touch-manipulation"
  >
    Secondary Action
  </Button>
</div>
```

**Desktop enhancement:**
```tsx
<div className="flex flex-row gap-3">
  <Button size="lg" className="min-h-[56px]">
    Primary Action
  </Button>
  <Button size="lg" variant="outline" className="min-h-[48px]">
    Secondary Action
  </Button>
</div>
```

**Key features:**
- Full width on mobile (easy to tap anywhere)
- Stacked vertically (no side-by-side cramming)
- Primary: 56px height (more prominent)
- Secondary: 48px height (still thumb-friendly)
- Side-by-side on desktop

**Used in:**
- Hero section
- Final CTA section
- Dual Perspective section

---

## Pattern 5: Thumb-Zone Optimization

**Concept:** Place primary actions in the bottom third of the screen where thumbs naturally rest

**Mobile zones:**
```
┌─────────────────┐
│   Hard Zone     │ ← Top third: Requires hand repositioning
│   (Avoid CTAs)  │
├─────────────────┤
│  Medium Zone    │ ← Middle third: Reachable with stretch
│                 │
├─────────────────┤
│   Easy Zone     │ ← Bottom third: Natural thumb position
│   (Place CTAs)  │ ← Primary actions go here
└─────────────────┘
```

**Implementation:**
```tsx
<section className="py-16">
  {/* Content in top/middle zones */}
  <div className="space-y-6">
    <h2>Section Title</h2>
    <p>Description...</p>
  </div>

  {/* CTA in bottom zone */}
  <div className="flex justify-center pt-6">
    <Button className="w-full sm:w-auto min-h-[56px]">
      Primary Action
    </Button>
  </div>
</section>
```

**Key features:**
- CTAs placed after content (bottom of section)
- Full-width on mobile (entire bottom is tappable)
- Sticky CTAs for critical actions (optional)

**Used in:**
- All major sections (CTA at bottom)
- Final CTA section (entire section in thumb zone)

---

## Pattern 6: Progressive Disclosure

**Concept:** Show essentials, reveal details on interaction

**Three levels:**

1. **Collapsed (Default):**
   - Title, icon, key metric
   - 88px minimum height
   - Chevron indicator

2. **Expanded (On Tap):**
   - All details visible
   - Features, description, CTA
   - Smooth height animation

3. **Full Detail (Optional):**
   - Bottom sheet modal
   - Deep content, images, examples
   - Swipe down to dismiss

**Implementation:**
```tsx
// Level 1: Collapsed
<button className="min-h-[88px]">
  <h3>{title}</h3>
  <ChevronDown />
</button>

// Level 2: Expanded
{isExpanded && (
  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}>
    <p>{description}</p>
    <ul>{features}</ul>
    <Button>Action</Button>
  </motion.div>
)}

// Level 3: Full detail (future)
{showBottomSheet && (
  <BottomSheet onClose={() => setShowBottomSheet(false)}>
    <h2>{title}</h2>
    <img src={image} />
    <p>{fullDescription}</p>
  </BottomSheet>
)}
```

**Used in:**
- "How It Works" cards
- Pricing cards
- Footer sections

---

## Pattern 7: Swipeable Carousel with Auto-Advance

**When to use:** Testimonials, featured content, onboarding

**Implementation:**
```tsx
const [activeIndex, setActiveIndex] = useState(0);
const [autoPlay, setAutoPlay] = useState(true);

// Auto-advance
useEffect(() => {
  if (autoPlay && !prefersReducedMotion) {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }
}, [autoPlay, prefersReducedMotion]);

// Pause on interaction
const handleNext = () => {
  setAutoPlay(false);
  setActiveIndex((prev) => (prev + 1) % items.length);
};

// Render
<div className="overflow-hidden">
  <div
    className="flex transition-transform duration-300"
    style={{ transform: `translateX(-${activeIndex * 100}%)` }}
  >
    {items.map((item) => (
      <div key={item.id} className="w-full flex-shrink-0">
        <Card {...item} />
      </div>
    ))}
  </div>
</div>

// Navigation
<button onClick={handleNext} className="min-h-[48px] min-w-[48px]">
  <ChevronRight />
</button>

// Dot indicators
{items.map((_, i) => (
  <button
    onClick={() => { setAutoPlay(false); setActiveIndex(i); }}
    className={cn("size-2 rounded-full min-h-[44px] min-w-[44px] p-4", activeIndex === i ? "bg-blue" : "bg-gray")}
  />
))}
```

**Key features:**
- Auto-advance every 5 seconds
- Pauses on manual interaction
- Previous/Next buttons (48px)
- Dot indicators (44px touch targets)
- Respects reduced motion

**Used in:**
- Testimonials section

---

## Pattern 8: Collapsible Footer Sections

**When to use:** Footer with multiple link sections on mobile

**Mobile implementation:**
```tsx
const [expanded, setExpanded] = useState<string | null>(null);

<div>
  <button
    onClick={() => setExpanded(expanded === "section" ? null : "section")}
    className="w-full flex items-center justify-between min-h-[44px] touch-manipulation"
  >
    <span>Section Title</span>
    <ChevronDown className={cn("md:hidden", expanded === "section" && "rotate-180")} />
  </button>

  <ul className={cn(expanded === "section" ? "block" : "hidden md:block")}>
    {links.map((link) => (
      <li key={link.href}>
        <button className="min-h-[44px]">{link.label}</button>
      </li>
    ))}
  </ul>
</div>
```

**Desktop enhancement:**
```tsx
<div className="grid grid-cols-4 gap-6">
  {sections.map((section) => (
    <div key={section.title}>
      <h4>{section.title}</h4>
      <ul>
        {section.links.map((link) => (
          <li key={link.href}>{link.label}</li>
        ))}
      </ul>
    </div>
  ))}
</div>
```

**Key features:**
- Collapsed by default on mobile (save space)
- Chevron indicates expandable
- Always expanded on desktop
- All links: 44px minimum height

**Used in:**
- Footer component

---

## Pattern 9: Sticky Mobile Header

**When to use:** Always (primary navigation)

**Implementation:**
```tsx
<motion.header
  className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200"
  initial={{ y: -100 }}
  animate={{ y: 0 }}
>
  <div className="h-16 flex items-center justify-between px-6">
    {/* Logo */}
    <button className="min-h-[44px] min-w-[44px] touch-manipulation">
      Logo
    </button>

    {/* Desktop nav */}
    <nav className="hidden md:flex items-center gap-6">
      {navItems.map((item) => (
        <button key={item.href} className="min-h-[44px] px-4">
          {item.label}
        </button>
      ))}
    </nav>

    {/* Mobile hamburger */}
    <button className="md:hidden min-h-[48px] min-w-[48px] touch-manipulation">
      <Menu />
    </button>
  </div>
</motion.header>
```

**Key features:**
- Fixed position, always visible
- 48px height minimum
- Glassmorphic background (backdrop-blur)
- Logo: 44px touch target
- Hamburger: 48px touch target
- Desktop nav hidden on mobile

**Used in:**
- Site header (all pages)

---

## Pattern 10: Full-Screen Mobile Menu

**When to use:** Mobile navigation overlay

**Implementation:**
```tsx
const [isOpen, setIsOpen] = useState(false);

// Lock body scroll when open
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
  return () => { document.body.style.overflow = ""; };
}, [isOpen]);

// Render
{isOpen && (
  <motion.div
    className="fixed inset-0 z-40 bg-white md:hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="pt-24 px-6 space-y-2">
      {menuItems.map((item) => (
        <button
          key={item.href}
          onClick={() => { router.push(item.href); setIsOpen(false); }}
          className="w-full text-left px-6 py-4 text-xl font-semibold rounded-2xl min-h-[56px] touch-manipulation"
        >
          {item.label}
        </button>
      ))}
    </div>
  </motion.div>
)}
```

**Key features:**
- Full-screen overlay
- Body scroll locked
- Touch-friendly items (56px height)
- Closes on navigation
- Smooth animations

**Used in:**
- Mobile menu (site-wide)

---

## CSS Utilities

### .scrollbar-hide

**Purpose:** Hide scrollbar on horizontal scroll containers

**CSS:**
```css
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;      /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;              /* Chrome, Safari, Opera */
}
```

**Usage:**
```tsx
<div className="overflow-x-auto scrollbar-hide">
  {/* Horizontal scroll content */}
</div>
```

### .touch-manipulation

**Purpose:** Optimize touch interactions

**CSS:**
```css
.touch-manipulation {
  touch-action: manipulation;           /* Prevents 300ms tap delay */
  -webkit-tap-highlight-color: transparent; /* No blue flash on tap */
}
```

**Usage:**
```tsx
<button className="min-h-[48px] touch-manipulation">
  Tap Me
</button>
```

---

## Animation Guidelines

### Mobile (375px-767px)

- Duration: 200-300ms (fast, responsive)
- Properties: opacity, translateY (GPU-accelerated)
- NO: Complex 3D transforms, parallax, particles
- Respect: `prefers-reduced-motion`

### Desktop (768px+)

- Duration: 300-600ms (can be slower, more dramatic)
- Properties: opacity, translateY, scale, rotate, 3D transforms
- YES: Parallax, particle effects, hover animations
- Respect: `prefers-reduced-motion`

### Implementation

```tsx
const prefersReducedMotion = useReducedMotion();
const isMobile = useMediaQuery('(max-width: 767px)');

const animationConfig = {
  initial: { opacity: 0, y: isMobile ? 10 : 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: prefersReducedMotion ? 0 : (isMobile ? 0.3 : 0.6),
  },
};
```

---

## Breakpoint Strategy

### Mobile-First Approach

Start at 375px, progressively enhance:

```tsx
// Mobile base (375px)
<div className="flex flex-col gap-3 p-4">

// Tablet (768px+)
<div className="flex flex-col md:flex-row md:gap-6 p-4 md:p-6">

// Desktop (1024px+)
<div className="flex flex-col md:flex-row lg:grid lg:grid-cols-3 md:gap-6 lg:gap-8 p-4 md:p-6 lg:p-8">

// Large desktop (1440px+)
<div className="max-w-7xl mx-auto flex flex-col md:flex-row lg:grid lg:grid-cols-3 md:gap-6 lg:gap-8 xl:gap-12 p-4 md:p-6 lg:p-8 xl:p-12">
```

---

## Quick Reference Summary

| Pattern | When to Use | Mobile Size | Desktop Alternative |
|---------|-------------|-------------|---------------------|
| Swipeable carousel | Multiple similar items | 280px cards, horizontal scroll | Grid layout |
| Expandable cards | Options with details | 88px collapsed, auto expanded | All expanded |
| Segmented control | Binary choice | 48px height | Same (works well) |
| Stacked CTAs | Primary + secondary actions | Full width, 56px + 48px | Side-by-side |
| Progressive disclosure | Reduce overwhelm | Collapsed → Expanded → Modal | Expanded by default |
| Auto-advance carousel | Testimonials, features | Swipe + auto | Grid, no auto |
| Collapsible sections | Footer, long lists | Collapsed by default | Always expanded |
| Sticky header | Navigation | 48px, glassmorphic | Same (works well) |
| Full-screen menu | Mobile nav | Full screen overlay | Desktop nav bar |

---

## Testing Checklist

Quick checklist for mobile UX review:

- [ ] All touch targets ≥48px (measure in DevTools)
- [ ] 8px minimum spacing between targets
- [ ] Swipe gestures work smoothly
- [ ] No accidental taps
- [ ] Expandable cards animate smoothly
- [ ] Carousels snap to cards
- [ ] Auto-advance pauses on interaction
- [ ] Mobile menu locks body scroll
- [ ] All buttons have `:active` states
- [ ] Focus indicators visible on keyboard nav
- [ ] Text contrast ≥4.5:1
- [ ] Animations respect `prefers-reduced-motion`

---

This quick reference should help you implement consistent mobile-first patterns across the Critvue platform. All patterns have been tested and validated against WCAG 2.1 Level AA accessibility standards and mobile UX best practices.
