# Smart Adaptive Review Editor - Technical Specification

**Created**: 2025-11-17
**Status**: Design Phase
**Owner**: Critvue Team

---

## Executive Summary

The Smart Adaptive Review Editor transforms Critvue's review submission experience from a **generic textarea** to a **context-aware, intent-driven, structured feedback system** that adapts based on:

1. **Content Type** (design, code, writing, video, audio, art)
2. **Creator's Feedback Priority** (strengths, improvements, balanced)
3. **Review Tier** (quick, standard, deep_dive)

**Goal**: Make reviews more actionable, structured, and valuable by guiding reviewers through the right questions in the right format for each context.

---

## Problem Statement

### Current State (Generic Approach)

```typescript
// Current: One-size-fits-all
<ReviewEditor>
  <StarRating />           // Same for all
  <Textarea />             // Same for all
  <FileAttachments />      // Same for all
  <QualityChecklist />     // Same for all
</ReviewEditor>
```

**Issues**:
- ❌ Designer reviewing UI mockup uses same textarea as code reviewer
- ❌ Audio review has no timestamp markers
- ❌ Creator's "Feedback Priority" (strengths/improvements) is ignored
- ❌ Deep Dive ($100+) reviews have same expectations as Quick ($5)
- ❌ No visual annotation for design files
- ❌ No structured guidance for reviewers

### Desired State (Adaptive Approach)

```typescript
// Desired: Context-aware
<SmartReviewEditor
  contentType="design"
  feedbackPriority="improvements"
  reviewTier="standard"
>
  {/* Dynamically renders appropriate UI */}
  <DesignReviewMode>
    <ImageViewer />
    <PinAnnotationTool />
    <StructuredSections
      required={["Issues Noticed", "Suggestions & Fixes"]}
      optional={["Strengths"]}
    />
  </DesignReviewMode>
</SmartReviewEditor>
```

**Benefits**:
- ✅ Design reviews get pin annotations automatically
- ✅ Audio reviews get timestamp markers
- ✅ Creator intent shapes which sections are required
- ✅ Tier determines depth expectations and word counts
- ✅ Reviewers guided through structured prompts
- ✅ Higher quality, more actionable feedback

---

## Core Architecture: The Adaptation Formula

```
Smart UI = f(ContentType, FeedbackPriority, ReviewTier)
```

### Adaptation Matrix

| Dimension | Values | Impact on UI |
|-----------|--------|--------------|
| **Content Type** | design, code, writing, video, audio, art | Changes **feedback modality** (pins, timestamps, highlights) |
| **Feedback Priority** | strengths, improvements, balanced | Changes **section requirements** (which prompts are required) |
| **Review Tier** | quick, standard, deep_dive | Changes **depth expectations** (word counts, section counts) |

---

## Detailed Content Type Modes

### Mode 1: Design Reviews (UI/UX, Graphics, Logos)

**Content Types**: `design`, `art`
**Primary Interaction**: Visual pin annotations

#### UI Components

```typescript
<DesignReviewMode>
  {/* Top: File Preview with Pin Tools */}
  <ImageViewer
    files={reviewRequest.files}
    currentFile={selectedFile}
    zoom={zoom}
    pan={pan}
  >
    <PinOverlay pins={pins} />
    <ZoomControls />
    <FileNavigation /> {/* If multiple images */}
  </ImageViewer>

  {/* Left Sidebar: Pin Placement Tools */}
  <PinToolbar>
    <PinTypeSelector>
      <Option type="issue" color="red" icon="🔴" />
      <Option type="suggestion" color="yellow" icon="💡" />
      <Option type="praise" color="green" icon="✅" />
      <Option type="question" color="blue" icon="❓" />
    </PinTypeSelector>
    <Button>Place Pin</Button>
  </PinToolbar>

  {/* Right Sidebar: Pin List + Sections */}
  <Tabs>
    <Tab value="pins">
      <PinList pins={pins}>
        {pins.map(pin => (
          <PinCard
            number={pin.number}
            type={pin.type}
            feedback={pin.feedback}
            onJumpTo={() => scrollToPinOnImage(pin)}
            onEdit={() => editPin(pin)}
            onDelete={() => deletePin(pin)}
          />
        ))}
      </PinList>
    </Tab>

    <Tab value="sections">
      <StructuredSections
        sections={getSectionsForDesign(feedbackPriority, tier)}
      />
    </Tab>

    <Tab value="rating">
      <RatingSelector />
      <QualityChecklist />
    </Tab>
  </Tabs>
</DesignReviewMode>
```

#### Structured Sections (Feedback Priority Adaptation)

