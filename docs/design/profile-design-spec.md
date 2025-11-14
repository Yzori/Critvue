# Critvue Profile Page - Design Specification

**Version:** 1.0
**Date:** 2025-11-12
**Based on:** Modern Profile Page Research Report
**Design System:** Critvue Brand Guidelines

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Layout Architecture](#layout-architecture)
3. [Component Specifications](#component-specifications)
4. [Color Palette](#color-palette)
5. [Typography](#typography)
6. [Spacing System](#spacing-system)
7. [Animation Specifications](#animation-specifications)
8. [Mobile Responsive Breakpoints](#mobile-responsive-breakpoints)
9. [Implementation Checklist](#implementation-checklist)

---

## Design Philosophy

### Core Principles
- **Premium but approachable** - Glassmorphism + gradients without feeling corporate
- **Mobile-first responsive** - Design for 375px, enhance for larger screens
- **Bento grid layout** - Asymmetric cards create visual interest and hierarchy
- **Dual-role clarity** - Clean toggle between Creator and Reviewer perspectives
- **Trust-first** - Verification badges and social proof prominently displayed

### Design Pattern: Bento Grid + Glassmorphism
- Asymmetric card layout inspired by Apple product pages
- Translucent frosted-glass effects with gradient overlays
- Different-sized containers create natural focal points
- Breaks away from standard social media profile templates

---

## Layout Architecture

### Desktop Layout (1200px+)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  HERO SECTION (Glassmorphism Background)                    │
│  ┌─────┐                                                     │
│  │     │  John Doe             ⭐⭐⭐⭐⭐ 4.8  ✓ Verified    │
│  │ IMG │  UX Designer & Code Reviewer                        │
│  │     │  Helping creators level up through thoughtful       │
│  └─────┘  feedback on design and frontend code               │
│                                                               │
│  [ Creator ] [ Reviewer ] [ Both ]                           │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ 12 Reviews │  │ ⭐ 4.8/5   │  │ <24h       │  [Request   │
│  │ Received   │  │ Rating     │  │ Response   │   Review]   │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬───────────────┐
│              │              │              │               │
│  LARGE STAT  │  MED STAT 1  │  MED STAT 2  │  SMALL STAT   │  <- Bento Grid Stats
│  Card        │  Card        │  Card        │  Card         │
│  (Reviews    │  (Rating)    │  (Response)  │  (Member)     │
│   Given)     │              │              │               │
│              │              │              │               │
└──────────────┴──────────────┴──────────────┴───────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TRUST SIGNALS                                                │
│  [Badge] [Badge] [Badge] [Badge] → Horizontal scroll         │
│                                                               │
│  "Trusted by 50+ creators" • "Top 10% response time"         │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────┬────────────────────────────────┐
│  PORTFOLIO SHOWCASE        │  REVIEWS & TESTIMONIALS        │
│  (Bento Grid)              │  (Carousel)                    │
│                            │                                │
│  ┌──────┬──────┐           │  ┌─────────────────────────┐  │
│  │ PRJ1 │ PRJ2 │           │  │ "Great feedback!"        │  │
│  ├──────┴──────┤           │  │ ⭐⭐⭐⭐⭐               │  │
│  │  PROJECT 3  │           │  │ - Sarah Chen            │  │
│  ├──────┬──────┤           │  └─────────────────────────┘  │
│  │ PRJ4 │ PRJ5 │           │                                │
│  └──────┴──────┘           │  [Prev] [Next]                │
└────────────────────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ACTIVITY HEATMAP (Optional)                                  │
│  ■■■□□ ■■■■■ □■■■■ ■□■■■  ...                              │
│  Last 12 months of review activity                           │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌─────────────────────┐
│  HERO (Condensed)   │
│  ┌──────┐           │
│  │ IMG  │ John Doe  │
│  └──────┘ UX Design │
│  ⭐⭐⭐⭐⭐ 4.8       │
│  ✓ Verified         │
│                     │
│  [Creator][Review]  │
│                     │
│  [Request Review]   │ <- Sticky on scroll
└─────────────────────┘

┌──────────┬──────────┐
│ 12 Rev.  │ ⭐ 4.8   │  <- 2-col grid
│ Received │ Rating   │
└──────────┴──────────┘
┌──────────┬──────────┐
│ <24h     │ Member   │
│ Response │ 2024     │
└──────────┴──────────┘

┌─────────────────────┐
│ 🏅 Badges →         │  <- Horizontal scroll
└─────────────────────┘

┌─────────────────────┐
│ ▼ Portfolio         │  <- Accordion
│ ───────────────     │
│ ▼ Reviews           │
│ ───────────────     │
│ ▼ Activity          │
└─────────────────────┘
```

---

## Component Specifications

### 1. Hero Section (Glassmorphism)

**Dimensions:**
- Desktop: Full width, 400-500px height
- Mobile: Full width, 450-550px height (auto-height based on content)

**Background:**
```css
background: linear-gradient(135deg,
  rgba(59, 130, 246, 0.1) 0%,    /* accent-blue */
  rgba(251, 146, 60, 0.1) 100%   /* accent-peach */
);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-bottom: 1px solid rgba(255, 255, 255, 0.2);
```

**Layout:**
- Container: `max-width: 1200px`, `margin: 0 auto`, `padding: 48px 24px`
- Grid: Flexbox row on desktop, column on mobile

**Components:**

#### Avatar
- **Size:**
  - Desktop: 120px × 120px
  - Mobile: 96px × 96px
- **Shape:** Circular (`border-radius: 50%`)
- **Border:** 4px solid white with subtle shadow
  ```css
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  ```
- **Upload state:** Gradient placeholder if no image
  ```css
  background: linear-gradient(135deg, #3B82F6, #FB923C);
  ```
- **Positioning:** Left on desktop, center on mobile

#### Name & Title
- **Name:**
  - Font: Poppins/Inter Bold
  - Size: 32px desktop / 24px mobile
  - Color: #1A1A1A (near-black)
  - Optional gradient text effect:
    ```css
    background: linear-gradient(135deg, #3B82F6, #FB923C);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    ```

- **Title/Tagline:**
  - Font: Poppins/Inter Regular
  - Size: 18px desktop / 16px mobile
  - Color: #6B7280 (gray-600)
  - Max width: 500px
  - Line height: 1.6

#### Star Rating
- **Display:** 5-star visual + decimal number
- **Stars:** Filled amber-400 (#FBBF24)
- **Number:**
  - Size: 20px bold
  - Color: #1A1A1A
  - Format: "4.8" (1 decimal)

#### Verification Badge
- **Icon:** Checkmark in circle
- **Size:** 20px × 20px
- **Color:** Blue (#3B82F6) for verified
- **Position:** Next to rating or name
- **Tooltip:** "Email Verified" / "Identity Verified"

#### Bio/Tagline
- **Font:** Poppins/Inter Regular
- **Size:** 16px
- **Color:** #4B5563 (gray-700)
- **Max width:** 600px
- **Line height:** 1.6
- **Max lines:** 2-3 lines with ellipsis

#### Role Toggle (Segmented Control)
- **Buttons:** 3 options - "Creator" | "Reviewer" | "Both"
- **Container:**
  ```css
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 2px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  ```

- **Button (Inactive):**
  ```css
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  color: #6B7280;
  background: transparent;
  transition: all 300ms ease;
  min-height: 48px; /* Touch target */
  ```

- **Button (Active - Creator):**
  ```css
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  ```

- **Button (Active - Reviewer):**
  ```css
  background: linear-gradient(135deg, #FB923C, #F97316);
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
  ```

- **Animation:** Smooth slide transition using Framer Motion's `layoutId`

#### Quick Stats (3-4 metrics)
- **Layout:** Horizontal row on desktop, 2-column grid on mobile
- **Each stat:**
  - Icon (16px) + Number + Label
  - Spacing: 16px gap between items
  - Color: #4B5563 (gray-700)

#### Primary CTA Button
- **Text:** "Request Review" (for reviewers) / "Hire Reviewer" (for creators viewing)
- **Size:**
  - Desktop: `padding: 16px 32px`
  - Mobile: Full width, `min-height: 56px`
- **Background:**
  ```css
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  ```
- **Hover:**
  ```css
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  ```
- **Mobile:** Sticky to bottom of screen on scroll
  ```css
  position: sticky;
  bottom: 16px;
  z-index: 50;
  ```

---

### 2. Stats Dashboard (Bento Grid)

**Container:**
- Desktop: 4-column grid with varying widths
- Mobile: 2-column grid, equal widths
- Gap: 16px (mobile) / 24px (desktop)
- Margin top: 48px from hero section

**Grid Template (Desktop):**
```css
display: grid;
grid-template-columns: 2fr 1fr 1fr 1fr;
gap: 24px;
```

**Grid Template (Mobile):**
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 16px;
```

**Stat Card (Generic):**
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(10px);
border: 2px solid rgba(0, 0, 0, 0.05);
border-radius: 24px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
transition: all 300ms ease;

&:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(59, 130, 246, 0.2);
}
```

**Large Stat Card (Span 2 columns on desktop):**
- Contains dual-role comparison
- Left side: "As Creator" stats
- Right side: "As Reviewer" stats
- Divider line in center
- Gradient accent based on role

**Card Content Structure:**
```
┌────────────────────┐
│ [Icon 32px]        │
│                    │
│ NUMBER (48px bold) │
│ Label (14px)       │
│                    │
│ +15% this month ↑  │ <- Optional trend
└────────────────────┘
```

**Number Animation:**
- Counter animation on scroll-into-view
- Duration: 800ms
- Easing: ease-out
- Format: Commas for thousands (e.g., "1,234")

**Icon Styling:**
```css
width: 32px;
height: 32px;
padding: 8px;
background: linear-gradient(135deg, #3B82F6, #2563EB);
border-radius: 12px;
color: white;
margin-bottom: 12px;
```

**Stat Types:**

1. **Reviews Count**
   - Icon: MessageSquare
   - Number: Integer with "+" if > 50
   - Label: "Reviews Received" / "Reviews Given"

2. **Rating**
   - Icon: Star (filled)
   - Number: Decimal (1 place) + "/5"
   - Label: "Average Rating"
   - Stars visual below number

3. **Response Time**
   - Icon: Clock
   - Number: "<24h" / "2-3 days"
   - Label: "Response Time"

4. **Member Since**
   - Icon: Calendar
   - Number: Year or "X months"
   - Label: "Member Since"

5. **Earnings** (Reviewers only)
   - Icon: DollarSign
   - Number: "$X,XXX"
   - Label: "Total Earnings"

6. **Completion Rate**
   - Icon: CheckCircle
   - Number: "98%"
   - Label: "Completion Rate"
   - Progress bar visual

---

### 3. Trust Signals Section

**Container:**
- Full width
- Background: Light gradient or solid white
- Padding: 32px 24px
- Margin top: 48px

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  BADGES (Horizontal Scroll on Mobile)                   │
│  [✓ Email] [✓ Identity] [🏆 Expert] [⚡ Fast] [🌟 Top] │
│                                                          │
│  QUICK FACTS                                            │
│  • Trusted by 50+ creators                              │
│  • Top 10% response time                                │
│  • 100% satisfaction guarantee                          │
└─────────────────────────────────────────────────────────┘
```

**Badge Pill:**
```css
display: inline-flex;
align-items: center;
gap: 8px;
padding: 8px 16px;
background: linear-gradient(135deg,
  rgba(59, 130, 246, 0.1),
  rgba(251, 146, 60, 0.1)
);
border: 2px solid rgba(59, 130, 246, 0.2);
border-radius: 999px; /* Full pill */
font-size: 14px;
font-weight: 600;
color: #1A1A1A;
white-space: nowrap;
```

**Badge Types:**
- ✓ Email Verified (blue)
- ✓ Identity Verified (green)
- 🏆 Expert Certified (gold)
- ⚡ Fast Responder (yellow)
- 🌟 Top Reviewer (purple)
- 🎯 Specialty badges (Code, Design, etc.)

**Mobile:** Horizontal scroll container
```css
overflow-x: auto;
display: flex;
gap: 8px;
padding: 16px 0;
scrollbar-width: none; /* Hide scrollbar */
-webkit-overflow-scrolling: touch;
```

**Quick Facts:**
- Bullet list or inline with separators
- Font: 14px regular
- Color: #6B7280
- Icon + text format

---

### 4. Portfolio Showcase (Bento Grid)

**Container:**
- Desktop: Asymmetric bento grid (3-4 columns)
- Mobile: 2-column grid or single column
- Gap: 16px
- Padding: 48px 24px

**Grid Templates:**

Desktop:
```css
display: grid;
grid-template-columns: repeat(4, 1fr);
grid-template-rows: repeat(3, 200px);
gap: 16px;

.item-large {
  grid-column: span 2;
  grid-row: span 2;
}

.item-medium {
  grid-column: span 2;
  grid-row: span 1;
}

.item-small {
  grid-column: span 1;
  grid-row: span 1;
}
```

Mobile:
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 12px;
```

**Project Card:**
```css
position: relative;
border-radius: 16px;
overflow: hidden;
background: #F3F4F6;
cursor: pointer;
transition: all 300ms ease;

&:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

**Card Image:**
```css
width: 100%;
height: 100%;
object-fit: cover;
```

**Card Overlay (Hover):**
```css
position: absolute;
inset: 0;
background: linear-gradient(
  to top,
  rgba(0, 0, 0, 0.8) 0%,
  rgba(0, 0, 0, 0.4) 50%,
  transparent 100%
);
padding: 16px;
display: flex;
flex-direction: column;
justify-content: flex-end;
opacity: 0;
transition: opacity 300ms ease;

&:hover {
  opacity: 1;
}
```

**Card Content (in overlay):**
- **Title:** 16px bold, white
- **Type Badge:** Small pill (Code/Design/Video/etc.)
- **Rating:** Star icon + number
- **Date:** Small text, white/70%

**Filters (Above Grid):**
```
[All] [Code] [Design] [Video] [Writing] [Audio] [Art]
```
- Tab-style buttons
- Active state: Gradient background
- Mobile: Horizontal scroll

**Empty State:**
```
┌────────────────────────────┐
│     [Upload Icon]          │
│                            │
│   Add Your First Project   │
│   Showcase your work here  │
│                            │
│   [Upload Project] Button  │
└────────────────────────────┘
```

---

### 5. Reviews & Testimonials Section

**Container:**
- Background: Light gradient
- Padding: 48px 24px
- Margin top: 48px

**Layout:**
- Desktop: 3-column grid or carousel
- Mobile: Single column or swipeable carousel

**Testimonial Card:**
```css
background: white;
border-radius: 16px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
border: 1px solid rgba(0, 0, 0, 0.05);
transition: all 300ms ease;

&:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

**Card Structure:**
```
┌─────────────────────────────┐
│ ⭐⭐⭐⭐⭐                  │
│                             │
│ "The feedback was incredibly│
│ detailed and actionable..." │
│                             │
│ ┌───┐                       │
│ │IMG│ Sarah Chen            │
│ └───┘ Frontend Developer    │
│       ✓ Verified Buyer      │
│                             │
│ Project: Portfolio Review   │
│ Date: 2 weeks ago          │
└─────────────────────────────┘
```

**Star Display:**
- Size: 16px each
- Color: #FBBF24 (amber-400)
- Filled stars for rating
- Empty stars for remaining

**Quote Text:**
```css
font-size: 15px;
line-height: 1.6;
color: #374151; /* gray-800 */
font-style: italic;
margin: 16px 0;
```

**Author Info:**
```css
display: flex;
align-items: center;
gap: 12px;
margin-top: 16px;
```

**Avatar:**
- Size: 48px × 48px circular
- Gradient background if no image

**Name:**
- 14px semibold
- Color: #1A1A1A

**Role:**
- 13px regular
- Color: #6B7280

**Verified Badge:**
- Small checkmark icon
- Green color
- Tooltip: "Verified Buyer/Reviewer"

**Carousel Controls (if used):**
- Position: Below cards or floating on sides
- Style: Circular buttons with gradient
- Icons: ChevronLeft, ChevronRight
- Size: 44px × 44px (touch-friendly)

---

### 6. Activity Heatmap (Optional)

**Container:**
- Full width
- Background: White or light gray
- Padding: 48px 24px
- Margin top: 48px

**Heatmap Grid:**
```css
display: grid;
grid-template-columns: repeat(53, 1fr); /* 52 weeks + labels */
grid-template-rows: repeat(7, 1fr); /* 7 days */
gap: 4px;
max-width: 800px;
margin: 0 auto;
```

**Cell (Day Square):**
```css
width: 12px;
height: 12px;
border-radius: 2px;
background: #EBEEF0; /* No activity */
transition: all 150ms ease;

&:hover {
  outline: 2px solid #3B82F6;
  transform: scale(1.2);
  z-index: 10;
}
```

**Activity Levels (Color Scale):**
- Level 0 (None): #EBEEF0 (light gray)
- Level 1 (1-2 reviews): #C6E48B (light green)
- Level 2 (3-5 reviews): #7BC96F (medium green)
- Level 3 (6-9 reviews): #239A3B (green)
- Level 4 (10+ reviews): #196127 (dark green)

**Tooltip (on hover):**
```
┌──────────────────────┐
│ 5 reviews            │
│ on Jan 15, 2025      │
└──────────────────────┘
```
- Position: Above cell
- Background: Black/90%
- Text: White, 12px
- Padding: 8px 12px
- Border radius: 8px

**Mobile Adaptation:**
- Show last 3 months instead of 12
- Horizontal scroll
- Larger cells (16px × 16px)

**Legend:**
```
Less [□ □ □ □ ■] More
```
- Position: Below heatmap
- Shows color scale meaning

---

## Color Palette

### Primary Colors (Brand)

```css
/* Accent Blue */
--accent-blue: #3B82F6;
--accent-blue-light: #60A5FA;
--accent-blue-dark: #2563EB;

/* Accent Peach */
--accent-peach: #FB923C;
--accent-peach-light: #FDBA74;
--accent-peach-dark: #F97316;
```

### Gradients

```css
/* Primary Gradient (Hero backgrounds, CTAs) */
--gradient-primary: linear-gradient(135deg, #3B82F6 0%, #FB923C 100%);

/* Blue Gradient (Creator-focused elements) */
--gradient-blue: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);

/* Peach Gradient (Reviewer-focused elements) */
--gradient-peach: linear-gradient(135deg, #FB923C 0%, #F97316 100%);

/* Subtle Background Gradient */
--gradient-bg-subtle: linear-gradient(135deg,
  rgba(59, 130, 246, 0.05) 0%,
  rgba(251, 146, 60, 0.05) 100%
);
```

### Neutral Colors

```css
/* Grays */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;

/* Near-black (for text) */
--text-primary: #1A1A1A;
--text-secondary: #4B5563;
--text-tertiary: #6B7280;

/* White */
--white: #FFFFFF;
```

### Semantic Colors

```css
/* Success (Verified, Positive) */
--success: #10B981;
--success-light: #34D399;
--success-dark: #059669;

/* Warning (Pending, Attention) */
--warning: #F59E0B;
--warning-light: #FBBF24;
--warning-dark: #D97706;

/* Error (Rejected, Negative) */
--error: #EF4444;
--error-light: #F87171;
--error-dark: #DC2626;

/* Info (Neutral information) */
--info: #3B82F6;
--info-light: #60A5FA;
--info-dark: #2563EB;
```

### Glassmorphism Overlays

```css
/* Light glassmorphism */
--glass-light: rgba(255, 255, 255, 0.6);
--glass-border-light: rgba(255, 255, 255, 0.2);

/* Dark glassmorphism */
--glass-dark: rgba(0, 0, 0, 0.4);
--glass-border-dark: rgba(0, 0, 0, 0.1);
```

---

## Typography

### Font Families

**Primary:** Poppins (or Inter as fallback)
```css
font-family: 'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

**Monospace (for code):**
```css
font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
```

### Font Scales

#### Desktop Typography

```css
/* Display */
--text-display: 64px / 700 / 1.1;

/* Headings */
--text-h1: 48px / 700 / 1.2;
--text-h2: 32px / 700 / 1.3;
--text-h3: 24px / 600 / 1.4;
--text-h4: 20px / 600 / 1.4;
--text-h5: 18px / 600 / 1.4;
--text-h6: 16px / 600 / 1.4;

/* Body */
--text-body-lg: 18px / 400 / 1.6;
--text-body: 16px / 400 / 1.6;
--text-body-sm: 14px / 400 / 1.6;

/* Small */
--text-small: 13px / 400 / 1.5;
--text-xs: 12px / 400 / 1.4;

/* Stats/Numbers */
--text-number-lg: 48px / 700 / 1.0;
--text-number: 32px / 700 / 1.0;
--text-number-sm: 24px / 700 / 1.0;
```

#### Mobile Typography

```css
/* Headings (scaled down) */
--text-h1-mobile: 32px / 700 / 1.2;
--text-h2-mobile: 24px / 700 / 1.3;
--text-h3-mobile: 20px / 600 / 1.4;
--text-h4-mobile: 18px / 600 / 1.4;
--text-h5-mobile: 16px / 600 / 1.4;

/* Body (same) */
--text-body-mobile: 16px / 400 / 1.6;
--text-body-sm-mobile: 14px / 400 / 1.6;

/* Stats (slightly smaller) */
--text-number-mobile: 28px / 700 / 1.0;
```

### Font Weights

```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

### Text Colors

```css
/* Primary text */
color: var(--text-primary); /* #1A1A1A */

/* Secondary text */
color: var(--text-secondary); /* #4B5563 */

/* Tertiary text */
color: var(--text-tertiary); /* #6B7280 */

/* White text (on dark backgrounds) */
color: #FFFFFF;

/* Link text */
color: var(--accent-blue);
text-decoration: underline;
```

---

## Spacing System

### Base Unit: 4px

All spacing should be multiples of 4px for consistency.

### Spacing Scale

```css
--space-1: 4px;   /* 0.25rem */
--space-2: 8px;   /* 0.5rem */
--space-3: 12px;  /* 0.75rem */
--space-4: 16px;  /* 1rem */
--space-5: 20px;  /* 1.25rem */
--space-6: 24px;  /* 1.5rem */
--space-8: 32px;  /* 2rem */
--space-10: 40px; /* 2.5rem */
--space-12: 48px; /* 3rem */
--space-16: 64px; /* 4rem */
--space-20: 80px; /* 5rem */
--space-24: 96px; /* 6rem */
```

### Component Spacing

#### Section Spacing
```css
/* Between major sections */
margin-top: 48px; /* Desktop */
margin-top: 32px; /* Mobile */

/* Section padding */
padding: 48px 24px; /* Desktop */
padding: 32px 16px; /* Mobile */
```

#### Card Spacing
```css
/* Card padding */
padding: 24px; /* Desktop */
padding: 16px; /* Mobile */

/* Gap between cards */
gap: 24px; /* Desktop */
gap: 16px; /* Mobile */
```

#### Text Spacing
```css
/* Paragraph spacing */
margin-bottom: 16px;

/* Heading spacing */
margin-bottom: 12px; /* H3-H6 */
margin-bottom: 16px; /* H2 */
margin-bottom: 24px; /* H1 */
```

#### Button Spacing
```css
/* Internal padding */
padding: 12px 24px; /* Small */
padding: 16px 32px; /* Medium */
padding: 20px 40px; /* Large */

/* Gap between buttons */
gap: 12px; /* Horizontal */
gap: 8px;  /* Vertical */
```

---

## Animation Specifications

### Timing Functions

```css
/* Easing curves */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy */
```

### Animation Durations

```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-very-slow: 800ms;
```

### Common Animations

#### Hover Lift
```css
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);

&:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

#### Scale on Hover
```css
transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);

&:hover {
  transform: scale(1.02);
}
```

#### Fade In on Scroll (Framer Motion)
```javascript
{
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" }
}
```

#### Counter Animation (Stats)
```javascript
// Using react-countup or custom
{
  start: 0,
  end: targetNumber,
  duration: 0.8,
  decimals: rating ? 1 : 0,
  useEasing: true,
  easingFn: easeOutQuad
}
```

#### Role Toggle Slide (Framer Motion)
```javascript
// Active button background slides
<motion.div
  layoutId="activeTab"
  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
  className="absolute inset-0 bg-gradient-blue"
/>
```

#### Testimonial Carousel
```javascript
// Auto-rotate every 5 seconds
{
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
  transition: { duration: 0.4 }
}
```

### Reduced Motion

**Always respect user preferences:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```javascript
// React Hook
const prefersReducedMotion = useReducedMotion();

// Conditionally disable animations
transition: {
  duration: prefersReducedMotion ? 0 : 0.5
}
```

---

## Mobile Responsive Breakpoints

### Breakpoint Values

```css
/* Mobile First Approach */
--breakpoint-xs: 375px;  /* Small phones */
--breakpoint-sm: 640px;  /* Large phones */
--breakpoint-md: 768px;  /* Tablets */
--breakpoint-lg: 1024px; /* Small laptops */
--breakpoint-xl: 1280px; /* Desktops */
--breakpoint-2xl: 1536px; /* Large desktops */
```

### Usage Pattern

**Base styles target 375px (mobile), then enhance for larger screens:**

```css
/* Mobile first (base) */
.hero-section {
  padding: 32px 16px;
  flex-direction: column;
}

/* Tablet */
@media (min-width: 768px) {
  .hero-section {
    padding: 48px 24px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .hero-section {
    padding: 64px 32px;
    flex-direction: row;
  }
}
```

### Component Breakpoint Behavior

#### Hero Section
- **< 640px:** Stack vertically, centered
- **640px - 1023px:** Stack vertically, left-aligned
- **≥ 1024px:** Horizontal layout

#### Stats Dashboard
- **< 640px:** 2-column grid, all cards equal
- **640px - 1023px:** 3-column grid
- **≥ 1024px:** 4-column asymmetric bento grid

#### Role Toggle
- **< 640px:** Full width buttons, stack if needed
- **≥ 640px:** Inline segmented control

#### Portfolio Grid
- **< 640px:** Single column or 2-column
- **640px - 1023px:** 2-column
- **≥ 1024px:** 4-column bento grid

#### Testimonials
- **< 640px:** Single column, swipeable carousel
- **640px - 1023px:** 2-column grid
- **≥ 1024px:** 3-column grid or carousel

### Touch Target Sizes

**Minimum sizes for mobile:**
- Buttons: 44×44px (Apple) or 48×48px (Google) ✅
- Links: 44×44px with adequate spacing
- Toggle buttons: 48×48px minimum
- Icons (interactive): 44×44px

**Spacing between targets:**
- Minimum 8px gap between interactive elements
- Preferred 12-16px for better UX

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Set up routing for profile page `/profile/[username]`
- [ ] Create base page component with responsive container
- [ ] Implement color palette as CSS variables
- [ ] Set up typography system
- [ ] Configure Framer Motion
- [ ] Test on 375px, 768px, 1024px viewports

### Phase 2: Hero Section (Week 1-2)
- [ ] Glassmorphism background with gradient
- [ ] Avatar upload/display component
- [ ] Name, title, bio editing
- [ ] Star rating display
- [ ] Verification badge display
- [ ] Role toggle (segmented control)
- [ ] Quick stats row
- [ ] Primary CTA button (sticky on mobile)
- [ ] Mobile responsive layout
- [ ] Animations (fade in, hover states)

### Phase 3: Stats Dashboard (Week 2)
- [ ] Bento grid layout system
- [ ] Stat card component (reusable)
- [ ] Dual-role stat display (Creator/Reviewer)
- [ ] Counter animations
- [ ] Hover effects
- [ ] Responsive grid breakpoints
- [ ] Empty state for new users

### Phase 4: Trust Signals (Week 2)
- [ ] Badge component (pill style)
- [ ] Horizontal scroll container (mobile)
- [ ] Badge types (verification, achievements)
- [ ] Quick facts section
- [ ] Tooltip on badge hover

### Phase 5: Portfolio Showcase (Week 3)
- [ ] Bento grid for projects
- [ ] Project card component
- [ ] Image upload and display
- [ ] Overlay hover state
- [ ] Filter tabs (content types)
- [ ] Empty state with CTA
- [ ] Modal for project detail
- [ ] Mobile 2-column grid

### Phase 6: Reviews & Testimonials (Week 3)
- [ ] Testimonial card component
- [ ] Star rating display
- [ ] Author avatar and info
- [ ] Carousel or grid layout
- [ ] Swipeable on mobile
- [ ] Empty state
- [ ] "Load more" or pagination

### Phase 7: Activity Heatmap (Week 4 - Optional)
- [ ] GitHub-style heatmap grid
- [ ] Activity level color scale
- [ ] Tooltip on cell hover
- [ ] Mobile horizontal scroll
- [ ] Data fetching and display
- [ ] Legend

### Phase 8: Polish & Testing (Week 4)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Screen reader testing
- [ ] Keyboard navigation
- [ ] Performance optimization
  - [ ] Image lazy loading
  - [ ] Code splitting
  - [ ] First Contentful Paint < 1.5s
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (iOS, Android)
- [ ] Reduced motion support
- [ ] Loading states
- [ ] Error states
- [ ] Final design review

---

## Design Assets Needed

### Icons
- MessageSquare, Star, Clock, Calendar, DollarSign, CheckCircle (Lucide React)
- Verification checkmark
- Content type icons (Code, Design, Video, Writing, Audio, Art)

### Images
- Default avatar gradient
- Profile cover image placeholder
- Empty state illustrations
- Badge icons/graphics

### Fonts
- Poppins (Regular 400, Medium 500, Semibold 600, Bold 700, Black 900)
- OR Inter as alternative

---

## Technical Stack Recommendations

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Forms:** React Hook Form
- **Image Upload:** React Dropzone
- **Carousel:** Swiper or Embla Carousel

### Components
- **Glassmorphism:** Custom CSS with backdrop-filter
- **Bento Grid:** CSS Grid with custom templates
- **Stats Counter:** react-countup or custom
- **Heatmap:** react-calendar-heatmap or custom

### Backend (Profile Data)
- User profile API endpoints
- Image upload/storage (S3, Cloudinary)
- Review/testimonial data fetching
- Activity history for heatmap

---

## Next Steps

1. **Create Figma Mockup** (if design team available)
   - Use this spec as reference
   - Design mobile (375px) first
   - Then tablet (768px) and desktop (1024px+)

2. **OR Start Prototyping** (if building directly)
   - Implement hero section first
   - Test glassmorphism + gradients
   - Validate bento grid approach
   - Get feedback early

3. **Backend Planning**
   - Define profile data schema
   - Plan API endpoints
   - Set up image upload infrastructure

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Maintained By:** Critvue Development Team
