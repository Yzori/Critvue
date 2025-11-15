# Expert Reviewer Application - Implementation Guide

## Overview

A modern, mobile-first, innovative expert reviewer application flow for Critvue, built following UX research findings and best practices.

## What's Been Built

### Core Infrastructure

1. **State Management** (`stores/expert-application-store.ts`)
   - Zustand store with localStorage persistence
   - Auto-save functionality every 2-3 seconds
   - Comprehensive state management for all 8 steps
   - Helper hooks for easy data access

2. **Type System** (`lib/expert-application/types.ts`)
   - Complete TypeScript types for all application data
   - Skill categories with predefined options
   - Professional level definitions
   - Relationship types for references

3. **Validation** (`lib/expert-application/validation.ts`)
   - Zod schemas for all steps
   - Inline validation (on blur, not during typing)
   - Clear, helpful error messages
   - Step validation helper function

4. **Auto-Save Utilities** (`lib/expert-application/auto-save.ts`)
   - Debounced auto-save hook
   - Time remaining calculation
   - Haptic feedback utilities
   - Reduced motion support

### UI Components

1. **ApplicationProgress** (`components/expert-application/application-progress.tsx`)
   - Hybrid progress bar (bar + steps + percentage)
   - Color gradient based on progress (red → orange → yellow → green)
   - Estimated time remaining
   - Mobile-responsive with step labels

2. **AutoSaveIndicator** (`components/expert-application/auto-save-indicator.tsx`)
   - Visual save status with animations
   - "Saving..." and "Saved X ago" states
   - Animated transitions using Framer Motion

3. **ApplicationNavigation** (`components/expert-application/application-navigation.tsx`)
   - Bottom fixed navigation (mobile-first)
   - Prev/Next buttons with haptic feedback
   - Save & Exit functionality
   - Safe area insets for notched devices

4. **CelebrationModal** (`components/expert-application/celebration-modal.tsx`)
   - 50% completion celebration (medium confetti)
   - 100% completion celebration (large confetti burst)
   - Haptic feedback on mobile
   - Respects prefers-reduced-motion

### Application Steps

1. **Step 1: Welcome** (`steps/step-1-welcome.tsx`)
   - Hero card with gradient
   - Value proposition (3 benefits)
   - What to expect (4 steps overview)
   - Time estimate: 15-20 minutes
   - Auto-save notice

2. **Step 2: Personal Information** (`steps/step-2-personal-info.tsx`)
   - Full name, email, phone
   - Location, timezone
   - LinkedIn URL (optional)
   - Inline validation with clear errors
   - Optimized keyboard types (email, tel, url)

3. **Step 3: Professional Background** (`steps/step-3-professional-background.tsx`)
   - Professional level selection (radio cards)
   - Custom level if "Other" selected
   - Years of experience
   - Current role and brief bio (150-500 chars)

4. **Step 4: Skills & Specializations** (`steps/step-4-skills.tsx`)
   - Multi-select with category filtering
   - Search functionality
   - 1-10 skills required
   - Primary skill selection with star icon
   - Animated skill chips with remove

5. **Step 5: Portfolio** (`steps/step-5-portfolio.tsx`)
   - 3-5 work samples required
   - Upload, camera, or URL options
   - Title and description for each sample
   - File validation (type, size)
   - NOTE: Needs integration with file upload service

6. **Step 6: Credentials** (`steps/step-6-credentials.tsx`)
   - Education (required, 1+)
   - Certifications (optional)
   - Employment (required, 1+)
   - Repeatable card groups
   - NOTE: Needs full CRUD implementation

7. **Step 7: References** (`steps/step-7-references.tsx`)
   - Exactly 3 professional references
   - Name, relationship, email, phone, company
   - Unique email validation
   - NOTE: Needs full form implementation

8. **Step 8: Sample Review** (`steps/step-8-sample-review.tsx`)
   - Star rating (1-5)
   - Strengths (50-500 chars)
   - Areas for improvement (50-500 chars)
   - Detailed feedback (200-2000 chars)
   - Character counters with validation

### Pages

1. **Main Application Page** (`app/apply/expert/page.tsx`)
   - Resume draft dialog
   - Loads ApplicationContainer
   - Handles "Start Fresh" vs "Resume"

2. **Success Page** (`app/apply/expert/success/page.tsx`)
   - Celebration with checkmark
   - Application ID display
   - Next steps (1-2-3 format)
   - Return to homepage & save summary buttons