**If `feedbackPriority = "improvements"`**:
```typescript
sections: [
  {
    id: "issues",
    label: "Issues Noticed",
    prompt: "What problems or mistakes did you identify?",
    required: true,
    minWords: tier === 'quick' ? 50 : tier === 'standard' ? 150 : 300,
    placeholder: "List specific issues with design elements, spacing, alignment..."
  },
  {
    id: "suggestions",
    label: "Suggestions & Fixes",
    prompt: "How would you improve this design?",
    required: true,
    minWords: tier === 'quick' ? 50 : tier === 'standard' ? 150 : 300,
    placeholder: "Provide actionable recommendations..."
  },
  {
    id: "strengths",
    label: "Strengths (Optional)",
    prompt: "What works well in this design?",
    required: false,
    placeholder: "Highlight positive aspects..."
  }
]
```

**If `feedbackPriority = "strengths"`**:
```typescript
sections: [
  {
    id: "strengths",
    label: "What Works Well",
    prompt: "What are the strongest aspects of this design?",
    required: true,
    minWords: tier === 'quick' ? 100 : tier === 'standard' ? 200 : 400
  },
  {
    id: "standout",
    label: "Standout Elements",
    prompt: "What makes this design unique or effective?",
    required: true,
    minWords: tier === 'quick' ? 50 : tier === 'standard' ? 150 : 300
  },
  {
    id: "minor-improvements",
    label: "Minor Refinements (Optional)",
    prompt: "Any small tweaks to consider?",
    required: false
  }
]
```

**If `feedbackPriority = "balanced"`**:
```typescript
sections: [
  {
    id: "strengths",
    label: "Strengths",
    prompt: "What works well?",
    required: true,
    minWords: tier === 'quick' ? 75 : tier === 'standard' ? 150 : 250
  },
  {
    id: "improvements",
    label: "Areas for Improvement",
    prompt: "What could be better?",
    required: true,
    minWords: tier === 'quick' ? 75 : tier === 'standard' ? 150 : 250
  },
  {
    id: "overall",
    label: "Overall Assessment",
    prompt: "Summarize your feedback",
    required: tier === 'deep_dive', // Only required for deep dive
    minWords: tier === 'deep_dive' ? 200 : 100
  }
]
```

---

### Mode 2: Code Reviews

**Content Types**: `code`
**Primary Interaction**: Line-level or file-level annotations

#### UI Components

```typescript
<CodeReviewMode>
  {/* File Explorer */}
  <FileExplorer files={codeFiles}>
    {files.map(file => (
      <FileItem
        filename={file.name}
        language={file.language}
        onClick={() => openFile(file)}
      />
    ))}
  </FileExplorer>

  {/* Code Viewer with Annotations */}
  <CodeViewer
    file={currentFile}
    language={detectLanguage(currentFile)}
    annotations={lineComments}
  >
    <SyntaxHighlighter />
    <LineNumbers />
    <CommentMarkers onClick={(line) => addLineComment(line)} />
  </CodeViewer>

  {/* Comment Sidebar */}
  <CommentSidebar>
    <LineCommentsList>
      {lineComments.map(comment => (
        <LineComment
          line={comment.lineNumber}
          filename={comment.filename}
          type={comment.type} // bug, suggestion, question, praise
          text={comment.text}
        />
      ))}
    </LineCommentsList>

    <StructuredSections>
      <Section
        id="architecture"
        label="Code Architecture"
        prompt="Evaluate the overall structure and organization"
        required={tier !== 'quick'}
      />
      <Section
        id="quality"
        label="Code Quality"
        prompt="Assess readability, maintainability, and best practices"
        required={true}
      />
      <Section
        id="bugs"
        label="Potential Issues"
        prompt="Identify bugs, edge cases, or security concerns"
        required={feedbackPriority !== 'strengths'}
      />
      <Section
        id="strengths"
        label="Strengths"
        prompt="What's well-written?"
        required={feedbackPriority === 'strengths'}
      />
    </StructuredSections>
  </CommentSidebar>
</CodeReviewMode>
```

#### Code-Specific Data Structure

```typescript
interface LineComment {
  id: string;
  filename: string;
  lineNumber: number;
  type: 'bug' | 'suggestion' | 'question' | 'praise';
  text: string;
  severity?: 'low' | 'medium' | 'high'; // For bugs
  created_at: string;
}

interface CodeReviewSubmission {
  slot_id: number;
  rating: number;
  line_comments: LineComment[];
  sections: StructuredSection[];
  attachments?: File[];
}
```

---

### Mode 3: Writing Reviews (Articles, Documentation, Copy)

**Content Types**: `writing`
**Primary Interaction**: Paragraph-level highlights and inline comments

#### UI Components

