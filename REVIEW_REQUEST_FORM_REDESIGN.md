# Review Request Form Redesign - Creative Invitation Flow

**Created**: 2025-11-17
**Status**: Design Phase
**Goal**: Transform review request creation from a "ticketing system" to a "creative invitation"

---

## Executive Summary

The current review request form is **functional but transactional**. It feels like filling out a backend config rather than inviting a thoughtful creative conversation. This redesign reframes the experience to be:

- **Narrative-first**: Creators tell a story, not fill fields
- **Adaptive**: Form adapts based on content type and feedback goals
- **Human**: Conversational language, live preview, emotional connection
- **Collaborative**: Feels like inviting someone to a conversation, not submitting a ticket

**Core Reframe**: From "Create Review Request" → **"Invite Someone to Review Your Work"**

---

## Current State Analysis

### What Works ✅

1. **Logical step-by-step flow**: Type → Details → Upload → Preferences → Payment → Review
2. **Well-structured metadata**: All the right fields (title, description, audience, goals)
3. **Clean payment integration**: Aligns with tiered pricing
4. **Multi-reviewer system**: Slot-based architecture works beautifully
5. **Optional context fields**: Allow specificity when needed

### What Feels Outdated 🚩

| Issue | Impact |
|-------|--------|
| **Linear & Static** | Same form for everyone, no adaptation by type |
| **Creator Intent Buried** | "Feedback Priority" hidden in step 4, should be front & center |
| **No Preview/Framing** | Creators don't see what reviewers will see |
| **Transactional Tone** | Feels like buying a service, not inviting a conversation |
| **Data Collection Focus** | Asks for fields, not narrative or context |
| **No Content-Type Adaptation** | Design vs. Writing feel identical |

**Bottom Line**: The form isn't broken, but it doesn't reflect Critvue's creative, human, nuanced value proposition.

---

## Design Philosophy

### Core Principles

1. **Intent Before Details**
   - Start with *why* and *what kind* of feedback
   - Let that choice shape the rest of the experience

2. **Show, Don't Just Collect**
   - Live preview of what reviewers will see
   - Visual representation of the request

3. **Adaptive by Context**
   - Design requests show image previews
   - Writing requests show text input
   - Code requests show file upload with language detection

4. **Human Language**
   - "What's this project about?" vs. "Description"
   - "Anything the reviewer should keep in mind?" vs. "Additional context"

5. **Collaborative Framing**
   - Use words like "invite," "share," "collaborate"
   - Avoid "submit," "request," "ticket"

---

## Redesigned Flow

### New Structure: 5 Steps (Down from 7)

```
Step 1: What & Why
  ↓
Step 2: Share Your Work
  ↓
Step 3: Frame the Conversation
  ↓
Step 4: Choose Your Reviewers
  ↓
Step 5: Confirm & Invite
```

**Key Changes**:
- Combine type selection + feedback goal into Step 1
- Merge preferences + context into Step 3
- Payment moved into Step 4 (seamless with reviewer selection)
- Final step is confirmation with live preview

---

## Step-by-Step Breakdown

### Step 1: What & Why

**Old Header**: "Choose Review Type"
**New Header**: "What would you like feedback on?"

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  What would you like feedback on?                           │
│                                                              │
│  [Icon] Design      [Icon] Code       [Icon] Writing        │
│  [Icon] Video       [Icon] Audio      [Icon] Art            │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  What kind of feedback are you looking for?                 │
│                                                              │
│  ○ Quick validation — "Does this work?"                     │
│     Get fast, high-level feedback on your concept           │
│                                                              │
│  ○ Specific improvements — "How can I make this better?"    │
│     Focus on actionable changes and refinements             │
│                                                              │
│  ○ Creative direction — "What's the strongest path forward?"│
│     Strategic guidance on approach and vision               │
│                                                              │
│  ○ Full critique — "Tell me everything"                     │
│     Comprehensive analysis of strengths and opportunities   │
│                                                              │
│  [Continue →]                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Content Type Cards** (Interactive):
- Large, visual cards with icons
- Hover shows example use cases
- Selected state with accent color

