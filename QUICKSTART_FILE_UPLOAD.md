# Quick Start - File Upload System

Get the file upload system running in 5 minutes.

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ installed
- PostgreSQL database running
- Backend and frontend repos cloned

## Backend Setup (2 minutes)

```bash
# 1. Navigate to backend
cd /home/user/Critvue/backend

# 2. Install Python dependencies (if not already done)
pip install -r requirements.txt

# 3. Create upload directories
mkdir -p uploads/{design,code,video,audio,writing,art}

# 4. Run test script to verify setup
python3 test_file_upload.py

# 5. Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend should now be running at http://localhost:8000

## Frontend Setup (1 minute)

```bash
# 1. Navigate to frontend (in a new terminal)
cd /home/user/Critvue/frontend

# 2. Verify environment variables
# Make sure .env.local has:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# 3. Install dependencies (if not already done)
npm install

# 4. Start the dev server
npm run dev
```

Frontend should now be running at http://localhost:3000

## Test the Upload System (2 minutes)

1. **Open browser**: http://localhost:3000/review/new

2. **Login** (if required)

3. **Step 1 - Select Content Type**: Click "Design"

4. **Step 2 - Enter Info**:
   - Title: "Test Upload"
   - Description: "Testing file uploads"
   - Click "Continue"

5. **Step 3 - Upload Files**:
   - Drag an image onto the upload area
   - OR click to browse and select a file
   - Watch the progress bar
   - See your file appear with thumbnail

6. **Complete Flow**:
   - Click "Continue"
   - Select "Free" review type
   - Click "Continue"
   - Review and "Submit Request"

## Verify Success

Check that files were saved:
```bash
ls -la /home/user/Critvue/backend/uploads/design/
```

You should see:
- Your uploaded file (with UUID name)
- A thumbnail file (thumb_*.jpg)

## Quick Test Commands

### Test file upload via API:
```bash
# Get auth token first (replace with your token)
TOKEN="your_jwt_token_here"

# Upload a file
curl -X POST http://localhost:8000/api/v1/reviews/1/files \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_image.png"
```

### Check API documentation:
http://localhost:8000/api/docs

### Run backend tests:
```bash
cd /home/user/Critvue/backend
python3 test_file_upload.py
```

## Common Issues

### Backend won't start
```bash
# Check if dependencies are installed
pip list | grep -E "fastapi|pillow|magic"

# If missing, install
pip install -r requirements.txt
```

### Upload fails
```bash
# Check upload directory exists and has permissions
ls -la /home/user/Critvue/backend/uploads/
chmod 755 /home/user/Critvue/backend/uploads/
```

### Frontend errors
```bash
# Check environment variables
cat /home/user/Critvue/frontend/.env.local

# Should show: NEXT_PUBLIC_API_URL=http://localhost:8000
```

## File Locations

| Component | Path |
|-----------|------|
| Backend API | `/home/user/Critvue/backend/app/api/v1/files.py` |
| File Utils | `/home/user/Critvue/backend/app/utils/file_utils.py` |
| Upload Storage | `/home/user/Critvue/backend/uploads/` |
| Frontend API Client | `/home/user/Critvue/frontend/lib/api/files.ts` |
| Upload Component | `/home/user/Critvue/frontend/components/ui/file-upload.tsx` |
| Upload Step | `/home/user/Critvue/frontend/components/review-flow/file-upload-step.tsx` |
| Main Flow | `/home/user/Critvue/frontend/app/review/new/page.tsx` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reviews/{id}/files` | Upload single file |
| POST | `/api/v1/reviews/{id}/files/batch` | Upload multiple files |
| GET | `/api/v1/reviews/{id}/files` | List all files |
| DELETE | `/api/v1/reviews/{id}/files/{file_id}` | Delete a file |
| GET | `/files/{type}/{filename}` | Access uploaded file |

## Size Limits

| Content Type | Max Size |
|--------------|----------|
| Design | 10 MB |
| Code | 50 MB |
| Video | 100 MB |
| Audio | 50 MB |
| Writing | 10 MB |
| Art | 10 MB |

## Supported File Types

**Design**: PNG, JPG, SVG, WebP, GIF, PDF
**Code**: ZIP, TAR, GZIP, TXT
**Video**: MP4, MOV, AVI, WebM, MKV
**Audio**: MP3, WAV, OGG, AAC
**Writing**: PDF, DOC, DOCX, TXT, MD, RTF
**Art**: PNG, JPG, WebP, SVG, GIF, PDF

## Next Steps

1. ✅ System is running
2. Try uploading different file types
3. Test with different content categories
4. Try the mobile interface
5. Check uploaded files in `/home/user/Critvue/backend/uploads/`
6. Review the full documentation in `FILE_UPLOAD_SYSTEM.md`

## Need Help?

- **Full Documentation**: `FILE_UPLOAD_SYSTEM.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **API Docs**: http://localhost:8000/api/docs
- **Test Script**: `python3 /home/user/Critvue/backend/test_file_upload.py`

## Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000/review/new
- [ ] Can select content type
- [ ] Can enter title/description
- [ ] Can upload a file
- [ ] See progress bar fill up
- [ ] See file preview/thumbnail
- [ ] Can complete full 5-step flow
- [ ] File saved in uploads directory

If all checked, you're good to go! 🎉