```typescript
<WritingReviewMode>
  {/* Document Viewer with Highlights */}
  <DocumentViewer
    content={documentText}
    format={documentFormat} // markdown, plain, pdf
  >
    <TextRenderer />
    <HighlightOverlay selections={highlights} />
    <InlineCommentMarkers />
  </DocumentViewer>

  {/* Highlight Tool */}
  <HighlightToolbar>
    <Button onClick={() => enableHighlightMode('issue')}>
      Highlight Issue
    </Button>
    <Button onClick={() => enableHighlightMode('suggestion')}>
      Highlight Suggestion
    </Button>
    <Button onClick={() => addInlineComment()}>
      Add Comment
    </Button>
  </HighlightToolbar>

  {/* Structured Sections */}
  <WritingSections>
    <Section
      id="clarity"
      label="Clarity & Readability"
      prompt="How clear and understandable is the writing?"
      required={true}
    />
    <Section
      id="structure"
      label="Structure & Flow"
      prompt="Does the content flow logically?"
      required={true}
    />
    <Section
      id="grammar"
      label="Grammar & Style"
      prompt="Assess language quality and consistency"
      required={feedbackPriority === 'improvements'}
    />
    <Section
      id="strengths"
      label="Strong Points"
      prompt="What works well in this writing?"
      required={feedbackPriority === 'strengths'}
    />
    <Section
      id="audience"
      label="Audience Fit"
      prompt="Does this resonate with the target audience?"
      required={tier === 'deep_dive'}
    />
  </WritingSections>
</WritingReviewMode>
```

#### Writing-Specific Data Structure

```typescript
interface TextHighlight {
  id: string;
  startOffset: number;
  endOffset: number;
  highlightedText: string;
  type: 'issue' | 'suggestion' | 'praise' | 'question';
  comment: string;
  created_at: string;
}
```

---

### Mode 4: Video Reviews

**Content Types**: `video`
**Primary Interaction**: Timestamp-based annotations

#### UI Components

```typescript
<VideoReviewMode>
  {/* Video Player */}
  <VideoPlayer
    src={videoFile}
    currentTime={currentTime}
    onTimeUpdate={setCurrentTime}
  >
    <TimelineMarkers markers={timestampComments} />
    <PlaybackControls />
    <TimestampButton
      onClick={() => addTimestampComment(currentTime)}
    />
  </VideoPlayer>

  {/* Timeline Comments */}
  <TimestampCommentsList>
    {timestampComments.map(comment => (
      <TimestampComment
        timestamp={comment.timestamp}
        type={comment.type}
        text={comment.text}
        onJumpTo={() => seekTo(comment.timestamp)}
      />
    ))}
  </TimestampCommentsList>

  {/* Overall Sections */}
  <VideoSections>
    <Section
      id="editing"
      label="Editing & Pacing"
      prompt="Evaluate cuts, transitions, and flow"
      required={true}
    />
    <Section
      id="visual"
      label="Visual Quality"
      prompt="Assess composition, color, lighting"
      required={tier !== 'quick'}
    />
    <Section
      id="audio"
      label="Audio Quality"
      prompt="Evaluate sound, music, voiceover"
      required={tier !== 'quick'}
    />
    <Section
      id="content"
      label="Content & Message"
      prompt="Does the video achieve its purpose?"
      required={true}
    />
  </VideoSections>
</VideoReviewMode>
```

#### Video-Specific Data Structure

```typescript
interface TimestampComment {
  id: string;
  timestamp: number; // seconds
  formattedTime: string; // "01:23"
  type: 'issue' | 'suggestion' | 'praise' | 'question';
  text: string;
  created_at: string;
}
```

---

### Mode 5: Audio Reviews (Podcasts, Music, Voiceovers)

**Content Types**: `audio`
**Primary Interaction**: Timestamp markers with waveform visualization

#### UI Components

```typescript
<AudioReviewMode>
  {/* Waveform Viewer */}
  <WaveformViewer
    src={audioFile}
    markers={timestampComments}
    onMarkerAdd={(time) => addAudioComment(time)}
  >
    <Waveform />
    <PlayheadIndicator />
    <MarkerIndicators />
  </WaveformViewer>

  <AudioControls>
    <PlayPauseButton />
    <SeekBar />
    <VolumeControl />
    <AddMarkerButton onClick={() => addMarkerAtCurrentTime()} />
  </AudioControls>

  {/* Audio Sections */}
  <AudioSections>
    <Section
      id="quality"
      label="Audio Quality"
      prompt="Assess clarity, volume, and production quality"
      required={true}
    />
    <Section
      id="content"
      label="Content & Delivery"
      prompt="Evaluate the message and presentation"
      required={true}
    />
    <Section
      id="music"
      label="Music & Sound Design"
      prompt="Comment on background music, effects, and mixing"
      required={tier !== 'quick'}
    />
    <Section
      id="pacing"
      label="Pacing & Flow"
      prompt="Does the audio maintain engagement?"
      required={tier === 'deep_dive'}
    />
  </AudioSections>
</AudioReviewMode>
```

---

## Unified Data Schema for Structured Feedback

### Backend Database Schema