**Feedback Goal Presets** (New):
- Radio buttons with descriptive labels
- Each option sets `feedback_priority` under the hood
- Mapping:
  - "Quick validation" → `strengths` + suggests Quick tier
  - "Specific improvements" → `improvements` + suggests Standard tier
  - "Creative direction" → `balanced` + suggests Standard/Deep tier
  - "Full critique" → `balanced` + suggests Deep tier

**Smart Defaults**:
- Selection here pre-fills later steps
- Shows recommended tier badge (subtle, not pushy)

---

### Step 2: Share Your Work

**Old Header**: "Upload Files"
**New Header**: "Share your work"

#### Adaptive Layout by Content Type

**If Content Type = Design**:
```
┌─────────────────────────────────────────────────────────────┐
│  Share your design                                           │
│                                                              │
│  Upload your mockups, prototypes, or design files           │
│                                                              │
│  ┌────────────────────────┐  ┌──────────────┐              │
│  │                        │  │   +          │              │
│  │   [Preview of         │  │              │              │
│  │    uploaded image]    │  │  Add more    │              │
│  │                        │  │              │              │
│  └────────────────────────┘  └──────────────┘              │
│                                                              │
│  dashboard-v2.png (2.3 MB)              [×]                 │
│                                                              │
│  ✓ Supports: PNG, JPG, Figma, Sketch, XD, PSD              │
│                                                              │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  Give your design a title                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ E-commerce Dashboard Redesign                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  What's this project about?                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ This is a redesign of our checkout flow. I'm trying   │ │
│  │ to reduce drop-off rates and make the payment step    │ │
│  │ feel more trustworthy...                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [← Back]                                    [Continue →]   │
└─────────────────────────────────────────────────────────────┘
```

**If Content Type = Writing**:
```
┌─────────────────────────────────────────────────────────────┐
│  Share your writing                                          │
│                                                              │
│  Paste your text or upload a document                       │
│                                                              │
│  ○ Paste text below                                         │
│  ○ Upload document (PDF, DOCX, MD)                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  [Large text input area with markdown preview]        │ │
│  │                                                        │ │
│  │  1,234 words                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Give your piece a title                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ The Future of Remote Work                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  What should the reviewer know?                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ This is for a tech publication. Target audience is    │ │
│  │ startup founders and tech leads...                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [← Back]                                    [Continue →]   │
└─────────────────────────────────────────────────────────────┘
```

