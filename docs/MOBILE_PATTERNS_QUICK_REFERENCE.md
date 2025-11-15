# Mobile Patterns Quick Reference Guide

**For:** Frontend Brand Guardian Agent & Developers
**Purpose:** Copy-paste mobile patterns for consistent implementation

---

## 1. Touch Targets

### Minimum Standards
- **Buttons:** 48px × 48px (minimum 44px)
- **Form inputs:** 48px height
- **Icons with actions:** 44px × 44px
- **Spacing between targets:** 8px minimum

### Code Pattern
```tsx
// ✅ CORRECT
<Button className="min-h-[48px] min-w-[48px] px-6">
  Click Me
</Button>

// ❌ INCORRECT
<Button className="h-10 px-3">
  Click Me
</Button>
```

### Icon Buttons
```tsx
<button
  className={cn(
    "size-12 rounded-full", // 48px × 48px
    "flex items-center justify-center",
    "hover:bg-muted transition-colors",
    "active:scale-95 touch-manipulation"
  )}
  aria-label="Descriptive label"
>
  <Icon className="size-5" />
</button>
```

---

## 2. Bottom Sheet Modal

### Full Implementation
```tsx
"use client";

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title
}: BottomSheetProps) {
  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm",
          "transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed left-0 right-0 bottom-0 z-50",
          "h-[85vh] rounded-t-3xl",
          "bg-white/95 backdrop-blur-xl shadow-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-4">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4 border-b">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
}
```

### Usage
```tsx
const [open, setOpen] = useState(false);

<BottomSheet
  open={open}
  onOpenChange={setOpen}
  title="Filter Options"
>
  {/* Sheet content */}
</BottomSheet>
```

---

## 3. Swipeable Cards

### Horizontal Scroll with Indicators
```tsx
"use client";

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SwipeableCards({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const cardWidth = e.currentTarget.scrollWidth / items.length;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(index);
  };

  const scrollToCard = (index: number) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.scrollWidth / items.length;
    scrollRef.current.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative">
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
      >
        <div className="flex gap-4 px-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="snap-center flex-shrink-0 w-[280px]"
            >
              {/* Card content */}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {activeIndex > 0 && (
        <button
          onClick={() => scrollToCard(activeIndex - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white shadow-lg"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      {activeIndex < items.length - 1 && (
        <button
          onClick={() => scrollToCard(activeIndex + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white shadow-lg"
        >
          <ChevronRight className="size-5" />
        </button>
      )}

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeIndex ? "w-6 bg-accent-blue" : "w-1.5 bg-gray-300"
            )}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>

      {/* Swipe hint (first view only) */}
      {activeIndex === 0 && (
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2 animate-pulse">
          Swipe to see more <ChevronRight className="size-3" />
        </p>
      )}
    </div>
  );
}
```

### CSS for Smooth Scrolling
```css
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Snap scrolling */
.snap-x {
  scroll-snap-type: x mandatory;
}

.snap-center {
  scroll-snap-align: center;
}
```

---

## 4. Progressive Disclosure

### Mobile Tabs Pattern
```tsx
"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Section = 'overview' | 'activity' | 'settings';

export function MobileTabs() {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  return (
    <div>
      {/* Tab buttons */}
      <div className="lg:hidden flex gap-1 p-1 bg-muted/50 rounded-xl border">
        {(['overview', 'activity', 'settings'] as Section[]).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
              "transition-all min-h-[48px]",
              activeSection === section
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {/* Content sections */}
      <div className="mt-4">
        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'activity' && <ActivitySection />}
        {activeSection === 'settings' && <SettingsSection />}
      </div>
    </div>
  );
}
```

### Collapsible Accordion
```tsx
"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Accordion({ title, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-4 min-h-[48px]"
      >
        <span className="font-semibold text-left">{title}</span>
        <ChevronDown
          className={cn(
            "size-5 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          expanded ? "max-h-[1000px] pb-4" : "max-h-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}
```

---

## 5. Sticky Action Buttons

