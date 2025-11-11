# File Upload System - Flow Diagram

Visual representation of the complete file upload system architecture and data flow.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Next.js Frontend (Port 3000)                   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  Review Flow: /app/review/new/page.tsx          │   │  │
│  │  │                                                   │   │  │
│  │  │  Step 1: Content Type                            │   │  │
│  │  │  Step 2: Basic Info → Creates Draft Review       │   │  │
│  │  │  Step 3: File Upload ← NEW                       │   │  │
│  │  │  Step 4: Review Type                             │   │  │
│  │  │  Step 5: Submit                                  │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │              │                                             │  │
│  │              ▼                                             │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  File Upload Component                            │   │  │
│  │  │  /components/review-flow/file-upload-step.tsx    │   │  │
│  │  │                                                   │   │  │
│  │  │  • Drag & Drop                                   │   │  │
│  │  │  • Click to Browse                               │   │  │
│  │  │  • Paste from Clipboard                          │   │  │
│  │  │  • Mobile Camera                                 │   │  │
│  │  │  • External Links                                │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │              │                                             │  │
│  │              ▼                                             │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  File Upload UI Component                         │   │  │
│  │  │  /components/ui/file-upload.tsx                  │   │  │
│  │  │                                                   │   │  │
│  │  │  • Visual Feedback                               │   │  │
│  │  │  • Progress Tracking                             │   │  │
│  │  │  • File Previews                                 │   │  │
│  │  │  • Error Display                                 │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │              │                                             │  │
│  │              ▼                                             │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  File API Client                                  │   │  │
│  │  │  /lib/api/files.ts                               │   │  │
│  │  │                                                   │   │  │
│  │  │  uploadFile(reviewId, file, onProgress)          │   │  │
│  │  │  uploadFiles(reviewId, files, onProgress)        │   │  │
│  │  │  getReviewFiles(reviewId)                        │   │  │
│  │  │  deleteFile(reviewId, fileId)                    │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │ (multipart/form-data)
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                  FastAPI Backend (Port 8000)                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  File Upload Router                                   │    │
│  │  /app/api/v1/files.py                                │    │
│  │                                                        │    │
│  │  POST   /api/v1/reviews/{id}/files                   │    │
│  │  POST   /api/v1/reviews/{id}/files/batch             │    │
│  │  GET    /api/v1/reviews/{id}/files                   │    │
│  │  DELETE /api/v1/reviews/{id}/files/{file_id}         │    │
│  │                                                        │    │
│  │  • Authentication (JWT)                               │    │
│  │  • Authorization (Ownership)                          │    │
│  │  • State Validation (Draft/Pending)                  │    │
│  └──────────────────────────────────────────────────────┘    │
│              │                                                 │
│              ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  File Utilities                                       │    │
│  │  /app/utils/file_utils.py                            │    │
│  │                                                        │    │
│  │  1. validate_file_type()    - Magic number check     │    │
│  │  2. validate_file_size()    - Size limit check       │    │
│  │  3. generate_unique_filename() - UUID naming         │    │
│  │  4. calculate_file_hash()   - SHA-256 hash           │    │
│  │  5. save_uploaded_file()    - Write to disk          │    │
│  │  6. create_thumbnail()      - Generate preview       │    │
│  │  7. process_upload()        - Complete pipeline      │    │
│  └──────────────────────────────────────────────────────┘    │
│              │                                                 │
│              ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  File Storage                                         │    │
│  │  /home/user/Critvue/backend/uploads/                 │    │
│  │                                                        │    │
│  │  • design/                                            │    │
│  │  • code/                                              │    │
│  │  • video/                                             │    │
│  │  • audio/                                             │    │
│  │  • writing/                                           │    │
│  │  • art/                                               │    │
│  │                                                        │    │
│  │  Files: UUID-based naming                            │    │
│  │  Thumbnails: thumb_UUID.jpg                          │    │
│  └──────────────────────────────────────────────────────┘    │
│              │                                                 │
│              ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Database Models (PostgreSQL)                         │    │
│  │  /app/models/review_file.py                          │    │
│  │                                                        │    │
│  │  review_files table:                                  │    │
│  │  ├─ id                                                │    │
│  │  ├─ review_request_id (FK)                           │    │
│  │  ├─ filename (UUID)                                  │    │
│  │  ├─ original_filename                                │    │
│  │  ├─ file_size                                        │    │
│  │  ├─ file_type (MIME)                                 │    │
│  │  ├─ file_path                                        │    │
│  │  ├─ file_url                                         │    │
│  │  ├─ content_hash (SHA-256)                           │    │
│  │  └─ uploaded_at                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Static File Serving                                  │    │
│  │  GET /files/{content_type}/{filename}                │    │
│  │                                                        │    │
│  │  Serves uploaded files directly                       │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Upload Flow Sequence