**If Content Type = Code**:
```
┌─────────────────────────────────────────────────────────────┐
│  Share your code                                             │
│                                                              │
│  Upload your codebase or specific files                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │        [Drag & drop or click to upload]               │ │
│  │                                                        │ │
│  │        📦 Supports: .zip, .tar.gz, or individual files│ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📁 my-react-app.zip (4.2 MB)                    [×]        │
│     ✓ Detected: React, TypeScript, 23 components           │
│                                                              │
│  What language/framework?                                   │
│  [TypeScript + React ▼]                                     │
│                                                              │
│  Give your project a title                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ React Authentication System                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  What should the reviewer focus on?                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Looking for feedback on the authentication flow and   │ │
│  │ state management patterns...                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [← Back]                                    [Continue →]   │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Adaptive Upload UI**:
- Design: Visual grid with image previews
- Writing: Text input with word count
- Code: File upload with auto-detection
- Video/Audio: Player preview after upload

**Contextual Labels**:
- "What's this project about?" (not "Description")
- "What should the reviewer know?" (not "Additional context")
- "Give your [design/writing/code] a title" (not "Title")

**Smart Helpers**:
- File type detection and suggestions
- Preview rendering where appropriate
- Word/file counts for validation

---

### Step 3: Frame the Conversation

**Old Header**: "Review Preferences"
**New Header**: "Frame the conversation"

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Frame the conversation                                      │
│                                                              │
│  Help reviewers understand what you're looking for          │
│                                                              │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  💡 Start with a preset (optional)                          │
│                                                              │
│  ┌────────────────────┐ ┌────────────────────┐             │
│  │ 📋 Job Application │ │ 🎨 First Attempt   │             │
│  │ I need brutal      │ │ Tell me where to   │             │
│  │ honesty for a job  │ │ focus my learning  │             │
│  │ portfolio          │ │                    │             │
│  └────────────────────┘ └────────────────────┘             │
│                                                              │
│  ┌────────────────────┐ ┌────────────────────┐             │
│  │ 🚀 Pre-Launch      │ │ 🎯 Quick Sanity    │             │
│  │ Final check before │ │ Does this make     │             │
│  │ going live         │ │ sense?             │             │
│  └────────────────────┘ └────────────────────┘             │
│                                                              │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  Who is this for?                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Tech-savvy millennials (25-35), shopping online        │ │
│  └────────────────────────────────────────────────────────┘ │
│  e.g., "First-time home buyers" or "B2B SaaS founders"      │
│                                                              │
│  Any constraints or guidelines to follow?                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Must follow Material Design 3 guidelines               │ │
│  └────────────────────────────────────────────────────────┘ │
│  e.g., "Brand colors only" or "Accessibility required"      │
│                                                              │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  🎙️ Want to add a personal intro? (Optional)               │
│                                                              │
│  Record a quick voice or video message to give reviewers    │
│  more context about your work and goals.                    │
│                                                              │
│  [🎤 Record Voice Note]  [📹 Record Video (30s)]           │
│                                                              │
│  [← Back]                                    [Continue →]   │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Review Goal Presets** (NEW):
- Clickable cards with common scenarios
- Pre-fills feedback priority, tone, suggested tier
- Examples:
  - "Job Application" → improvements focus, deep tier
  - "First Attempt" → balanced, standard tier
  - "Pre-Launch" → improvements, standard tier
  - "Quick Sanity Check" → strengths, quick tier

**Human Questions**:
- "Who is this for?" (vs. "Target Audience")
- "Any constraints or guidelines?" (vs. "Additional Context")

**Voice/Video Intro** (Premium Feature):
- 30-second max
- Shows up in reviewer's brief
- Humanizes the request
- Could be tier-gated (Standard/Deep only)

**Examples Everywhere**:
- Placeholder text shows real examples
- Reduces cognitive load
- Sets the right tone

---

### Step 4: Choose Your Reviewers

**Old Header**: "Pricing"
**New Header**: "Choose your reviewers"

#### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Choose your reviewers                                       │
│                                                              │
│  How many perspectives would you like?                      │
│                                                              │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                            │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │                            │
│  └───┘ └───┘ └───┘ └───┘ └───┘                            │
│         ^^^^^ Selected                                       │
│                                                              │
│  💡 We recommend 2-3 reviewers for balanced feedback        │
│                                                              │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  What level of depth do you need?                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💨 Quick Feedback                                   │   │
│  │                                                      │   │
│  │ Surface-level insights and quick wins               │   │
│  │ • 24-48 hour turnaround                             │   │
│  │ • 200-500 words per review                          │   │
│  │ • Best for early drafts or sanity checks            │   │
│  │                                                      │   │
│  │ $5-15 per reviewer                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⭐ Standard Review                   [Recommended]  │   │
│  │                                                      │   │
│  │ Thorough analysis with actionable insights          │   │
│  │ • 3-5 day turnaround                                │   │
│  │ • 500-1000 words per review                         │   │
│  │ • Best for production-ready work                    │   │
│  │                                                      │   │
│  │ $25-75 per reviewer                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ^^^^^ Selected based on "Specific improvements" goal      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Deep Dive Analysis                               │   │
│  │                                                      │   │
│  │ Comprehensive critique with strategic guidance      │   │
│  │ • 5-7 day turnaround                                │   │
│  │ • 1000+ words per review                            │   │
│  │ • Best for critical projects and decisions          │   │
│  │                                                      │   │
│  │ $100-200+ per reviewer                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  Or skip the cost and try free community reviews            │
│                                                              │
│  ○ Free Review                                              │
│    Lower priority, no guaranteed turnaround                 │
│                                                              │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  Total: 2 reviewers × $50 = $100                           │
│                                                              │
│  [← Back]                                    [Continue →]   │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**Reframed as Reviewer Choice**:
- Focus on "choosing reviewers" not "selecting pricing"
- Emphasis on people and perspectives
- Tier selection feels collaborative, not transactional

**Smart Recommendations**:
- Based on feedback goal from Step 1
- Shows "Recommended" badge on suggested tier
- Explains *why* this tier fits

**Visual Hierarchy**:
- Cards for each tier (not dropdown)
- Expandable details on hover
- Clear benefits and expectations

**Transparent Pricing**:
- Show total calculation at bottom
- No surprises
- Option to go free is still available

---

### Step 5: Confirm & Invite

**Old Header**: "Review & Publish"
**New Header**: "Confirm & invite reviewers"

#### Layout (Split Screen)

```
┌──────────────────────────┬────────────────────────────────┐
│  Left: Live Preview      │  Right: Final Details          │
├──────────────────────────┼────────────────────────────────┤
│                          │  Confirm & invite reviewers    │
│  Preview of your request │                                │
│                          │  Here's what reviewers will    │
│  ┌────────────────────┐  │  see when they browse:         │
│  │                    │  │                                │
│  │  [Image Preview]   │  │  ──────────────────────────   │
│  │                    │  │                                │
│  └────────────────────┘  │  💳 Payment                    │
│                          │                                │
│  E-commerce Dashboard    │  2 Standard Reviews            │
│  Redesign                │  $50 × 2 = $100                │
│                          │                                │
│  by Jane Designer        │  [Stripe Card Input]           │
│                          │                                │
│  "I'm looking for        │  ──────────────────────────   │
│   specific improvements  │                                │
│   on the checkout flow"  │  📧 Get notified when          │
│                          │     reviewers claim slots      │
│  🎯 Specific Improvements│                                │
│  👥 2 reviewers needed   │  ○ Email only                  │
│  ⏱️  3-5 day turnaround  │  ○ Email + SMS                 │
│  💰 $50 per review       │                                │
│                          │  ──────────────────────────   │
│  📎 4 files attached     │                                │
│                          │  By continuing, you agree to   │
│  ─────────────────────   │  our Terms of Service and      │
│                          │  Reviewer Guidelines           │
│  "For: Tech-savvy        │                                │
│   millennials shopping   │  [← Back]    [Invite Reviewers]│
│   online"                │                                │
└──────────────────────────┴────────────────────────────────┘
```

#### Key Features

**Live Preview** (LEFT SIDE):
- Shows exactly what reviewers see in browse feed
- Includes badges for feedback goal, tier, turnaround
- File count and preview
- Target audience
- Creator name and avatar

**Final Details** (RIGHT SIDE):
- Payment (if paid)
- Notification preferences
- Terms checkbox

**CTA Button**:
- "Invite Reviewers" (not "Submit" or "Publish")
- Reinforces collaborative framing

**Post-Submission**:
- Confirmation message with next steps
- "Your invitation is live! We'll notify you when reviewers claim slots."
- Link to view request in browse feed

---

## Voice & Tone Throughout

### Language Shifts

| Old (Transactional) | New (Collaborative) |
|---------------------|---------------------|
| "Create Review Request" | "Invite Someone to Review Your Work" |
| "Submit" | "Invite" or "Send Invitation" |
| "Review Type" | "What would you like feedback on?" |
| "Description" | "What's this project about?" |
| "Additional Context" | "Anything the reviewer should keep in mind?" |
| "Target Audience" | "Who is this for?" |
| "Preferences" | "Frame the conversation" |
| "Number of Reviews" | "How many perspectives would you like?" |
| "Pricing" | "Choose your reviewers" |
| "Publish Request" | "Invite reviewers" |

### Microcopy Examples

**Helpful hints** (throughout):
- "💡 Tip: The more context you provide, the better feedback you'll get"
- "✓ Great! Design files uploaded successfully"
- "🎯 Based on your goal, we recommend Standard tier"

**Placeholder text** (show examples):
- "E-commerce Dashboard Redesign" (not "Enter title")
- "Tech-savvy millennials, 25-35 years old" (not "Target audience")
- "Must follow Material Design 3 guidelines" (not "Additional context")

**Error messages** (friendly):
- "Oops! Please add at least one file so reviewers have something to look at"
- "Almost there! Your description needs to be at least 20 characters"

---

## New Features

### 1. Review Goal Presets

**What**: Pre-configured scenarios that auto-fill settings

**Examples**:
```typescript
const REVIEW_GOAL_PRESETS = [
  {
    id: "job-application",
    label: "Job Application",
    icon: "📋",
    description: "I need brutal honesty for a job portfolio",
    settings: {
      feedback_priority: "improvements",
      suggested_tier: "deep_dive",
      tone: "critical",
      context_hint: "This is for a job application to [company]. Focus on professionalism and polish."
    }
  },
  {
    id: "first-attempt",
    label: "First Attempt",
    icon: "🎨",
    description: "Tell me where to focus my learning",
    settings: {
      feedback_priority: "balanced",
      suggested_tier: "standard",
      tone: "encouraging",
      context_hint: "This is my first time trying [skill]. Be encouraging but honest about areas to improve."
    }
  },
  {
    id: "pre-launch",
    label: "Pre-Launch Review",
    icon: "🚀",
    description: "Final check before going live",
    settings: {
      feedback_priority: "improvements",
      suggested_tier: "standard",
      tone: "critical",
      context_hint: "Launching soon. Need to catch any issues or problems before it goes live."
    }
  },
  {
    id: "quick-sanity",
    label: "Quick Sanity Check",
    icon: "🎯",
    description: "Does this make sense?",
    settings: {
      feedback_priority: "strengths",
      suggested_tier: "quick_feedback",
      tone: "validating",
      context_hint: "Just need a quick gut check on whether this approach makes sense."
    }
  }
];
```

**Benefits**:
- Reduces cognitive load
- Sets appropriate expectations
- Guides tier selection
- Pre-fills context hints

---

### 2. Voice/Video Intro (Premium Feature)

**What**: 30-second voice or video message from creator to reviewer

**UX**:
```
┌─────────────────────────────────────────────────────────────┐
│  🎙️ Want to add a personal intro? (Optional)               │
│                                                              │
│  Record a quick message to give reviewers more context      │
│  about your work and goals.                                 │
│                                                              │
│  [🎤 Record Voice Note]  [📹 Record Video (30s)]           │
│                                                              │
│  Recording... 00:12 / 00:30  [Stop]                         │
│                                                              │
│  ✓ Voice note recorded (12 seconds)       [Preview] [×]    │
└─────────────────────────────────────────────────────────────┘
```

**Backend**:
```python
class ReviewRequest:
    voice_intro_url: Optional[str]
    video_intro_url: Optional[str]
    intro_duration: Optional[int]  # seconds