```python
# In review_slot.py model
class ReviewSlotSubmission(BaseModel):
    """Stores the submitted review with structured data"""

    # Basic fields
    slot_id: int
    reviewer_id: int
    rating: int  # 1-5 stars
    submitted_at: datetime

    # NEW: Structured feedback sections
    feedback_sections: List[FeedbackSection]  # JSON column

    # NEW: Context-specific annotations
    annotations: List[Annotation]  # JSON column

    # Legacy support
    review_text: Optional[str]  # Auto-generated summary from sections

    # Files
    attachment_ids: List[int]


class FeedbackSection(BaseModel):
    """Individual feedback section (e.g., 'Strengths', 'Issues')"""
    section_id: str  # "strengths", "issues", "architecture"
    section_label: str  # "Strengths", "Issues Noticed"
    content: str  # The actual feedback text
    word_count: int
    required: bool
    created_at: datetime


class Annotation(BaseModel):
    """Context-specific annotation (pin, timestamp, highlight, line comment)"""
    annotation_id: str
    annotation_type: Literal['pin', 'timestamp', 'highlight', 'line_comment']

    # For pins (design/art)
    x: Optional[float]  # 0-1 normalized
    y: Optional[float]  # 0-1 normalized
    file_id: Optional[int]

    # For timestamps (video/audio)
    timestamp: Optional[float]  # seconds

    # For highlights (writing)
    start_offset: Optional[int]
    end_offset: Optional[int]
    highlighted_text: Optional[str]

    # For line comments (code)
    filename: Optional[str]
    line_number: Optional[int]

    # Common fields
    feedback_type: Literal['issue', 'suggestion', 'praise', 'question']
    comment: str
    severity: Optional[Literal['low', 'medium', 'high']]
    created_at: datetime
```

### Migration Strategy

```sql
-- Add new columns to review_slot table
ALTER TABLE review_slot ADD COLUMN feedback_sections JSONB;
ALTER TABLE review_slot ADD COLUMN annotations JSONB;

-- Keep review_text for backward compatibility
-- Auto-populate review_text from feedback_sections on submit:
-- review_text = concat(all section.content with headers)
```

### API Request/Response Examples

**Submit Design Review**:
```json
POST /api/v1/review-slots/142/submit
{
  "rating": 4,
  "feedback_sections": [
    {
      "section_id": "issues",
      "section_label": "Issues Noticed",
      "content": "The color contrast in the header fails WCAG AA standards...",
      "word_count": 234,
      "required": true
    },
    {
      "section_id": "suggestions",
      "section_label": "Suggestions & Fixes",
      "content": "I recommend using #2563EB instead of #3B82F6 for better contrast...",
      "word_count": 312,
      "required": true
    }
  ],
  "annotations": [
    {
      "annotation_id": "pin-1",
      "annotation_type": "pin",
      "x": 0.34,
      "y": 0.15,
      "file_id": 567,
      "feedback_type": "issue",
      "comment": "Logo alignment is off by 3px",
      "severity": "low"
    },
    {
      "annotation_id": "pin-2",
      "annotation_type": "pin",
      "x": 0.62,
      "y": 0.48,
      "file_id": 567,
      "feedback_type": "suggestion",
      "comment": "Consider using a card component here instead of a list"
    }
  ],
  "attachments": [123, 456]
}
```

**Submit Code Review**:
```json
POST /api/v1/review-slots/143/submit
{
  "rating": 5,
  "feedback_sections": [
    {
      "section_id": "architecture",
      "section_label": "Code Architecture",
      "content": "The component structure follows React best practices...",
      "word_count": 187
    },
    {
      "section_id": "quality",
      "section_label": "Code Quality",
      "content": "Code is clean and well-documented...",
      "word_count": 245
    }
  ],
  "annotations": [
    {
      "annotation_id": "line-1",
      "annotation_type": "line_comment",
      "filename": "src/components/Button.tsx",
      "line_number": 23,
      "feedback_type": "bug",
      "comment": "Missing null check for onClick handler",
      "severity": "high"
    },
    {
      "annotation_id": "line-2",
      "annotation_type": "line_comment",
      "filename": "src/utils/helpers.ts",
      "line_number": 45,
      "feedback_type": "suggestion",
      "comment": "Consider using a Map instead of an object for better performance"
    }
  ]
}
```

---

## Component Architecture

### Top-Level Component Hierarchy

```typescript
<SmartReviewEditor
  slotId={slotId}
  reviewRequest={reviewRequest}
  initialDraft={initialDraft}
>
  {/* 1. Mode Selector (determines which mode to render) */}
  <ModeSelector
    contentType={reviewRequest.content_type}
    feedbackPriority={reviewRequest.feedback_priority}
    reviewTier={reviewRequest.review_tier}
  >
    {mode === 'design' && <DesignReviewMode {...props} />}
    {mode === 'code' && <CodeReviewMode {...props} />}
    {mode === 'writing' && <WritingReviewMode {...props} />}
    {mode === 'video' && <VideoReviewMode {...props} />}
    {mode === 'audio' && <AudioReviewMode {...props} />}
    {mode === 'fallback' && <GenericReviewMode {...props} />}
  </ModeSelector>
</SmartReviewEditor>
```