```
User                Frontend              Backend              Storage        Database
 │                     │                     │                    │               │
 │   Select File       │                     │                    │               │
 │────────────────────>│                     │                    │               │
 │                     │                     │                    │               │
 │                     │  Client Validation  │                    │               │
 │                     │  (Type, Size)       │                    │               │
 │                     │                     │                    │               │
 │   Upload            │  POST /files        │                    │               │
 │────────────────────>│────────────────────>│                    │               │
 │                     │                     │                    │               │
 │                     │                     │  Validate Type     │               │
 │                     │                     │  (Magic Numbers)   │               │
 │                     │                     │                    │               │
 │                     │                     │  Validate Size     │               │
 │                     │                     │                    │               │
 │                     │                     │  Generate UUID     │               │
 │                     │                     │                    │               │
 │                     │                     │  Calculate Hash    │               │
 │                     │                     │                    │               │
 │                     │                     │  Save File         │               │
 │                     │                     │───────────────────>│               │
 │                     │                     │                    │               │
 │                     │                     │  Create Thumbnail  │               │
 │                     │                     │───────────────────>│               │
 │                     │                     │                    │               │
 │                     │                     │  Save Metadata     │               │
 │                     │                     │───────────────────────────────────>│
 │                     │                     │                    │               │
 │                     │  Progress: 100%     │                    │               │
 │<────────────────────│<────────────────────│                    │               │
 │                     │                     │                    │               │
 │   View File         │  GET /files/...     │                    │               │
 │────────────────────>│────────────────────>│  Serve File        │               │
 │                     │                     │<───────────────────│               │
 │<────────────────────│<────────────────────│                    │               │
```

## Review Flow Integration