```

**Benefits**:
- Humanizes the request
- Adds emotional context
- Helps reviewers understand intent
- Premium differentiator

**Tier Gating**:
- Free: Not available
- Quick: Not available
- Standard: Voice only
- Deep: Voice + Video

---

### 3. Live Preview Panel

**What**: Side-by-side view showing what reviewers will see

**When**: Visible from Step 2 onwards (after title + upload)

**Layout**:
```
┌──────────────────────────┬────────────────────────────────┐
│  Form (Left)             │  Live Preview (Right)          │
├──────────────────────────┼────────────────────────────────┤
│  User fills in fields    │  ┌──────────────────────────┐  │
│                          │  │ Preview Card             │  │
│  [Title Input]           │  │                          │  │
│  [Description Input]     │  │ [Image Preview]          │  │
│  [Files Upload]          │  │                          │  │
│                          │  │ Dashboard Redesign       │  │
│                          │  │ by Jane Designer         │  │
│                          │  │                          │  │
│                          │  │ 🎯 Specific Improvements│  │
│                          │  │ 💰 $50 per review       │  │
│                          │  │ 👥 2 reviewers needed   │  │
│                          │  │                          │  │
│                          │  │ [Claim Slot] button     │  │
│                          │  └──────────────────────────┘  │
└──────────────────────────┴────────────────────────────────┘
```

**Benefits**:
- Shows creators what reviewers see
- Validates that content looks good
- Increases confidence in submission
- Encourages quality content

---

### 4. Smart Defaults & Suggestions

**Based on Feedback Goal**:
```typescript
if (feedbackGoal === "quick-validation") {
  suggestedTier = "quick_feedback";
  suggestedReviewerCount = 1;
  showTip = "Quick feedback works best with 1-2 reviewers";
}