### Shared Components (Cross-Mode)

```typescript
// Used by all modes
<StructuredSectionEditor
  sections={sections}
  onSectionUpdate={handleSectionUpdate}
  tierRequirements={getTierRequirements(reviewTier)}
/>

<RatingSelector
  rating={rating}
  onChange={setRating}
  required={true}
/>

<FileAttachments
  files={attachments}
  onUpload={handleUpload}
  onRemove={handleRemove}
/>

<ReviewProgress
  sections={sections}
  annotations={annotations}
  rating={rating}
  completionPercent={calculateCompletion()}
/>

<SubmitButton
  disabled={!isValid()}
  onSubmit={handleSubmit}
/>
```

### Mode-Specific Components

**Design Mode**:
- `ImageViewer` - Display images with zoom/pan
- `PinOverlay` - SVG or DOM-based pin markers
- `PinToolbar` - Pin type selector and placement controls
- `PinList` - Sidebar list of all pins

**Code Mode**:
- `FileExplorer` - Tree view of code files
- `CodeViewer` - Syntax-highlighted code display
- `LineCommentMarker` - Click-to-comment on specific lines
- `CommentSidebar` - List of line comments

**Writing Mode**:
- `DocumentViewer` - Render markdown/text/PDF
- `HighlightTool` - Text selection and highlighting
- `InlineCommentMarker` - Comments on highlighted text

**Video/Audio Mode**:
- `VideoPlayer` / `AudioPlayer` - Playback controls
- `Timeline` / `Waveform` - Visual representation
- `TimestampMarker` - Click to add timestamp comment
- `TimestampList` - List of all timestamp comments

---

## Tier-Based Requirements

### Quick Feedback ($5-15)

**Expectations**:
- **Total word count**: 200-500 words
- **Sections required**: 2 minimum
- **Annotations**: Optional (nice-to-have)
- **Turnaround**: 24-48 hours
- **Depth**: Surface-level, quick wins

**Example Sections (Design + Balanced)**:
```typescript
[
  { id: "first-impression", label: "First Impression", required: true, minWords: 100 },
  { id: "quick-wins", label: "Quick Wins", required: true, minWords: 100 },
  { id: "overall", label: "Overall Rating", required: false }
]
```

---

### Standard Review ($25-75)

**Expectations**:
- **Total word count**: 500-1000 words
- **Sections required**: 3-4
- **Annotations**: Encouraged (5-10 pins/comments)
- **Turnaround**: 3-5 days
- **Depth**: Thorough analysis

**Example Sections (Code + Improvements)**:
```typescript
[
  { id: "architecture", label: "Architecture Review", required: true, minWords: 150 },
  { id: "code-quality", label: "Code Quality", required: true, minWords: 150 },
  { id: "bugs", label: "Potential Issues", required: true, minWords: 150 },
  { id: "suggestions", label: "Improvement Suggestions", required: true, minWords: 150 }
]
```

---

### Deep Dive Analysis ($100-200+)

**Expectations**:
- **Total word count**: 1000+ words
- **Sections required**: 5-7
- **Annotations**: Required (10+ detailed annotations)
- **Turnaround**: 5-7 days
- **Depth**: Comprehensive, strategic

**Example Sections (Design + Balanced)**:
```typescript
[
  { id: "strengths", label: "Strengths Analysis", required: true, minWords: 200 },
  { id: "usability", label: "Usability Assessment", required: true, minWords: 200 },
  { id: "accessibility", label: "Accessibility Review", required: true, minWords: 150 },
  { id: "visual-design", label: "Visual Design Critique", required: true, minWords: 150 },
  { id: "improvements", label: "Strategic Improvements", required: true, minWords: 200 },
  { id: "next-steps", label: "Recommended Next Steps", required: true, minWords: 150 },
  { id: "overall", label: "Executive Summary", required: true, minWords: 100 }
]
```

---

## Section Configuration System

### Section Registry (Backend)