```
┌───────────────────────────────────────────────────────────────┐
│                     5-STEP REVIEW FLOW                         │
└───────────────────────────────────────────────────────────────┘

Step 1: Content Type Selection
┌──────────────────────────────────────┐
│  Select content type:                 │
│  ○ Design  ○ Code   ○ Video          │
│  ○ Audio   ○ Writing ○ Art           │
└──────────────────────────────────────┘
         │
         ▼
Step 2: Basic Info
┌──────────────────────────────────────┐
│  Title: ___________________________  │
│  Description: ____________________   │
│  ________________________________    │
│  ________________________________    │
│                                       │
│  [Continue] ──────────────────────>  │
│  Creates draft review in database    │
└──────────────────────────────────────┘
         │
         ▼
Step 3: File Upload ★ NEW ★
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐ │
│  │  Drag & Drop Files Here        │ │
│  │  or click to browse            │ │
│  └────────────────────────────────┘ │
│                                       │
│  Uploaded Files:                     │
│  ├─ design_mockup.png [████████] 100%│
│  ├─ wireframe.pdf    [████████] 100%│
│  └─ logo.svg         [████████] 100%│
│                                       │
│  External Links:                     │
│  └─ https://figma.com/...            │
└──────────────────────────────────────┘
         │
         ▼
Step 4: Review Type Selection
┌──────────────────────────────────────┐
│  Choose review type:                  │
│  ● Free (AI + Community)             │
│  ○ Expert ($XX)                      │
└──────────────────────────────────────┘
         │
         ▼
Step 5: Review & Submit
┌──────────────────────────────────────┐
│  Content Type: Design                 │
│  Title: My Mobile App Design         │
│  Files: 3 files, 1 link              │
│  Review Type: Free                    │
│                                       │
│  [Submit Request]                     │
└──────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                │
└─────────────────────────────────────────────────────────────────┘

User Action              Frontend State           Backend Action         Storage
───────────             ─────────────────        ────────────────       ─────────

Select Content Type
  ↓                      contentType: "design"
  ↓
Enter Title/Description
  ↓                      title: "..."
  ↓                      description: "..."
  ↓
Click Continue
  ↓                                               POST /reviews
  ↓                                               Create draft review
  ↓                      reviewId: 123            Return review ID
  ↓
Select File
  ↓                      file: File object
  ↓
Upload File
  ↓                                               POST /reviews/123/files
  ↓                                               Validate file
  ↓                                               Generate UUID           Write file
  ↓                                               Calculate hash          Write thumb
  ↓                      uploadedFiles: [...]     Insert to DB
  ↓                      progress: 100%
  ↓
View File
  ↓                                               GET /files/design/UUID  Read file
  ↓                      <img src="...">          Return file content
  ↓
Delete File
  ↓                                               DELETE /reviews/123/files/5
  ↓                                               Delete from DB          Delete file
  ↓                      uploadedFiles: []        Return 204
```

## Security Flow

```
┌────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
└────────────────────────────────────────────────────────────────┘

Layer 1: Authentication
  • JWT token required for all endpoints
  • Token validated on every request
  • Invalid token → 401 Unauthorized

Layer 2: Authorization
  • User must own the review
  • Verified via review_request.user_id
  • Not owner → 404 Not Found

Layer 3: State Validation
  • Files only uploadable to draft/pending reviews
  • Cannot modify completed/cancelled reviews
  • Wrong state → 400 Bad Request

Layer 4: File Type Validation
  • Check MIME type from client
  • Verify with magic numbers (actual file content)
  • Content-type specific allowed types
  • Invalid type → 400 Bad Request

Layer 5: File Size Validation
  • Content-type specific size limits
  • Server-side enforcement
  • Too large → 400 Bad Request

Layer 6: Filename Security
  • UUID-based unique naming
  • No user-provided paths
  • Sanitize original filename
  • Prevents path traversal attacks

Layer 7: Storage Security
  • Files stored outside web root
  • Organized by content type
  • No executable permissions
  • Served through controlled endpoint
```

## Error Handling Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                               │
└────────────────────────────────────────────────────────────────┘

Upload Attempt
     │
     ├─> No Auth Token ──────> 401 Unauthorized
     │                          └─> "Authentication required"
     │
     ├─> Invalid Token ─────────> 401 Unauthorized
     │                          └─> "Invalid authentication token"
     │
     ├─> Not Owner ─────────────> 404 Not Found
     │                          └─> "Review request not found"
     │
     ├─> Wrong State ───────────> 400 Bad Request
     │                          └─> "Cannot upload to completed review"
     │
     ├─> Invalid Type ──────────> 400 Bad Request
     │                          └─> "File type not allowed for design"
     │
     ├─> Too Large ─────────────> 400 Bad Request
     │                          └─> "File size exceeds 10MB limit"
     │
     ├─> Network Error ─────────> Retry with exponential backoff
     │                          └─> Display error to user
     │
     └─> Success ───────────────> 201 Created
                                └─> Return file metadata
```

## Component Hierarchy

```
┌────────────────────────────────────────────────────────────────┐
│                  FRONTEND COMPONENT TREE                        │
└────────────────────────────────────────────────────────────────┘