if (feedbackGoal === "full-critique") {
  suggestedTier = "deep_dive";
  suggestedReviewerCount = 2;
  showTip = "Deep critiques are most valuable with 2-3 expert reviewers";
}
```

**Content Type Hints**:
```typescript
if (contentType === "design") {
  uploadHint = "Upload your mockups, prototypes, or design files";
  titlePlaceholder = "E-commerce Dashboard Redesign";
}

if (contentType === "code") {
  uploadHint = "Upload your codebase as a .zip or individual files";
  titlePlaceholder = "React Authentication System";
  showLanguageSelector = true;
}
```

---

## Mobile Adaptations

### Responsive Considerations

**Step 1-4: Stack vertically**
- No live preview panel on mobile
- Show preview as final step only
- Larger touch targets (44px min)
- Simplified tier cards (accordion-style)

**Step 5: Full-screen preview**
- Tap "Preview" button to see full-screen version
- Bottom sheet for payment details
- Sticky "Invite Reviewers" button at bottom

**Voice/Video Recording**:
- Use native device recorders
- Tap to record, tap to stop
- Auto-upload on completion

---

## Component Architecture

### Frontend Components

```typescript
// Main component
<ReviewRequestFlowV2>
  <Step1_WhatAndWhy />
  <Step2_ShareWork />
  <Step3_FrameConversation />
  <Step4_ChooseReviewers />
  <Step5_ConfirmInvite />