```python
# backend/app/config/review_sections.py

from typing import List, Dict
from enum import Enum

class ContentType(str, Enum):
    DESIGN = "design"
    CODE = "code"
    WRITING = "writing"
    VIDEO = "video"
    AUDIO = "audio"
    ART = "art"

class FeedbackPriority(str, Enum):
    STRENGTHS = "strengths"
    IMPROVEMENTS = "improvements"
    BALANCED = "balanced"

class ReviewTier(str, Enum):
    QUICK = "quick_feedback"
    STANDARD = "standard"
    DEEP = "deep_dive"

SECTION_TEMPLATES = {
    # Design + Improvements + Standard
    ("design", "improvements", "standard"): [
        {
            "id": "issues",
            "label": "Issues Noticed",
            "prompt": "What problems or mistakes did you identify in this design?",
            "placeholder": "List specific issues with layout, spacing, color, typography...",
            "required": True,
            "min_words": 150,
            "order": 1
        },
        {
            "id": "suggestions",
            "label": "Suggestions & Fixes",
            "prompt": "How would you improve this design?",
            "placeholder": "Provide actionable recommendations with specific examples...",
            "required": True,
            "min_words": 150,
            "order": 2
        },
        {
            "id": "strengths",
            "label": "Strengths",
            "prompt": "What works well in this design?",
            "placeholder": "Highlight positive aspects...",
            "required": False,
            "min_words": 50,
            "order": 3
        }
    ],

    # Code + Balanced + Deep Dive
    ("code", "balanced", "deep_dive"): [
        {
            "id": "architecture",
            "label": "Architecture & Structure",
            "prompt": "Evaluate the overall code organization and design patterns",
            "required": True,
            "min_words": 200,
            "order": 1
        },
        {
            "id": "strengths",
            "label": "Code Strengths",
            "prompt": "What is well-implemented?",
            "required": True,
            "min_words": 150,
            "order": 2
        },
        {
            "id": "quality",
            "label": "Code Quality",
            "prompt": "Assess readability, maintainability, and best practices",
            "required": True,
            "min_words": 200,
            "order": 3
        },
        {
            "id": "bugs",
            "label": "Issues & Vulnerabilities",
            "prompt": "Identify bugs, edge cases, security concerns",
            "required": True,
            "min_words": 150,
            "order": 4
        },
        {
            "id": "performance",
            "label": "Performance Considerations",
            "prompt": "Analyze efficiency and optimization opportunities",
            "required": True,
            "min_words": 150,
            "order": 5
        },
        {
            "id": "testing",
            "label": "Testing & Error Handling",
            "prompt": "Review test coverage and error handling strategies",
            "required": True,
            "min_words": 150,
            "order": 6
        },
        {
            "id": "recommendations",
            "label": "Strategic Recommendations",
            "prompt": "Long-term improvements and architectural suggestions",
            "required": True,
            "min_words": 200,
            "order": 7
        }
    ],

    # Add more combinations...
}

def get_sections(
    content_type: ContentType,
    feedback_priority: FeedbackPriority,
    review_tier: ReviewTier
) -> List[Dict]:
    """
    Get appropriate sections based on context.
    Falls back to default if exact match not found.
    """
    key = (content_type, feedback_priority, review_tier)

    # Try exact match
    if key in SECTION_TEMPLATES:
        return SECTION_TEMPLATES[key]

    # Try without tier (use default tier)
    key_no_tier = (content_type, feedback_priority, "standard")
    if key_no_tier in SECTION_TEMPLATES:
        sections = SECTION_TEMPLATES[key_no_tier]
        # Adjust word counts based on tier
        return adjust_for_tier(sections, review_tier)

    # Fallback to generic
    return get_generic_sections(content_type, review_tier)
```

### API Endpoint for Section Templates

```python
# backend/app/api/v1/endpoints/review_slots.py

@router.get("/review-slots/{slot_id}/sections")
async def get_review_sections(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the appropriate section template for this review slot.
    Returns structured sections based on content type, priority, tier.
    """
    # Fetch slot and review request
    slot = await db.get(ReviewSlot, slot_id)
    review = await db.get(ReviewRequest, slot.review_request_id)

    # Get sections from template
    sections = get_sections(
        content_type=review.content_type,
        feedback_priority=review.feedback_priority,
        review_tier=review.review_tier
    )

    # Check if there's a saved draft
    if slot.draft_sections:
        # Merge draft content into section templates
        sections = merge_draft_content(sections, slot.draft_sections)

    return {
        "sections": sections,
        "context": {
            "content_type": review.content_type,
            "feedback_priority": review.feedback_priority,
            "review_tier": review.review_tier,
            "min_total_words": calculate_min_words(sections),
            "has_draft": bool(slot.draft_sections)
        }
    }
```

---

## Frontend Component Implementation

### Main Smart Editor Component