app/review/new/page.tsx (Main Flow)
│
├─ ContentTypeStep
│  └─ Content type grid
│
├─ BasicInfoStep
│  ├─ Input (title)
│  └─ Textarea (description)
│
├─ FileUploadStep ★ NEW ★
│  │
│  ├─ FileUpload (UI Component)
│  │  ├─ Drop zone
│  │  ├─ File input
│  │  ├─ Progress bars
│  │  └─ File previews
│  │
│  ├─ Link input
│  │  ├─ URL validation
│  │  └─ Link list
│  │
│  └─ Mobile camera button
│
├─ ReviewTypeStep
│  └─ Review type selection
│
└─ ReviewSubmitStep
   └─ Final review summary
```

## State Management

```
┌────────────────────────────────────────────────────────────────┐
│                     FORM STATE                                  │
└────────────────────────────────────────────────────────────────┘

FormState Interface:
{
  contentType: ContentType | null,      // Step 1
  title: string,                         // Step 2
  description: string,                   // Step 2
  reviewId: number | null,               // Created in Step 2
  uploadedFiles: UploadedFile[],         // Step 3 ★ NEW ★
  externalLinks: string[],               // Step 3 ★ NEW ★
  reviewType: ReviewType | null          // Step 4
}

UploadedFile Interface:
{
  file: File,                            // Original file object
  id: string,                            // Unique ID for tracking
  preview?: string,                      // Object URL for preview
  progress: number,                      // 0-100
  error?: string,                        // Error message if failed
  uploaded?: boolean                     // True when complete
}
```

## File Types Configuration

```
┌────────────────────────────────────────────────────────────────┐
│              CONTENT TYPE CONFIGURATIONS                        │
└────────────────────────────────────────────────────────────────┘

┌──────────┬──────────────────┬──────────────┬────────────────────┐
│ Content  │ Allowed Types    │ Max Size     │ Supported Platforms│
├──────────┼──────────────────┼──────────────┼────────────────────┤
│ Design   │ PNG, JPG, SVG,   │ 10 MB        │ Figma, Sketch,     │
│          │ WebP, GIF, PDF   │              │ Adobe, InVision    │
├──────────┼──────────────────┼──────────────┼────────────────────┤
│ Code     │ ZIP, TAR, GZIP,  │ 50 MB        │ GitHub, GitLab,    │
│          │ TXT              │              │ Bitbucket          │
├──────────┼──────────────────┼──────────────┼────────────────────┤
│ Video    │ MP4, MOV, AVI,   │ 100 MB       │ YouTube, Vimeo,    │
│          │ WebM, MKV        │              │ TikTok             │
├──────────┼──────────────────┼──────────────┼────────────────────┤
│ Audio    │ MP3, WAV, OGG,   │ 50 MB        │ SoundCloud,        │
│          │ AAC, WebM        │              │ Spotify            │
├──────────┼──────────────────┼──────────────┼────────────────────┤
│ Writing  │ PDF, DOC, DOCX,  │ 10 MB        │ Google Docs,       │
│          │ TXT, MD, RTF     │              │ Notion, Medium     │
├──────────┼──────────────────┼──────────────┼────────────────────┤
│ Art      │ PNG, JPG, WebP,  │ 10 MB        │ ArtStation,        │
│          │ SVG, GIF, PDF    │              │ DeviantArt         │
└──────────┴──────────────────┴──────────────┴────────────────────┘
```

## Performance Metrics

```
┌────────────────────────────────────────────────────────────────┐
│                   PERFORMANCE TARGETS                           │
└────────────────────────────────────────────────────────────────┘

Operation                   Target Time    Notes
───────────────────────    ─────────────  ──────────────────────
File validation             < 10ms         MIME + magic numbers
Unique filename generation  < 1ms          UUID generation
Hash calculation            ~50ms/MB       SHA-256
File save to disk           ~100ms/MB      I/O bound
Thumbnail generation        ~100ms         Image resize
Database insert             < 50ms         Async operation
Total (5MB image)           ~600ms         End-to-end
Batch upload (5 files)      ~2s            Parallel processing
```

---

This diagram provides a comprehensive visual overview of the entire file upload system architecture, data flow, and component interactions.