</ReviewRequestFlowV2>

// Step 1 components
<ContentTypeSelector cards={contentTypes} />
<FeedbackGoalSelector presets={feedbackGoals} />

// Step 2 components (adaptive)
<AdaptiveUploadUI contentType={type}>
  {type === 'design' && <DesignUploader />}
  {type === 'writing' && <WritingInput />}
  {type === 'code' && <CodeUploader />}
  {type === 'video' && <VideoUploader />}
  {type === 'audio' && <AudioUploader />}
</AdaptiveUploadUI>

// Step 3 components
<ReviewGoalPresets presets={presets} />
<VoiceVideoRecorder
  type="voice"
  maxDuration={30}
  onRecordingComplete={handleVoiceIntro}
/>

// Step 4 components
<ReviewerCountSelector min={1} max={5} />
<TierSelector
  tiers={tiers}
  recommended={suggestedTier}
  onSelect={handleTierSelect}
/>

// Step 5 components
<LivePreviewPanel request={draftRequest} />
<PaymentForm tier={tier} reviewerCount={count} />
<SubmitButton label="Invite Reviewers" />
```

### State Management

```typescript
interface ReviewRequestFormState {
  // Step 1
  contentType: ContentType;
  feedbackGoal: FeedbackGoal;
  feedbackPriority: FeedbackPriority;  // Derived from goal

  // Step 2
  title: string;
  description: string;
  files: File[];

  // Step 3
  preset?: ReviewGoalPreset;
  targetAudience?: string;
  constraints?: string;
  voiceIntro?: Blob;
  videoIntro?: Blob;

  // Step 4
  reviewerCount: number;
  tier: ReviewTier;
  isPaid: boolean;