```typescript
// frontend/components/reviewer/smart-review-editor.tsx

"use client";

import * as React from "react";
import { ReviewRequestDetail } from "@/lib/api/reviews";
import { ReviewTier, FeedbackPriority, ContentType } from "@/lib/types";
import { DesignReviewMode } from "./modes/design-review-mode";
import { CodeReviewMode } from "./modes/code-review-mode";
import { WritingReviewMode } from "./modes/writing-review-mode";
import { VideoReviewMode } from "./modes/video-review-mode";
import { AudioReviewMode } from "./modes/audio-review-mode";
import { GenericReviewMode } from "./modes/generic-review-mode";

interface SmartReviewEditorProps {
  slotId: number;
  reviewRequest: ReviewRequestDetail;
  initialDraft?: ReviewDraft;
  onSubmitSuccess?: () => void;
}

export function SmartReviewEditor({
  slotId,
  reviewRequest,
  initialDraft,
  onSubmitSuccess
}: SmartReviewEditorProps) {

  // Determine which mode to render
  const mode = determineReviewMode(reviewRequest.content_type);

  // Shared props for all modes
  const sharedProps = {
    slotId,
    reviewRequest,
    initialDraft,
    onSubmitSuccess,
    contentType: reviewRequest.content_type,
    feedbackPriority: reviewRequest.feedback_priority,
    reviewTier: reviewRequest.review_tier
  };

  return (
    <div className="smart-review-editor">
      {mode === 'design' && <DesignReviewMode {...sharedProps} />}
      {mode === 'code' && <CodeReviewMode {...sharedProps} />}
      {mode === 'writing' && <WritingReviewMode {...sharedProps} />}
      {mode === 'video' && <VideoReviewMode {...sharedProps} />}
      {mode === 'audio' && <AudioReviewMode {...sharedProps} />}
      {mode === 'generic' && <GenericReviewMode {...sharedProps} />}
    </div>
  );
}

function determineReviewMode(contentType: ContentType): ReviewMode {
  switch (contentType) {
    case 'design':
    case 'art':
      return 'design';
    case 'code':
      return 'code';
    case 'writing':
      return 'writing';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    default:
      return 'generic';
  }
}
```

### Shared Section Editor Component

```typescript
// frontend/components/reviewer/structured-section-editor.tsx

"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FeedbackSection {
  id: string;
  label: string;
  prompt: string;
  placeholder?: string;
  required: boolean;
  min_words: number;
  order: number;
}

interface StructuredSectionEditorProps {
  sections: FeedbackSection[];
  values: Record<string, string>; // section_id -> content
  onChange: (sectionId: string, content: string) => void;
  errors: Record<string, string>; // section_id -> error message
}

export function StructuredSectionEditor({
  sections,
  values,
  onChange,
  errors
}: StructuredSectionEditorProps) {

  const sortedSections = sections.sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {sortedSections.map((section) => {
        const content = values[section.id] || "";
        const wordCount = countWords(content);
        const isValid = !section.required || wordCount >= section.min_words;

        return (
          <div key={section.id} className="space-y-2">
            <Label
              htmlFor={section.id}
              className="text-base font-semibold"
            >
              {section.label}
              {section.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>

            <p className="text-sm text-gray-600">
              {section.prompt}
            </p>

            <Textarea
              id={section.id}
              value={content}
              onChange={(e) => onChange(section.id, e.target.value)}
              placeholder={section.placeholder}
              className={cn(
                "min-h-[150px]",
                errors[section.id] && "border-red-500"
              )}
            />

            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "font-medium",
                isValid ? "text-green-600" : "text-gray-500"
              )}>
                {wordCount} / {section.min_words} words
                {isValid && " ✓"}
              </span>

              {errors[section.id] && (
                <span className="text-red-500">
                  {errors[section.id]}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
```

---

## Implementation Phases

### Phase 1: Foundation (MVP) - 2-3 weeks

**Goal**: Get structured sections working for all content types

**Tasks**:
1. ✅ Backend section template system
   - `review_sections.py` config
   - `GET /review-slots/{id}/sections` endpoint
   - Section-based validation on submit
2. ✅ Database schema updates
   - Add `feedback_sections` JSONB column
   - Add `annotations` JSONB column
   - Migration script
3. ✅ Frontend structured section editor
   - `StructuredSectionEditor` component
   - Word count validation
   - Required/optional logic
4. ✅ Integrate into existing review editor
   - Replace single textarea with sections
   - Auto-save draft sections
   - Submit with structured data

**Deliverable**: All reviews use structured sections (no annotations yet)

---

### Phase 2: Design Mode with Pins - 2-3 weeks

**Goal**: Visual pin annotations for design reviews

**Tasks**:
1. ✅ Pin placement UI
   - Image viewer with zoom/pan (`react-zoom-pan-pinch`)
   - Click-to-place pins
   - Pin type selector (issue, suggestion, praise, question)
2. ✅ Pin data management
   - Pin state management
   - Normalized coordinates (0-1 range)
   - Save pins in `annotations` array
3. ✅ Pin sidebar
   - List view of all pins
   - Jump to pin on image
   - Edit/delete pins
4. ✅ Backend support
   - Store pins in `annotations` JSON
   - Validate pin structure
   - Return pins in slot response

**Deliverable**: Design reviews have full pin annotation capability

---

### Phase 3: Code Mode with Line Comments - 2-3 weeks

**Goal**: Line-level annotations for code reviews