### Fixed Bottom Buttons (Mobile)
```tsx
export function FormPage() {
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Page content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ... */}
      </div>

      {/* Sticky buttons - mobile only */}
      <div className="fixed bottom-0 left-0 right-0 lg:relative bg-white border-t lg:border-0 p-4 lg:p-0 shadow-lg lg:shadow-none z-50">
        <div className="max-w-4xl mx-auto grid gap-3 sm:grid-cols-2">
          <button className="min-h-[56px] border-2 rounded-xl">
            Cancel
          </button>
          <button className="min-h-[56px] bg-accent-blue text-white rounded-xl">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Floating Action Button
```tsx
export function FloatingActionButton({ onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 lg:hidden z-50",
        "size-14 rounded-full",
        "bg-gradient-to-r from-accent-blue to-accent-peach",
        "text-white shadow-lg",
        "flex items-center justify-center",
        "hover:scale-110 active:scale-95",
        "transition-transform duration-200"
      )}
      aria-label={label}
    >
      <Icon className="size-6" />
    </button>
  );
}
```

---

## 6. Mobile Form Inputs

### Input with Proper Mobile Height
```tsx
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function MobileInput({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <input
        {...props}
        className={cn(
          // Base styles
          "w-full px-4 rounded-xl border",
          "bg-background text-foreground",
          "placeholder:text-muted-foreground",
          // Focus state
          "focus:outline-none focus:ring-2 focus:ring-accent-blue/50",
          // Mobile optimization
          "h-12 text-base", // 48px height, 16px font (prevents iOS zoom)
          "touch-manipulation", // Improves touch response
          // Error state
          error && "border-red-500 focus:ring-red-500/50",
          className
        )}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

### Textarea with Mobile Optimization
```tsx
export function MobileTextarea({ label, error, className, ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <textarea
        {...props}
        className={cn(
          "w-full px-4 py-3 rounded-xl border",
          "bg-background text-foreground",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-accent-blue/50",
          // Mobile optimization
          "min-h-[120px] text-base resize-none",
          "touch-manipulation",
          error && "border-red-500",
          className
        )}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

---

## 7. Loading States

### Button Loading State
```tsx
import { Loader2 } from 'lucide-react';

export function LoadingButton({ isLoading, children, ...props }) {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={cn(
        "min-h-[48px] px-6 rounded-xl",
        "bg-accent-blue text-white font-medium",
        "flex items-center justify-center gap-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-95 transition-transform"
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

### Skeleton Loading
```tsx
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="flex gap-2">
        <div className="h-8 bg-muted rounded w-20" />
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    </div>
  );
}
```

---

## 8. Mobile Typography Scale

### Responsive Font Sizes
```tsx
// Heading sizes
<h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold">
  Large Heading
</h1>

<h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
  Medium Heading
</h2>

<h3 className="text-lg sm:text-xl lg:text-2xl font-semibold">
  Small Heading
</h3>

// Body text
<p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
  Body text that scales responsively
</p>

// Small text
<span className="text-xs sm:text-sm text-muted-foreground">
  Helper text
</span>
```

### Prevent iOS Zoom
```tsx
// All form inputs should have minimum 16px font
<input className="text-base" /> // 16px, prevents auto-zoom on focus
```

---

## 9. Image Optimization

### Lazy Loading with Placeholder
```tsx
export function OptimizedImage({ src, alt, className }) {
  return (
    <div className={cn("relative overflow-hidden bg-gray-100", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover transition-opacity duration-300"
        onLoad={(e) => e.currentTarget.classList.add('opacity-100')}
        style={{ opacity: 0 }}
      />
    </div>
  );
}
```

### Responsive Images
```tsx
<img
  src="/image.jpg"
  srcSet="/image-300.jpg 300w, /image-600.jpg 600w, /image-1200.jpg 1200w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Description"
  loading="lazy"
/>
```

---

## 10. Animation Best Practices

### Respect Reduced Motion
```tsx
import { useReducedMotion } from 'framer-motion';

export function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3
      }}
    >
      Content
    </motion.div>
  );
}
```

### CSS Media Query
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Haptic Feedback

### Import and Use
```tsx
import { haptics } from '@/lib/haptics';

// Button press
<button onClick={() => {
  haptics.medium();
  handleAction();
}}>
  Action
</button>

// Success action
const handleSubmit = async () => {
  haptics.medium(); // Immediate feedback
  try {
    await submitForm();
    haptics.success(); // Success pattern
  } catch (error) {
    haptics.error(); // Error pattern
  }
};

// Swipe gesture
const handleSwipe = () => {
  haptics.light(); // Light feedback for gestures
};
```

---

## 12. Keyboard Handling

### Detect Keyboard
```tsx
import { useKeyboardHeight, useKeyboardVisible } from '@/hooks/useKeyboardHeight';

export function FormPage() {
  const keyboardHeight = useKeyboardHeight();
  const isKeyboardVisible = useKeyboardVisible();

  return (
    <div
      style={{ paddingBottom: keyboardHeight }}
      className="transition-all duration-200"
    >
      {/* Form content */}

      {isKeyboardVisible && (
        <button className="fixed bottom-4 right-4">
          Done
        </button>
      )}
    </div>
  );
}
```

---

## Common Patterns Checklist

When building a new mobile component, ensure:

- [ ] All touch targets ≥ 48px × 48px
- [ ] Form inputs have `text-base` (16px) to prevent iOS zoom
- [ ] Modals use bottom sheet pattern on mobile
- [ ] Lists support pull-to-refresh
- [ ] Images use lazy loading
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Haptic feedback on key interactions
- [ ] Keyboard doesn't hide content
- [ ] Proper loading states for async actions
- [ ] Sticky/fixed action buttons on mobile
- [ ] Progressive disclosure for complex content
- [ ] Swipe gestures have visual affordances

---

## Testing on Physical Devices

### Quick Test Script
1. Open on iPhone Safari
2. Test touch targets (all should be easy to tap)
3. Fill form (keyboard shouldn't hide inputs)
4. Upload file (camera should be an option)
5. Swipe cards (should be smooth)
6. Pull to refresh (should work)
7. Check animations (should be smooth)
8. Test offline (should gracefully degrade)

---

## Resources

- Mobile UX Review: `/home/user/Critvue/MOBILE_UX_REVIEW.md`
- Action Items: `/home/user/Critvue/MOBILE_UX_ACTION_ITEMS.md`
- Mobile Guide: `/home/user/Critvue/docs/product/mobile_guide.md`
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- Material Design: https://m3.material.io/