  // Meta
  currentStep: number;
  isValid: boolean;
  suggestedTier: ReviewTier;
}
```

---

## Implementation Phases

### Phase 1: Foundation Improvements (1 week)

**Goal**: Improve existing form without major structural changes

**Tasks**:
- ✅ Update all language/microcopy to collaborative tone
- ✅ Add examples to all placeholder text
- ✅ Move feedback priority to Step 1 (combine with type selection)
- ✅ Improve tier cards visual design
- ✅ Add "Invite Reviewers" button text

**Deliverable**: Same 7-step flow, better language and UX

---

### Phase 2: Adaptive Upload UI (1-2 weeks)

**Goal**: Different upload experiences by content type

**Tasks**:
- ✅ Design uploader with image preview grid
- ✅ Writing input with word count and markdown preview
- ✅ Code uploader with file type detection
- ✅ Video/Audio uploaders with player preview
- ✅ Routing logic based on content type

**Deliverable**: Upload step adapts to content type

---

### Phase 3: Review Goal Presets (1 week)

**Goal**: Quick-start templates for common scenarios

**Tasks**:
- ✅ Define 4-6 preset scenarios
- ✅ Create preset card UI
- ✅ Auto-fill logic based on preset selection
- ✅ Smart tier recommendations
- ✅ Context hint generation

**Deliverable**: Presets available in Step 3

---

### Phase 4: Live Preview Panel (1-2 weeks)

**Goal**: Show creators what reviewers will see

**Tasks**:
- ✅ Build preview card component
- ✅ Real-time updates as user fills form
- ✅ Side-by-side layout (desktop)
- ✅ Preview button (mobile)
- ✅ Accurate rendering of all fields

**Deliverable**: Live preview from Step 2 onwards

---

### Phase 5: Voice/Video Intro (2-3 weeks)

**Goal**: Allow creators to record personal messages

**Tasks**:
- ✅ Voice recorder UI (browser MediaRecorder API)
- ✅ Video recorder UI (30s limit)
- ✅ Upload to storage (S3/similar)
- ✅ Playback in reviewer's view
- ✅ Tier gating logic

**Deliverable**: Voice/video intro for Standard/Deep tiers

---

### Phase 6: Full Redesign (2-3 weeks)

**Goal**: Consolidate to 5-step flow with all features

**Tasks**:
- ✅ Combine steps (Type + Goal = Step 1)
- ✅ Restructure routing
- ✅ Update backend to handle new fields
- ✅ Mobile optimizations
- ✅ End-to-end testing
- ✅ Analytics tracking

**Deliverable**: Complete redesigned flow in production

---

## Success Metrics

### Engagement Metrics
- ⬆️ 30%+ increase in form completion rate
- ⬆️ 25%+ increase in paid vs. free selection
- ⬆️ 40%+ increase in Deep Dive tier usage
- ⬇️ 50%+ reduction in drop-off at payment step

### Quality Metrics
- ⬆️ 35%+ increase in average description length
- ⬆️ 50%+ increase in context/audience field completion
- ⬆️ 20%+ increase in reviews marked as "helpful" by creators
- ⬇️ 30%+ reduction in "unclear request" flags from reviewers

### Business Metrics
- ⬆️ 40%+ increase in average order value
- ⬆️ 25%+ increase in multi-reviewer requests
- ⬆️ 20%+ increase in repeat requests
- ⬆️ 15%+ increase in conversion rate (browse → claim)

---

## A/B Test Plan

### Test 1: Language Only
- **Control**: Current form with old language
- **Variant**: Current form with new collaborative language
- **Metric**: Completion rate, paid tier selection

### Test 2: Presets
- **Control**: No presets
- **Variant**: Review goal presets in Step 3
- **Metric**: Time to complete, context quality score

### Test 3: Live Preview
- **Control**: No preview
- **Variant**: Live preview panel
- **Metric**: Completion rate, creator satisfaction

### Test 4: Voice Intro
- **Control**: No voice option
- **Variant**: Voice intro for Standard/Deep
- **Metric**: Reviewer satisfaction, review quality score

---

## Open Questions

1. **Voice/Video Intro**:
   - Should this be available for free reviews?
   - Max duration: 30s or 60s?
   - Storage costs vs. value added?

2. **Review Goal Presets**:
   - How many presets is optimal (4, 6, 8)?
   - Allow custom presets in future?
   - Pre-fill vs. suggest (override behavior)?

3. **Live Preview**:
   - Desktop only or mobile too?
   - Real-time updates or "Preview" button?
   - Show preview of reviewer feedback template?

4. **Adaptive Upload**:
   - Support direct Figma/Sketch links instead of downloads?
   - Auto-extract images from PDFs?
   - Code playground integration (CodeSandbox, StackBlitz)?

5. **Tier Recommendations**:
   - How strongly to nudge toward paid tiers?
   - Show success rates by tier ("95% of Standard reviews rated 4+stars")?
   - Dynamic pricing based on demand?

---

## Next Steps

1. **Team Review**: Discuss spec and gather feedback
2. **Design Mockups**: Create high-fidelity designs for each step
3. **User Research**: Test prototypes with 5-10 creators
4. **Phased Rollout**: Start with Phase 1 (language), iterate based on data
5. **Analytics Setup**: Track all metrics before launch
6. **Documentation**: Update API docs and internal guides

---

**Document Status**: Ready for Team Review
**Recommended Start**: Phase 1 (Language improvements) - Quick win, low risk
**Expected Timeline**: 8-12 weeks for full redesign (Phases 1-6)