**Tasks**:
1. ✅ Code viewer
   - Syntax highlighting (`react-syntax-highlighter`)
   - Line numbers
   - File explorer for multiple files
2. ✅ Line comment UI
   - Click line number to add comment
   - Comment type selector
   - Severity indicator for bugs
3. ✅ Line comment data
   - Store in `annotations` with filename + line_number
   - Link comments to specific files
4. ✅ File handling
   - Support .zip uploads
   - Extract and display code files
   - Downloadable code with annotations

**Deliverable**: Code reviews have inline commenting

---

### Phase 4: Writing/Video/Audio Modes - 3-4 weeks

**Goal**: Specialized modes for other content types

**Tasks**:
1. ✅ Writing mode
   - Text highlight tool
   - Inline comments on selections
   - Store start/end offsets
2. ✅ Video mode
   - Video player integration
   - Timestamp markers on timeline
   - Jump-to-timestamp functionality
3. ✅ Audio mode
   - Waveform visualization (`wavesurfer.js`)
   - Timestamp markers on waveform
   - Playback controls

**Deliverable**: All content types have appropriate annotation tools

---

### Phase 5: AI Assistance (Optional) - 2-3 weeks

**Goal**: AI-powered review helpers

**Tasks**:
1. ✅ AI prompt suggestions
   - Suggest what to write in each section
   - "Expand on this point" helper
2. ✅ Auto-fill starter sentences
   - Generate opening sentences for sections
   - Provide examples
3. ✅ Completeness checker
   - Flag missing sections
   - Suggest additional feedback areas
4. ✅ Quality scoring
   - Estimate review quality based on depth
   - Suggest improvements

**Deliverable**: AI-enhanced review writing experience

---

## Success Metrics

### Reviewer Experience
- ⬆️ 30%+ increase in average review word count
- ⬆️ 50%+ increase in actionable feedback items (pins, line comments)
- ⬆️ 40%+ reduction in "unclear feedback" complaints
- ⬆️ 25%+ faster review writing time (due to guidance)

### Creator Experience
- ⬆️ 60%+ increase in "very satisfied" ratings
- ⬆️ 45%+ increase in reviews marked as "helpful"
- ⬆️ 35%+ increase in paid review conversions
- ⬆️ 50%+ increase in repeat customers

### Platform Quality
- ⬆️ 40%+ increase in average review rating (4+ stars)
- ⬇️ 50%+ reduction in review rejections
- ⬆️ 30%+ increase in reviews with 5+ annotations
- ⬆️ 25%+ increase in Deep Dive tier usage

---

## Open Questions & Decisions Needed

### 1. AI Integration
- **Question**: Should AI assistance be tier-gated (only for Standard/Deep)?
- **Options**:
  - A) Free for all reviewers
  - B) Only Standard/Deep reviewers
  - C) Optional paid add-on
- **Recommendation**: Start with B, test C later

### 2. Annotation Requirements
- **Question**: Should pins/annotations be required for paid reviews?
- **Options**:
  - A) Always optional
  - B) Required for Design/Code on Standard/Deep tiers
  - C) Minimum count based on tier (e.g., 5 pins for Standard, 10 for Deep)
- **Recommendation**: C - minimum count based on tier

### 3. Section Template Flexibility
- **Question**: Can reviewers add custom sections?
- **Options**:
  - A) Fixed sections only
  - B) Allow adding custom sections
  - C) Suggest additional sections but don't allow free-form
- **Recommendation**: A for MVP, B in Phase 5

### 4. Mobile Experience
- **Question**: How do pin annotations work on mobile?
- **Options**:
  - A) Full feature parity (tap-to-place)
  - B) Simplified mode (no pins, just sections)
  - C) Read-only on mobile, require desktop for submission
- **Recommendation**: A - tap to place pins works well on mobile

### 5. Video/Audio Storage
- **Question**: How to handle large video/audio files?
- **Options**:
  - A) Store on our servers (expensive)
  - B) Require external hosting (YouTube, Vimeo, SoundCloud)
  - C) Hybrid: small files on-server, large files external
- **Recommendation**: C - up to 100MB on-server, else external links

---

## Next Steps

1. **Team Review**: Discuss this spec and get buy-in
2. **Design Mockups**: Create high-fidelity mockups for each mode
3. **Database Migration**: Plan and execute schema changes
4. **Backend Implementation**: Build section template system + API
5. **Frontend Prototyping**: Build DesignReviewMode as proof-of-concept
6. **User Testing**: Test with 5-10 reviewers, gather feedback
7. **Iterate**: Refine based on feedback
8. **Roll Out**: Phase 1 → Phase 2 → Phase 3 → Phase 4

---

**Document Status**: Draft for Team Discussion
**Next Milestone**: Team approval + design mockups
**Estimated Timeline**: 10-14 weeks for all phases