### Container

**ApplicationContainer** (`components/expert-application/application-container.tsx`)
- Coordinates all steps
- Handles navigation between steps
- Manages validation state
- Shows celebration modals at 50% and 100%
- Smooth page transitions with Framer Motion
- Submit functionality (needs API integration)

## Brand Compliance

### Colors
- **Primary Blue**: `var(--accent-blue)` (#3B82F6)
- **Accent Peach**: `var(--accent-peach)` (#F97316)
- **Accent Sage**: `var(--accent-sage)` (#4ADE80)
- **Progress Gradient**: Red → Orange → Yellow → Green

### Typography
- Font: Inter (already in project)
- Size: 16px+ body (mobile-first)
- Headings: Bold, clear hierarchy

### Spacing
- 4px/8px scale
- Generous padding: 16-24px
- Card padding: 24px (6) mobile, 32px (8) desktop

### Glassmorphism
- Cards use `glass-light`, `glass-medium`, `glass-heavy` classes
- Backdrop blur effects
- Border with transparency

### Shadows
- Subtle elevation using existing shadow utilities
- Hover states with transform and shadow

### Animations
- Framer Motion for all transitions
- Duration: 0.3s standard, 0.5s for celebrations
- Respects `prefers-reduced-motion`
- Haptic feedback on mobile (vibration API)

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus management between steps
- Screen reader announcements
- Color contrast: WCAG AA (4.5:1)
- Touch targets: 44px+ (48px preferred)
- Safe area insets for iOS notches

## What Still Needs Implementation

### High Priority

1. **Step 5: Portfolio Upload**
   - Integrate with file upload service (S3, Cloudinary, Uppy)
   - Camera integration (HTML5 file input works, but needs polish)
   - Image preview and editing
   - Drag-and-drop functionality
   - File compression for large images

2. **Step 6: Credentials Full Forms**
   - Education entry form (institution, degree, field, years)
   - Certification entry form (name, issuer, year, URL)
   - Employment entry form (company, role, years)
   - Edit/delete functionality for each entry
   - Date validation (end year > start year)

3. **Step 7: References Full Forms**
   - Reference entry form (name, relationship, email, phone, company)
   - One-at-a-time progressive disclosure
   - Unique email validation
   - Edit functionality

4. **API Integration**
   - Create backend endpoints:
     - `POST /api/expert-application/draft` - Save draft
     - `POST /api/expert-application/submit` - Final submission
     - `GET /api/expert-application/resume/:id` - Resume draft
   - Update auto-save to call API
   - Handle application ID generation
   - Error handling and retry logic

### Medium Priority

5. **Additional shadcn/ui Components**
   - Install missing components:
     ```bash
     npx shadcn@latest add select
     npx shadcn@latest add accordion
     npx shadcn@latest add radio-group
     npx shadcn@latest add dialog
     npx shadcn@latest add progress
     ```

6. **Location Autocomplete**
   - Integrate Google Places API for location field
   - Timezone auto-detection based on location
   - Current time preview for selected timezone

7. **LinkedIn Profile Preview**
   - Fetch and display LinkedIn profile picture
   - Validate LinkedIn URL format
   - Optional: Show profile data (name, headline)

8. **Sample Design for Step 8**
   - Add actual design image to review
   - Multiple sample options (random selection)
   - Zoom and pan functionality
   - Split-screen layout (design + review form)

### Low Priority (Enhancements)

9. **Swipe Gestures**
   - Swipe right to go back
   - Swipe left to go next (if valid)
   - Visual indicators for swipeable content

10. **Offline Support**
    - Service worker for offline caching
    - Queue submissions when offline
    - Sync when back online

11. **Analytics**
    - Track drop-off points per step
    - Average time per step
    - Validation error frequency
    - Completion rate

12. **Email Verification**
    - Send verification code to email
    - Confirm email before proceeding
    - Prevent duplicate applications

13. **Social Sharing**
    - "I applied to be a Critvue reviewer" share feature
    - Generate shareable card/image
    - Twitter, LinkedIn, Facebook integration

## Testing Checklist

### Functionality
- [ ] All steps render correctly
- [ ] Navigation works (prev/next/save & exit)
- [ ] Validation prevents advancement when invalid
- [ ] Auto-save persists to localStorage
- [ ] Resume draft works correctly
- [ ] Celebration modals show at 50% and 100%
- [ ] Submit redirects to success page

### Mobile Testing
- [ ] Test on iOS Safari (iPhone 12, 13, 14)
- [ ] Test on Android Chrome (various sizes)
- [ ] Touch targets are 44px+
- [ ] Keyboard types are correct (email, tel, url, numeric)
- [ ] Safe area insets work (iPhone with notch)
- [ ] Haptic feedback works (if supported)
- [ ] Camera integration works for portfolio

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader announcements
- [ ] ARIA labels present
- [ ] Focus visible on all interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion respected
- [ ] High contrast mode supported

### Cross-Browser
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

### Performance
- [ ] Lighthouse score 90+ (Performance, Accessibility, Best Practices)
- [ ] Page load < 2 seconds
- [ ] Smooth animations (60fps)
- [ ] No layout shift
- [ ] Bundle size optimized

## Usage

### Development
```bash
cd /home/user/Critvue/frontend
npm run dev
```

Navigate to: `http://localhost:3000/apply/expert`

### Building for Production
```bash
npm run build
npm run start
```

## File Structure

```
frontend/
├── app/
│   └── apply/
│       └── expert/
│           ├── page.tsx                 # Main application page
│           └── success/
│               └── page.tsx             # Success confirmation page
├── components/
│   ├── expert-application/
│   │   ├── application-container.tsx    # Main container
│   │   ├── application-navigation.tsx   # Bottom nav
│   │   ├── application-progress.tsx     # Progress indicator
│   │   ├── auto-save-indicator.tsx      # Save status
│   │   ├── celebration-modal.tsx        # Confetti celebrations
│   │   └── steps/
│   │       ├── step-1-welcome.tsx       # Welcome screen
│   │       ├── step-2-personal-info.tsx # Personal info form
│   │       ├── step-3-professional-background.tsx
│   │       ├── step-4-skills.tsx        # Skills multi-select
│   │       ├── step-5-portfolio.tsx     # Portfolio upload
│   │       ├── step-6-credentials.tsx   # Education/certs/employment
│   │       ├── step-7-references.tsx    # Professional references
│   │       └── step-8-sample-review.tsx # Sample review submission
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── textarea.tsx
│       ├── badge.tsx
│       └── file-upload.tsx
├── lib/
│   └── expert-application/
│       ├── types.ts                     # TypeScript types
│       ├── validation.ts                # Zod schemas
│       └── auto-save.ts                 # Auto-save utilities
└── stores/
    └── expert-application-store.ts      # Zustand store
```

## Key Technologies

- **Next.js 16**: App router, React 19
- **TypeScript**: Strict mode
- **Zustand**: State management with persistence
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **Framer Motion**: Animations
- **canvas-confetti**: Celebration effects
- **date-fns**: Date formatting
- **Tailwind CSS 4**: Styling
- **shadcn/ui**: UI components

## Brand Voice

- **Professional but approachable**: Not stuffy, but not casual
- **Encouraging**: Positive microcopy ("Almost there!", "Great start!")
- **Clear**: No jargon, straightforward instructions
- **Respectful**: "Your time is valuable"

## Next Steps

1. **Complete File Upload Integration** (Step 5)
   - Choose service: AWS S3, Cloudinary, or Uppy with backend
   - Implement drag-and-drop
   - Add image preview and editing

2. **Build CRUD Forms** (Steps 6 & 7)
   - Education entry form with validation
   - Certification entry form
   - Employment entry form
   - Reference entry form (3x)

3. **Create Backend API**
   - Draft saving endpoint
   - Application submission endpoint
   - Email notification service

4. **Install Missing UI Components**
   - Select, Accordion, RadioGroup, Dialog, Progress

5. **Test Thoroughly**
   - Real device testing (iOS, Android)
   - Accessibility audit
   - Performance optimization

6. **Polish & Launch**
   - Final UX review
   - Copy review
   - Analytics setup

## Notes

- All animations respect `prefers-reduced-motion`
- Auto-save uses localStorage + API (when implemented)
- Haptic feedback uses Vibration API (where supported)
- Safe area insets for iOS notches (`pb-safe`, `pt-safe`)
- Mobile-first: all designs start mobile, enhance for desktop

## Support

For questions or issues:
- Review UX research: `/home/user/Critvue/docs/research/EXPERT_REVIEWER_APPLICATION_UX_RESEARCH.md`
- Check Tailwind config: `/home/user/Critvue/frontend/app/globals.css`
- Review brand guidelines: Design system tokens in `globals.css`

---

Built with Claude Code | November 2025
