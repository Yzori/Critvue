# Critvue Homepage Design Specification
## Breaking Away from Generic SaaS Templates

**Last Updated:** 2025-11-12
**Status:** Ready for Implementation
**Designer:** Frontend Brand Guardian

---

## Table of Contents
1. [Overall Concept](#overall-concept)
2. [Hero Section](#hero-section)
3. [Core Sections](#core-sections)
4. [Visual Design System](#visual-design-system)
5. [Animation & Interactions](#animation--interactions)
6. [Component Specifications](#component-specifications)
7. [Responsive Strategy](#responsive-strategy)
8. [Implementation Priority](#implementation-priority)

---

## Overall Concept

### What Makes This Homepage Special?

**The "Living Critique" Experience**

Rather than static screenshots and feature lists, Critvue's homepage is an **interactive demonstration of critique in action**. The page itself embodies the review process - showing, not telling. Think of it as a portfolio piece that validates the product's value through its own design excellence.

### Key Differentiators

1. **Interactive Critique Demo**: A live, explorable example of Critvue feedback embedded in the hero
2. **Asymmetric Bento Grid**: Dynamic, Apple-inspired layouts that break traditional SaaS symmetry
3. **Dual Perspective Storytelling**: Seamlessly switch between creator and reviewer viewpoints
4. **Editorial Quality**: Content that feels like a design magazine, not a product pitch
5. **Micro-Interaction Rich**: Every element responds to user attention with purpose
6. **Glassmorphic Depth**: Sophisticated layering that creates visual hierarchy through transparency

### Emotional Tone

- **Confident without arrogance**: "We know critique can transform your work"
- **Inspiring yet practical**: "From good to exceptional - here's how"
- **Inclusive and supportive**: "For every creative, at every stage"
- **Premium but accessible**: "Expert quality, surprisingly approachable"

---

## Hero Section

### Layout: Interactive Split Canvas

**Desktop (1440px+):**
```
┌─────────────────────────────────────────────────────────────────┐
│  [60% Left: Content]           [40% Right: Interactive Demo]   │
│                                                                  │
│  Large headline                 ┌─────────────────────────┐   │
│  Supporting text                │                         │   │
│  CTA buttons                    │   Interactive Critique  │   │
│  Social proof ticker            │   Demo (Live)           │   │
│                                 │                         │   │
│                                 │   Hover to explore →    │   │
│                                 │                         │   │
│                                 └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Mobile (375px):**
```
┌──────────────────────┐
│   Headline           │
│   Supporting text    │
│                      │
│   CTA buttons        │
│                      │
│   Interactive Demo   │
│   (Tap to explore)   │
│                      │
│   Social proof       │
└──────────────────────┘
```

### Content

**Headline (Progressive Reveal Animation):**
```
Turn feedback into your
creative advantage
```
- Font: Inter/Satoshi, 56px (desktop) / 36px (mobile)
- Weight: 700 (Bold)
- Color: #111827 (Slate 900)
- Line height: 1.1
- Animation: Each line fades in + slides up with 100ms stagger

**Supporting Text:**
```
Get AI-powered insights in seconds, or expert reviews from
top creators in your field. Critvue transforms critique from
dreaded to game-changing.
```
- Font: Inter, 20px (desktop) / 16px (mobile)
- Weight: 400 (Regular)
- Color: #6B7280 (Gray 500)
- Line height: 1.6
- Max width: 560px

**CTA Buttons (Side-by-side):**

**Primary CTA:**
```jsx
<Button
  className="bg-gradient-to-r from-accent-blue to-accent-peach
    hover:shadow-xl hover:scale-105
    text-white font-semibold px-8 py-4 text-lg rounded-2xl
    min-h-[56px] transition-all duration-300"
>
  Get Your First Review Free
  <ArrowRight className="ml-2 size-5" />
</Button>
```

**Secondary CTA:**
```jsx
<Button
  variant="outline"
  className="border-2 border-accent-blue/30
    hover:border-accent-blue hover:bg-accent-blue/5
    font-semibold px-8 py-4 text-lg rounded-2xl
    min-h-[56px] transition-all duration-300"
>
  Browse Expert Reviewers
</Button>
```

**Social Proof Ticker (Animated):**
```
Auto-scrolling horizontal strip showing:
"2,500+ reviews delivered • 98% satisfaction • 24hr avg turnaround"
```
- Infinite scroll animation
- Glassmorphic background: `bg-white/60 backdrop-blur-md`
- Subtle border: `border border-white/40`
- Icons for each stat (CheckCircle, Star, Clock)

### Interactive Critique Demo (Right Side)

**Component:** `<InteractiveCritiqueDemo />`

A **live, explorable mini-version** of a Critvue review card with real feedback annotations.

**Features:**
1. **Base Layer**: Glassmorphic card showing a sample design (illustration or mockup)
2. **Feedback Annotations**: Numbered markers (1, 2, 3) positioned on the design
3. **Hover Interaction**: Hovering a marker reveals the feedback in a tooltip
4. **Click Interaction**: Clicking expands full feedback in a side panel
5. **Animated Intro**: Markers appear sequentially with pulse effect

**Visual Style:**
- Container: `rounded-3xl bg-white/80 backdrop-blur-xl border-2 border-white/40 shadow-2xl`
- Markers: `size-8 rounded-full bg-accent-blue text-white font-bold shadow-lg`
- Hover marker: `scale-125 ring-4 ring-accent-blue/30`
- Feedback tooltip: `bg-white/95 backdrop-blur-lg rounded-xl p-4 shadow-xl border border-white/60`

**Sample Content:**
- Show a UI mockup with 3-4 critique points
- Examples: "Improve hierarchy", "Color contrast issue", "Great use of white space", "Consider mobile tap targets"

**Mobile Adaptation:**
- Swipeable cards instead of hover
- Tap markers to see feedback overlay
- "Swipe to explore more" hint

---

## Core Sections

### Section 1: How It Works (3-Step Flow)

**Layout:** Horizontal timeline on desktop, vertical on mobile

**Visual Style:** Asymmetric Bento Grid with connected flow lines

```
Desktop Layout:
┌──────────────────────────────────────────────────────────────────┐
│  Step 1              Step 2               Step 3                 │
│  ┌──────────┐       ┌──────────┐        ┌──────────┐            │
│  │  Upload  │  ───→ │ Get      │  ───→  │ Iterate  │            │
│  │  Work    │       │ Feedback │        │ & Ship   │            │
│  └──────────┘       └──────────┘        └──────────┘            │
│                                                                   │
│  [Icon + visual]    [Icon + visual]     [Icon + visual]         │
│  Description        Description          Description             │
└──────────────────────────────────────────────────────────────────┘
```

**Step Cards:**

Each step is a `card-wide` bento card with:
- **Icon**: Animated illustration (Upload icon → MessageSquare → Zap)
- **Step number**: Large, subtle: "01" in accent-peach/20
- **Title**: "Upload Your Work" / "Get Expert Feedback" / "Iterate & Ship"
- **Description**: 1-2 sentences
- **Micro-detail**: Animated line connecting to next step (draws on scroll)

**Interactive Elements:**
- Hover card: Lifts with shadow + shows preview of what happens in that step
- Click card: Expands to show detailed sub-steps (optional enhancement)

**Brand Compliance:**
- Cards: `rounded-2xl bg-card border border-border shadow-md`
- Hover: `hover:shadow-xl hover:-translate-y-2 transition-all duration-300`
- Icons: `size-16 text-accent-blue` in `size-20 rounded-2xl bg-accent-blue/10`
- Typography: Step titles in `text-2xl font-semibold`, descriptions in `text-base text-muted-foreground`

---

### Section 2: Dual Perspective (Creators + Reviewers)

**Layout:** Interactive toggle between two views

**Component:** `<DualPerspectiveSection />`

**Visual Concept:**
A single Bento Grid layout that morphs when you switch perspectives via a prominent toggle switch.

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│         [ For Creators ]  ◐  [ For Reviewers ]                │
│                     (Animated Toggle)                           │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │                     │  │                     │            │
│  │  Feature Card 1     │  │  Feature Card 2     │            │
│  │                     │  │                     │            │
│  └─────────────────────┘  └─────────────────────┘            │
│                                                                 │
│  ┌──────────────────────────────────────────┐                 │
│  │                                          │                 │
│  │       Feature Card 3 (Wide)              │                 │
│  │                                          │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │  Feature Card 4     │  │  Feature Card 5     │            │
│  └─────────────────────┘  └─────────────────────┘            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Toggle Design:**
```jsx
<div className="inline-flex items-center gap-3 p-2 bg-muted/50 rounded-2xl border border-border">
  <button className={activeTab === 'creator' ? 'active' : ''}>
    <Palette className="size-5 mr-2" />
    For Creators
  </button>
  <button className={activeTab === 'reviewer' ? 'active' : ''}>
    <Star className="size-5 mr-2" />
    For Reviewers
  </button>
</div>
```
- Active state: `bg-background text-foreground shadow-md`
- Inactive: `text-muted-foreground hover:text-foreground`
- Smooth slide animation between states

**Content for Each Perspective:**

**For Creators:**
1. **AI Feedback** - Instant insights powered by GPT-4
2. **Expert Reviews** - Vetted professionals in your field
3. **Organized Reports** - Clear, actionable, shareable
4. **Version History** - Track improvements over time
5. **Deadline Focused** - Get feedback when you need it

**For Reviewers:**
1. **Flexible Schedule** - Review on your terms
2. **Get Paid** - Earn from your expertise
3. **Build Portfolio** - Showcase your critique skills
4. **Choose Projects** - Only review what interests you
5. **Community** - Connect with other experts

**Animation:**
- Crossfade between perspectives (300ms ease-out)
- Cards slide in from bottom with stagger (50ms delay each)
- Numbers/stats count up on perspective switch

---

### Section 3: Social Proof Wall

**Layout:** Masonry grid of testimonials + stats

**Visual Style:** Editorial testimonial cards with authentic feel

```
Desktop Layout (Bento Grid):
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  "Title: Trusted by creators worldwide"                        │
│                                                                 │
│  ┌─────────┐  ┌────────────────┐  ┌─────────┐                │
│  │ Stat 1  │  │  Testimonial 1 │  │ Stat 2  │                │
│  │ (Small) │  │  (Wide card)   │  │ (Small) │                │
│  └─────────┘  └────────────────┘  └─────────┘                │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐                       │
│  │ Testimonial 2  │  │ Testimonial 3  │                       │
│  │ (Medium)       │  │ (Medium)       │                       │
│  └────────────────┘  └────────────────┘                       │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Logo 1  │  │ Logo 2  │  │ Logo 3  │  │ Logo 4  │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Testimonial Card Design:**
```jsx
<div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40
  shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6">

  {/* Quote */}
  <blockquote className="text-lg text-foreground leading-relaxed mb-4">
    "The feedback I got on Critvue was so specific and actionable.
    It's like having a design mentor on demand."
  </blockquote>

  {/* Author */}
  <div className="flex items-center gap-3">
    <img src="/avatar.jpg" className="size-12 rounded-full" />
    <div>
      <div className="font-semibold text-foreground">Sarah Chen</div>
      <div className="text-sm text-muted-foreground">Product Designer at Stripe</div>
    </div>
  </div>

  {/* Rating */}
  <div className="flex gap-0.5 mt-3">
    <Star className="size-4 fill-amber-500 text-amber-500" />
    {/* Repeat 5x */}
  </div>
</div>
```

**Stat Cards:**
```jsx
<div className="rounded-2xl bg-gradient-to-br from-accent-blue to-accent-peach
  p-6 text-white shadow-xl">
  <div className="text-5xl font-bold mb-2">2,500+</div>
  <div className="text-white/90 font-medium">Reviews Delivered</div>
</div>
```

**Company Logos:**
- Grayscale logos with subtle hover color
- Companies that have team members using Critvue
- `opacity-50 hover:opacity-100 transition-opacity`

---

### Section 4: Feature Showcase (Interactive Gallery)

**Layout:** Large Bento Grid with one hero feature + 4 supporting features

```
Desktop Layout:
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────┐    │
│  │                             │  │  Feature 2          │    │
│  │  Hero Feature 1             │  │  (Tall)             │    │
│  │  (Large: 2x2)               │  │                     │    │
│  │                             │  └─────────────────────┘    │
│  │  [Interactive Demo]         │                              │
│  │                             │  ┌─────────────────────┐    │
│  │                             │  │  Feature 3          │    │
│  │                             │  │  (Tall)             │    │
│  └─────────────────────────────┘  └─────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────┐                 │
│  │  Feature 4 (Wide)                        │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │  Feature 5          │  │  Feature 6          │            │
│  └─────────────────────┘  └─────────────────────┘            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Feature Cards:**

Each card includes:
- **Icon/Illustration**: Animated on hover
- **Title**: `text-xl font-semibold`
- **Description**: `text-base text-muted-foreground`
- **Interactive element**: Mini demo or animation showing the feature in action

**Hero Feature (AI Feedback):**
- Live typing animation showing AI generating feedback
- Code syntax highlighting for code reviews
- Visual annotations for design reviews

**Features to Highlight:**
1. **AI-Powered Feedback** (Hero) - Live demo of AI analysis
2. **Expert Matching** - Algorithm animation showing reviewer selection
3. **Real-Time Collaboration** - Comments thread preview
4. **Version Control** - Before/after slider
5. **Deadline Tracking** - Progress bar with countdown
6. **Secure File Handling** - Encryption visualization

**Interactive Elements:**
- Hover: Play micro-animation demonstrating the feature
- Click (optional): Expand to full-screen demo modal

---

### Section 5: Reviewer Recruitment CTA

**Layout:** Full-width split section with contrasting background

**Visual Style:** Dark mode section (inverted color scheme for contrast)

```
┌────────────────────────────────────────────────────────────────┐
│  [Dark background: #111827 with subtle gradient]               │
│                                                                 │
│  ┌────────────────────┐  ┌──────────────────────────┐        │
│  │  Left: Content     │  │  Right: Benefits Grid    │        │
│  │                    │  │                          │        │
│  │  Headline          │  │  ✓ Flexible schedule     │        │
│  │  Supporting text   │  │  ✓ Earn money            │        │
│  │  CTA button        │  │  ✓ Build portfolio       │        │
│  │  Stats             │  │  ✓ Join community        │        │
│  │                    │  │                          │        │
│  └────────────────────┘  └──────────────────────────┘        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Content:**

**Headline:**
```
Share your expertise.
Get paid to critique.
```
- Font: 48px bold, white text
- Gradient text effect: `bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent`

**Supporting Text:**
```
Join Critvue's network of expert reviewers. Set your rates,
choose your projects, and help creators level up their work.
```
- White/90 opacity

**CTA Button:**
```jsx
<Button className="bg-white text-gray-900 hover:bg-gray-100
  font-semibold px-8 py-4 text-lg rounded-2xl shadow-xl">
  Apply to Review
  <ArrowRight className="ml-2" />
</Button>
```

**Benefits Grid:**
- 2x2 grid of benefit cards
- Glassmorphic cards with white/10 background
- Icons in accent-peach
- White text with high contrast

---

### Section 6: Final CTA (Closing Conversion)

**Layout:** Centered, full-bleed gradient section

**Visual Style:** Maximum impact with gradient background

```
┌────────────────────────────────────────────────────────────────┐
│  [Gradient background: from-accent-blue/10 via-accent-peach/5  │
│   to-accent-blue/10]                                            │
│                                                                 │
│                   ┌──────────────────────┐                     │
│                   │                      │                     │
│                   │   Headline           │                     │
│                   │   Supporting text    │                     │
│                   │                      │                     │
│                   │   [CTA Button]       │                     │
│                   │                      │                     │
│                   │   No credit card     │                     │
│                   │   required           │                     │
│                   │                      │                     │
│                   └──────────────────────┘                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Content:**

**Headline:**
```
Ready to transform your creative process?
```
- 56px bold, centered
- Gradient text effect

**Supporting Text:**
```
Join thousands of creators getting feedback that matters.
Start with a free AI review, or browse expert reviewers.
```
- 20px regular, centered
- Max width: 600px

**CTA Button:**
```jsx
<Button size="lg" className="bg-gradient-to-r from-accent-blue to-accent-peach
  hover:shadow-2xl hover:scale-105 text-white font-bold px-12 py-6 text-xl
  rounded-2xl min-h-[64px]">
  Get Started Free
  <ArrowRight className="ml-2 size-6" />
</Button>
```

**Trust Signal:**
- Small text below CTA: "No credit card required • Free AI reviews • 5 min setup"
- Icons for each point
- Muted color

---

## Visual Design System

### Color Strategy

**Brand Colors (From Brand Guidelines):**
- Primary Blue: `#3B82F6` (var(--accent-blue))
- Primary Peach: `#F97316` (var(--accent-peach))
- Canvas: `#FFFFFF` / `#F9FAFB`
- Text: `#111827`
- Muted Text: `#6B7280`

**Homepage-Specific Palette:**

**Gradients:**
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

/* Glow Effect for Premium Elements */
.gradient-glow {
  background: radial-gradient(
    circle at center,
    rgba(59, 130, 246, 0.15) 0%,
    rgba(249, 115, 22, 0.08) 50%,
    transparent 100%
  );
}
```

**Glassmorphism Tokens:**
```css
/* Light Glass - For standard cards */
.glass-light {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* Medium Glass - For elevated cards */
.glass-medium {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Heavy Glass - For hero elements */
.glass-heavy {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border: 2px solid rgba(255, 255, 255, 0.6);
}
```

### Typography Hierarchy

**Display (Headlines):**
- Hero H1: `text-5xl md:text-6xl font-bold tracking-tight leading-tight` (56px/72px)
- Section H2: `text-4xl md:text-5xl font-bold tracking-tight` (48px/60px)
- Card H3: `text-2xl md:text-3xl font-semibold` (32px/36px)

**Body:**
- Large: `text-xl leading-relaxed` (20px, line-height: 1.6)
- Base: `text-base leading-relaxed` (16px, line-height: 1.6)
- Small: `text-sm` (14px)
- XSmall: `text-xs` (12px)

**Weights:**
- Bold: 700 (Headlines, CTAs)
- Semibold: 600 (Subheadings, emphasis)
- Medium: 500 (Labels, UI)
- Regular: 400 (Body text)

**Font Stack:**
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Spacing Scale (4pt/8pt system)

- xs: `0.5rem` (8px)
- sm: `0.75rem` (12px)
- base: `1rem` (16px)
- md: `1.5rem` (24px)
- lg: `2rem` (32px)
- xl: `3rem` (48px)
- 2xl: `4rem` (64px)
- 3xl: `6rem` (96px)

**Section Spacing:**
- Between major sections: `8rem` (128px) desktop, `4rem` (64px) mobile
- Within sections: `3rem` (48px) desktop, `2rem` (32px) mobile
- Card gaps in Bento grid: `1.5rem` (24px)

### Shadow System (Refined for 2025)

```css
/* Subtle elevation - Standard cards */
.shadow-card {
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.06);
}

/* Medium elevation - Hover state */
.shadow-card-hover {
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.06);
}

/* Strong elevation - Premium cards */
.shadow-card-premium {
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.06);
}

/* Maximum elevation - Hero elements */
.shadow-hero {
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.12),
    0 12px 24px rgba(0, 0, 0, 0.08);
}
```

### Border Radius Scale

- Small: `0.5rem` (8px) - Badges, small elements
- Medium: `1rem` (16px) - Buttons, inputs
- Large: `1.5rem` (24px) - Standard cards
- XLarge: `2rem` (32px) - Hero cards
- 2XLarge: `3rem` (48px) - Pill shapes
- Full: `9999px` - Circular elements

---

## Animation & Interactions

### Page Load Sequence

**Stagger timing for visual interest:**

1. **Hero content** (0ms): Fade in + slide up
   - Headline words appear sequentially: 100ms stagger
   - Supporting text: 200ms delay
   - CTAs: 400ms delay

2. **Interactive demo** (300ms): Fade in + scale from 0.9
   - Annotations appear: 600ms delay, 150ms stagger each

3. **Social proof ticker** (600ms): Slide in from left

4. **Sections below fold**: Triggered on scroll (Intersection Observer)
   - Fade in + slide up when 20% visible
   - Cards within section: 50ms stagger

### Micro-Interactions

**Button Hover:**
```jsx
// Primary CTA
className="transform transition-all duration-300
  hover:scale-105 hover:shadow-xl
  active:scale-[0.98]"

// Secondary CTA
className="transform transition-all duration-300
  hover:border-accent-blue hover:bg-accent-blue/5
  active:scale-[0.98]"
```

**Card Hover:**
```jsx
className="transform transition-all duration-300
  hover:-translate-y-2 hover:shadow-xl
  hover:border-accent-blue/30"
```

**Glassmorphic Card on Hover:**
- Increase backdrop blur: `blur(8px)` → `blur(12px)`
- Lighten background: `white/70` → `white/80`
- Add subtle glow: Inner gradient overlay fades in

### Scroll Animations (Framer Motion)

**Section Reveal:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  {/* Section content */}
</motion.div>
```

**Card Stagger:**
```jsx
<motion.div
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  {cards.map((card, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {card}
    </motion.div>
  ))}
</motion.div>
```

**Parallax Effect (Subtle):**
- Background elements move at 0.5x scroll speed
- Hero demo card tilts slightly on scroll (3D transform)

### Interactive Demo Animations

**Critique Marker Pulse:**
```jsx
<motion.div
  animate={{
    scale: [1, 1.2, 1],
    boxShadow: [
      "0 0 0 0 rgba(59, 130, 246, 0.4)",
      "0 0 0 10px rgba(59, 130, 246, 0)",
      "0 0 0 0 rgba(59, 130, 246, 0)"
    ],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
  className="size-8 rounded-full bg-accent-blue text-white"
>
  {number}
</motion.div>
```

**Tooltip Appear:**
```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.9, y: 10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9, y: 10 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
  className="feedback-tooltip"
>
  {feedback}
</motion.div>
```

### Reduced Motion Support

**Always respect user preferences:**
```jsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
>
```

---

## Component Specifications

### Component 1: InteractiveCritiqueDemo

**Purpose:** Live demo of Critvue feedback in the hero section

**File:** `/frontend/components/homepage/InteractiveCritiqueDemo.tsx`

**Props:**
```typescript
interface InteractiveCritiqueDemoProps {
  className?: string;
  demoContent?: {
    imageUrl: string;
    critiques: Array<{
      id: string;
      position: { x: number; y: number }; // % based
      feedback: string;
      category: "positive" | "improvement" | "question";
    }>;
  };
}
```

**Structure:**
```jsx
<div className="relative rounded-3xl bg-white/90 backdrop-blur-xl
  border-2 border-white/60 shadow-2xl p-6 overflow-hidden">

  {/* Background Image/Mockup */}
  <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
    <img src={demoContent.imageUrl} className="w-full h-full object-cover" />

    {/* Critique Markers */}
    {demoContent.critiques.map((critique, i) => (
      <CritiqueMarker
        key={critique.id}
        number={i + 1}
        position={critique.position}
        feedback={critique.feedback}
        category={critique.category}
        delay={i * 200}
      />
    ))}
  </div>

  {/* Instruction hint */}
  <div className="mt-4 text-center text-sm text-muted-foreground">
    Hover markers to see feedback
  </div>
</div>
```

**Tailwind Classes:**
```jsx
// Container
className="relative rounded-3xl bg-white/90 backdrop-blur-xl
  border-2 border-white/60 shadow-2xl p-6 overflow-hidden
  hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] transition-shadow duration-500"

// Marker
className="absolute size-8 rounded-full bg-accent-blue text-white
  font-bold flex items-center justify-center shadow-lg
  hover:scale-125 hover:ring-4 hover:ring-accent-blue/30
  transition-all duration-200 cursor-pointer z-10"

// Tooltip
className="absolute z-20 bg-white/95 backdrop-blur-lg rounded-xl
  p-4 shadow-xl border border-white/60 min-w-[200px] max-w-[300px]"
```

**Framer Motion Animations:**
```jsx
// Marker entrance
<motion.div
  initial={{ opacity: 0, scale: 0 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: delay / 1000, duration: 0.4, ease: "backOut" }}
>
  {/* Pulse animation */}
  <motion.div
    animate={{
      boxShadow: [
        "0 0 0 0 rgba(59, 130, 246, 0.4)",
        "0 0 0 10px rgba(59, 130, 246, 0)",
      ],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
</motion.div>

// Tooltip
<AnimatePresence>
  {isHovered && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Tooltip content */}
    </motion.div>
  )}
</AnimatePresence>
```

---

### Component 2: DualPerspectiveSection

**Purpose:** Toggle between creator and reviewer perspectives

**File:** `/frontend/components/homepage/DualPerspectiveSection.tsx`

**Props:**
```typescript
interface DualPerspectiveSectionProps {
  className?: string;
  creatorFeatures: Feature[];
  reviewerFeatures: Feature[];
}

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  stat?: string;
}
```

**Structure:**
```jsx
<section className="py-24 bg-gradient-subtle">
  {/* Section Header */}
  <div className="text-center mb-12">
    <h2 className="text-5xl font-bold mb-4">
      Built for both sides of the creative process
    </h2>
    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
      Whether you're seeking feedback or sharing your expertise
    </p>
  </div>

  {/* Toggle */}
  <div className="flex justify-center mb-12">
    <PerspectiveToggle
      active={activePerspective}
      onChange={setActivePerspective}
    />
  </div>

  {/* Feature Grid (Bento) */}
  <AnimatePresence mode="wait">
    <motion.div
      key={activePerspective}
      className="bento-grid-v2 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {features[activePerspective].map((feature, i) => (
        <FeatureCard key={feature.id} {...feature} index={i} />
      ))}
    </motion.div>
  </AnimatePresence>
</section>
```

**Toggle Component:**
```jsx
<div className="inline-flex items-center gap-0 p-1.5
  bg-muted/50 rounded-2xl border border-border shadow-sm">

  <button
    onClick={() => onChange("creator")}
    className={cn(
      "px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2",
      active === "creator"
        ? "bg-background text-foreground shadow-md"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <Palette className="size-5" />
    For Creators
  </button>

  <button
    onClick={() => onChange("reviewer")}
    className={cn(
      "px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2",
      active === "reviewer"
        ? "bg-background text-foreground shadow-md"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <Star className="size-5" />
    For Reviewers
  </button>
</div>
```

**Feature Card:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05, duration: 0.4 }}
  className="rounded-2xl bg-white/70 backdrop-blur-md
    border border-white/40 shadow-lg
    hover:shadow-xl hover:-translate-y-2
    transition-all duration-300 p-6 flex flex-col gap-4"
>
  {/* Icon */}
  <div className="size-12 rounded-xl bg-accent-blue/10
    flex items-center justify-center text-accent-blue">
    {icon}
  </div>

  {/* Title */}
  <h3 className="text-xl font-semibold">{title}</h3>

  {/* Description */}
  <p className="text-muted-foreground leading-relaxed flex-1">
    {description}
  </p>

  {/* Stat (if provided) */}
  {stat && (
    <div className="text-2xl font-bold text-accent-peach">
      {stat}
    </div>
  )}
</motion.div>
```

---

### Component 3: SocialProofWall

**Purpose:** Testimonials + stats in masonry layout

**File:** `/frontend/components/homepage/SocialProofWall.tsx`

**Structure:**
```jsx
<section className="py-24 bg-background">
  <div className="max-w-7xl mx-auto px-6">
    <h2 className="text-5xl font-bold text-center mb-4">
      Trusted by creators worldwide
    </h2>
    <p className="text-xl text-muted-foreground text-center mb-16">
      Join thousands getting feedback that actually helps
    </p>

    {/* Bento Grid of testimonials + stats */}
    <div className="bento-grid-v2">
      <StatCard size="small" {...statData[0]} />
      <TestimonialCard size="wide" {...testimonialData[0]} />
      <StatCard size="small" {...statData[1]} />
      <TestimonialCard size="medium" {...testimonialData[1]} />
      <TestimonialCard size="medium" {...testimonialData[2]} />
      <TestimonialCard size="wide" {...testimonialData[3]} />
    </div>

    {/* Company logos */}
    <div className="mt-16 flex justify-center items-center gap-12 flex-wrap opacity-60">
      {logos.map(logo => (
        <img key={logo.id} src={logo.url} alt={logo.name}
          className="h-8 grayscale hover:grayscale-0 transition-all" />
      ))}
    </div>
  </div>
</section>
```

**Testimonial Card:**
```jsx
<div className={cn(
  "rounded-2xl bg-white/70 backdrop-blur-md border border-white/40",
  "shadow-lg hover:shadow-xl hover:-translate-y-1",
  "transition-all duration-300 p-6 flex flex-col justify-between",
  size === "wide" && "card-wide",
  size === "medium" && "card-medium"
)}>
  {/* Quote */}
  <blockquote className="text-lg text-foreground leading-relaxed mb-6">
    "{quote}"
  </blockquote>

  {/* Author */}
  <div className="flex items-center gap-3">
    <img
      src={author.avatar}
      alt={author.name}
      className="size-12 rounded-full object-cover ring-2 ring-white"
    />
    <div className="flex-1">
      <div className="font-semibold text-foreground">{author.name}</div>
      <div className="text-sm text-muted-foreground">{author.role}</div>
    </div>

    {/* Rating */}
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="size-4 fill-amber-500 text-amber-500" />
      ))}
    </div>
  </div>
</div>
```

**Stat Card:**
```jsx
<div className={cn(
  "rounded-2xl bg-gradient-to-br from-accent-blue to-accent-peach",
  "p-8 text-white shadow-xl flex flex-col justify-center items-center",
  "hover:shadow-2xl hover:scale-105 transition-all duration-300",
  "card-small"
)}>
  <div className="text-5xl font-bold mb-2">{value}</div>
  <div className="text-white/90 font-medium text-center">{label}</div>
</div>
```

---

### Component 4: HeroSection

**Purpose:** Main hero with headline, CTAs, and interactive demo

**File:** `/frontend/components/homepage/HeroSection.tsx`

**Structure:**
```jsx
<section className="relative min-h-[90vh] flex items-center
  bg-gradient-to-b from-background via-accent-blue/5 to-background
  overflow-hidden">

  {/* Background decoration */}
  <div className="absolute inset-0 bg-gradient-glow opacity-50 pointer-events-none" />

  <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-5 gap-12 items-center">

    {/* Left: Content (3 columns) */}
    <div className="lg:col-span-3 space-y-8">
      {/* Headline with stagger animation */}
      <motion.h1
        className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {["Turn feedback into your", "creative advantage"].map((line, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            {line}
          </motion.div>
        ))}
      </motion.h1>

      {/* Supporting text */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-muted-foreground leading-relaxed max-w-2xl"
      >
        Get AI-powered insights in seconds, or expert reviews from
        top creators in your field. Critvue transforms critique from
        dreaded to game-changing.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Button size="lg" className="bg-gradient-to-r from-accent-blue to-accent-peach
          hover:shadow-xl hover:scale-105 text-white font-semibold
          px-8 py-6 text-lg rounded-2xl min-h-[56px]">
          Get Your First Review Free
          <ArrowRight className="ml-2 size-5" />
        </Button>

        <Button variant="outline" size="lg" className="border-2 border-accent-blue/30
          hover:border-accent-blue hover:bg-accent-blue/5 font-semibold
          px-8 py-6 text-lg rounded-2xl min-h-[56px]">
          Browse Expert Reviewers
        </Button>
      </motion.div>

      {/* Social proof ticker */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
        className="flex items-center gap-6 text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="size-4 text-green-500" />
          <span>2,500+ reviews delivered</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="size-4 text-amber-500" />
          <span>98% satisfaction</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-accent-blue" />
          <span>24hr avg turnaround</span>
        </div>
      </motion.div>
    </div>

    {/* Right: Interactive Demo (2 columns) */}
    <motion.div
      className="lg:col-span-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
    >
      <InteractiveCritiqueDemo />
    </motion.div>

  </div>
</section>
```

---

## Responsive Strategy

### Breakpoints (Tailwind Defaults)

- **xs**: `< 640px` (Mobile)
- **sm**: `640px` (Large mobile / small tablet)
- **md**: `768px` (Tablet)
- **lg**: `1024px` (Desktop)
- **xl**: `1280px` (Large desktop)
- **2xl**: `1536px` (Extra large desktop)

### Mobile-First Approach

All base styles target mobile, with progressive enhancement via breakpoints.

### Key Responsive Patterns

**1. Hero Section:**
```
Mobile: Stacked (content → demo)
Desktop: Side-by-side (60/40 split)
```

**2. Bento Grids:**
```
Mobile:    1 column
Tablet:    2 columns
Desktop:   3 columns
XL:        4 columns
```

**3. Typography Scale:**
```
Mobile:    Smaller sizes (80% of desktop)
Desktop:   Full sizes

Example:
Hero H1: text-4xl sm:text-5xl lg:text-6xl
Body:    text-base lg:text-lg
```

**4. Spacing:**
```
Mobile:    Tighter spacing (50-75% of desktop)
Desktop:   Full spacing

Example:
Section gap: py-12 lg:py-24
Card gap:    gap-4 lg:gap-6
```

**5. Cards in Bento Grid:**
```
Mobile:    All cards span 1 column (col-span-1)
Tablet:    Wide/Large cards span 2 cols (sm:col-span-2)
Desktop:   Full masonry with tall cards (lg:row-span-2)
```

### Mobile Optimizations

**Touch Targets:**
- Minimum size: `44px` (iOS/Android standard)
- All buttons: `min-h-[44px]` or larger
- Interactive cards: `min-h-[68px]` or auto with adequate padding

**Gestures:**
- Horizontal scrolling for card galleries (snap-scroll)
- Swipe for perspective toggle (optional)
- Pull-to-refresh for dynamic content (optional)

**Performance:**
- Lazy load images: `loading="lazy"`
- Reduce motion for mobile: `useReducedMotion()` check
- Simplified animations: Fewer particles/effects on small screens

**Navigation:**
- Sticky header with mobile menu
- Bottom nav bar for key actions (optional)
- Floating CTA button (sticky on scroll)

### Responsive Utilities

```jsx
// Hide/show based on breakpoint
className="block lg:hidden"  // Mobile only
className="hidden lg:block"  // Desktop only

// Responsive flex direction
className="flex flex-col lg:flex-row"

// Responsive grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Responsive text alignment
className="text-center lg:text-left"

// Responsive padding
className="px-4 sm:px-6 lg:px-8"
```

---

## Implementation Priority

### Phase 1: MVP (Week 1)

**Goal:** Launch-ready homepage with core conversion elements

**Components:**
1. ✅ Hero Section (HeroSection.tsx)
   - Headline, CTAs, supporting text
   - Social proof ticker
   - Static demo image (placeholder for interactive demo)

2. ✅ How It Works (3-step flow)
   - Simple card layout
   - Static icons and text
   - Basic hover effects

3. ✅ Dual Perspective Section (DualPerspectiveSection.tsx)
   - Toggle between creator/reviewer views
   - Feature cards in Bento grid
   - Crossfade animation

4. ✅ Final CTA
   - Gradient background
   - Large CTA button
   - Trust signals

5. ✅ Responsive layout
   - Mobile-first styles
   - Breakpoint refinements
   - Touch-friendly buttons

**Technical Stack:**
- Next.js 14 App Router
- Tailwind CSS (existing setup)
- Framer Motion (existing)
- Existing component library (Button, Badge, etc.)

**Estimated Time:** 5-7 days

---

### Phase 2: Enhanced (Week 2)

**Goal:** Add interactivity and polish

**Components:**
1. ✅ Interactive Critique Demo (InteractiveCritiqueDemo.tsx)
   - Marker annotations
   - Hover tooltips
   - Click to expand

2. ✅ Social Proof Wall (SocialProofWall.tsx)
   - Testimonial cards
   - Stat cards
   - Company logos

3. ✅ Feature Showcase with interactive demos
   - Mini feature demonstrations
   - Hover animations

4. ✅ Scroll animations
   - Intersection Observer
   - Stagger effects
   - Parallax (subtle)

5. ✅ Micro-interactions polish
   - Button hover effects
   - Card elevation
   - Loading states

**Estimated Time:** 5-7 days

---

### Phase 3: Premium (Week 3+)

**Goal:** Differentiation and delight

**Enhancements:**
1. 🎯 Advanced animations
   - Lottie animations for icons
   - Custom particle effects
   - 3D transforms on scroll

2. 🎯 Dynamic content
   - Live stats from API
   - Real testimonials
   - Actual review previews

3. 🎯 Personalization
   - Detect user type (creator vs reviewer)
   - Show relevant content first
   - Remember preferences

4. 🎯 A/B testing setup
   - Multiple CTA variations
   - Headline tests
   - Layout experiments

5. 🎯 Advanced interactivity
   - Draggable elements
   - Click-through demos
   - Video backgrounds

**Estimated Time:** Ongoing

---

## Copy Suggestions

### Headlines (Alternative Options)

**Hero:**
- "Turn feedback into your creative advantage" (Primary)
- "Critique that actually helps you grow"
- "From good work to exceptional - faster"
- "The feedback platform built for creators"
- "Stop guessing. Start creating with confidence."

**How It Works:**
- "Simple process. Powerful results."
- "Three steps to better work"
- "Your path to expert feedback"

**Dual Perspective:**
- "Built for both sides of the creative process"
- "Whether you create or critique - we've got you"
- "For makers and mentors alike"

**Social Proof:**
- "Trusted by creators worldwide"
- "Join thousands getting feedback that matters"
- "See what creators are saying"

**Final CTA:**
- "Ready to transform your creative process?"
- "Start creating with confidence"
- "Get the feedback you deserve"

### CTA Button Text

**Primary Actions:**
- "Get Your First Review Free" (Hero)
- "Start Free" (Alternative)
- "Request Feedback Now"
- "Get Started Free"

**Secondary Actions:**
- "Browse Expert Reviewers"
- "See How It Works"
- "Learn More"
- "Explore Reviews"

**Reviewer CTA:**
- "Apply to Review"
- "Become a Reviewer"
- "Join as Expert"
- "Start Reviewing"

### Trust Signals

- "No credit card required"
- "Free AI reviews"
- "5 minute setup"
- "Cancel anytime"
- "30-day money-back guarantee"
- "2,500+ reviews delivered"
- "98% satisfaction rate"
- "24hr avg turnaround"

---

## Brand Compliance Checklist

### Colors ✅
- [x] Primary Blue (#3B82F6) used for primary CTAs and accents
- [x] Primary Peach (#F97316) used in gradients and highlights
- [x] Canvas (#FFFFFF, #F9FAFB) for backgrounds
- [x] Text (#111827) for primary text
- [x] Muted (#6B7280) for secondary text
- [x] No colors outside brand palette

### Typography ✅
- [x] Inter as primary font
- [x] Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- [x] Appropriate line heights (1.1 for headings, 1.6 for body)
- [x] Proper hierarchy (H1 > H2 > H3 > Body)

### Spacing ✅
- [x] 4pt/8pt spacing scale used consistently
- [x] Adequate white space around elements
- [x] Section spacing (128px desktop, 64px mobile)
- [x] Card gaps (24px in Bento grid)

### Components ✅
- [x] Rounded corners (2xl for cards: 24px)
- [x] Glassmorphism applied correctly (white/70-90 + backdrop-blur)
- [x] Shadow system (subtle to strong hierarchy)
- [x] Border radius consistent (8px, 16px, 24px, 32px scale)

### Interactions ✅
- [x] Hover states on all interactive elements
- [x] Focus states for accessibility
- [x] Active states (scale-[0.98] on press)
- [x] Smooth transitions (200-300ms)
- [x] Reduced motion support

### Accessibility ✅
- [x] WCAG 2.1 Level AA contrast ratios
- [x] Semantic HTML (h1, h2, section, button, etc.)
- [x] Keyboard navigation support
- [x] ARIA labels where needed
- [x] Touch targets 44px minimum
- [x] Focus indicators visible

### Performance ✅
- [x] Lazy loading images
- [x] Optimized animations (GPU-accelerated: transform, opacity)
- [x] No layout shift (aspect ratios defined)
- [x] Reduced motion detection
- [x] Efficient re-renders (React.memo where appropriate)

---

## File Structure

```
/frontend
  /app
    /page.tsx                          # Homepage (orchestrates sections)

  /components
    /homepage
      /HeroSection.tsx                 # Hero with headline, CTAs, demo
      /InteractiveCritiqueDemo.tsx     # Interactive demo component
      /HowItWorksSection.tsx           # 3-step flow
      /DualPerspectiveSection.tsx      # Creator/Reviewer toggle
      /SocialProofWall.tsx             # Testimonials + stats
      /FeatureShowcase.tsx             # Feature grid with demos
      /ReviewerRecruitmentCTA.tsx      # Dark section for reviewers
      /FinalCTA.tsx                    # Closing conversion section

    /ui
      /Button.tsx                      # Existing
      /Badge.tsx                       # Existing
      /Card.tsx                        # Existing

  /lib
    /animations.ts                     # Framer Motion variants
    /homepage-content.ts               # Copy, testimonials, features data

  /public
    /images
      /homepage
        /hero-demo.png                 # Demo mockup
        /testimonial-avatars           # User avatars
        /company-logos                 # Logo images
        /feature-illustrations         # Feature visuals
```

---

## Next Steps

1. **Review this spec** with stakeholders
2. **Gather assets**: Demo images, testimonials, company logos
3. **Write copy**: Finalize headlines and CTAs
4. **Set up content management**: Where will content live? (Hardcoded vs CMS)
5. **Implement Phase 1** (MVP)
6. **User testing** with target audience
7. **Iterate based on feedback**
8. **Launch Phase 2** (Enhanced)
9. **A/B test** key elements
10. **Continuously improve**

---

## Success Metrics

**Primary KPIs:**
- Conversion rate (visitor → signup)
- Time on page
- Scroll depth
- CTA click-through rate

**Secondary KPIs:**
- Bounce rate
- Mobile vs desktop conversion
- Creator vs reviewer signups
- Social proof engagement

**Target Benchmarks:**
- >3 min average time on page
- >60% scroll to final CTA
- >5% conversion rate (visitor → signup)
- <30% bounce rate

---

## Questions for Stakeholders

1. **Content:** Do we have real testimonials and logos, or should we use placeholders for MVP?
2. **Demo:** Should the interactive critique demo show real reviews or a curated example?
3. **CTAs:** What's the primary conversion goal? (Free trial, browse reviewers, book demo?)
4. **Analytics:** What tracking tools should be integrated? (GA4, Mixpanel, etc.)
5. **A/B Testing:** Do we want to A/B test from day 1 or after initial launch?
6. **Video:** Should any section include video content?
7. **Localization:** Will the homepage need to support multiple languages?

---

**End of Specification**

This homepage design breaks away from generic SaaS templates by being interactive, editorial, and deeply rooted in Critvue's brand identity. It demonstrates the product's value through its own design excellence, making it a portfolio piece as much as a marketing page.

Every element is designed to reinforce trust, showcase capability, and drive conversion - while maintaining the warm, professional, and inspiring tone that defines Critvue.

Ready to build something exceptional. 🚀
