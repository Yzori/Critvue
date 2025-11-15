# Avatar Upload - Quick Start Guide

Get the avatar upload system running in 5 minutes!

## Prerequisites

- Python 3.12+
- FastAPI backend running
- PostgreSQL database
- Dependencies installed (`pip install -r requirements.txt`)

## Setup Steps

### 1. Create Storage Directory

```bash
cd /home/user/Critvue/backend
mkdir -p uploads/avatars
chmod 700 uploads/avatars
```

### 2. Update Environment Variables

Add to your `.env` file:

```bash
# Avatar Upload Settings
MAX_AVATAR_SIZE=5242880
AVATAR_STORAGE_TYPE=local
AVATAR_STORAGE_PATH=/home/user/Critvue/backend/uploads/avatars
AVATAR_BASE_URL=/files/avatars
AVATAR_STRIP_METADATA=true
```

### 3. Verify Dependencies

All required packages should already be installed from `requirements.txt`:

```bash
# Verify these are installed
pip list | grep -E "pillow|python-magic|aiofiles"

# If missing, install:
pip install pillow==10.4.0 python-magic==0.4.27 aiofiles==24.1.0
```

### 4. Run Database Migrations

No new migrations needed - the `avatar_url` column already exists in the `users` table.

### 5. Start the Server

```bash
cd /home/user/Critvue/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Test the API

### 1. Get Access Token

First, login to get a token:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Save the `access_token` from the response.

### 2. Upload Avatar

```bash
curl -X POST "http://localhost:8000/api/v1/profile/me/avatar" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/avatar.jpg"
```

Expected response:

```json
{
  "avatar_url": "/files/avatars/medium/avatar_1_a1b2c3d4_medium.jpg",
  "message": "Avatar uploaded and processed successfully",
  "variants": {
    "thumbnail": "/files/avatars/thumbnail/avatar_1_a1b2c3d4_thumbnail.jpg",
    "small": "/files/avatars/small/avatar_1_a1b2c3d4_small.jpg",
    "medium": "/files/avatars/medium/avatar_1_a1b2c3d4_medium.jpg",
    "large": "/files/avatars/large/avatar_1_a1b2c3d4_large.jpg",
    "full": "/files/avatars/full/avatar_1_a1b2c3d4_full.jpg"
  },
  "metadata": {
    "original_size": 2456789,
    "original_dimensions": "2000x2000",
    "format": "JPEG"
  }
}
```

### 3. Get Your Avatar

```bash
curl -X GET "http://localhost:8000/api/v1/profile/me/avatar" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Delete Avatar

```bash
curl -X DELETE "http://localhost:8000/api/v1/profile/me/avatar" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Run Tests

```bash
cd /home/user/Critvue/backend

# Run all avatar tests
pytest tests/test_avatar_upload.py -v

# Run with coverage
pytest tests/test_avatar_upload.py --cov=app.services
```

## Common Issues

### Issue: "Module 'magic' not found"

**Solution**:
```bash
pip install python-magic==0.4.27

# On some systems, you may also need:
# Ubuntu/Debian: sudo apt-get install libmagic1
# macOS: brew install libmagic
# Windows: pip install python-magic-bin
```

### Issue: "Permission denied" when saving files

**Solution**:
```bash
chmod 700 /home/user/Critvue/backend/uploads/avatars
```

### Issue: Avatar upload returns 500 error

**Check**:
1. Verify storage directory exists and has proper permissions
2. Check logs: `tail -f /var/log/critvue/app.log`
3. Verify all dependencies are installed
4. Ensure file is a valid image format (JPEG, PNG, WebP, GIF)

### Issue: "File too large" error

**Check**:
1. File must be under 5MB
2. If using nginx, check `client_max_body_size` setting
3. Compress image before upload

## What's Created

When you upload an avatar, the system:

1. ✅ Validates the image (type, size, dimensions, signature)
2. ✅ Extracts metadata (EXIF, dimensions, format)
3. ✅ Strips privacy data (GPS, camera info)
4. ✅ Generates 5 optimized variants
5. ✅ Saves to storage with secure permissions
6. ✅ Updates your profile with avatar URL
7. ✅ Deletes your old avatar files

**Result**: 5 files created in organized subdirectories:

```
/backend/uploads/avatars/
├── thumbnail/avatar_1_a1b2c3d4_thumbnail.jpg (64x64)
├── small/avatar_1_a1b2c3d4_small.jpg (128x128)
├── medium/avatar_1_a1b2c3d4_medium.jpg (256x256) ← Default
├── large/avatar_1_a1b2c3d4_large.jpg (512x512)
└── full/avatar_1_a1b2c3d4_full.jpg (1024x1024)
```

## API Endpoints Summary

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/v1/profile/me/avatar` | POST | Required | 5/min | Upload avatar |
| `/api/v1/profile/me/avatar` | GET | Required | - | Get avatar URL |
| `/api/v1/profile/me/avatar` | DELETE | Required | 10/min | Delete avatar |

## File Requirements

- **Formats**: JPEG, PNG, WebP, GIF
- **Max Size**: 5MB
- **Dimensions**: 100px - 4096px (width/height)
- **Recommended**: Square images (1:1 aspect ratio)
- **Optimal Size**: 500x500 to 2000x2000 pixels

## Security Features Enabled

- ✅ Magic number file validation
- ✅ File signature verification
- ✅ Size and dimension limits
- ✅ Path traversal prevention
- ✅ EXIF metadata stripping
- ✅ Secure filename generation
- ✅ Rate limiting
- ✅ JWT authentication
- ✅ File permissions (0600/0700)

## Next Steps

1. **Frontend Integration**: See `/frontend/AVATAR_UPLOAD_IMPLEMENTATION.md`
2. **API Documentation**: See `/backend/docs/AVATAR_UPLOAD_API.md`
3. **Testing**: Run test suite in `/backend/tests/test_avatar_upload.py`
4. **Customization**: Adjust settings in `/backend/app/core/config.py`

## Need Help?

- **Full Documentation**: `/backend/docs/AVATAR_UPLOAD_API.md`
- **Implementation Details**: `/backend/AVATAR_UPLOAD_IMPLEMENTATION_SUMMARY.md`
- **Test Examples**: `/backend/tests/test_avatar_upload.py`

---

**You're all set!** The avatar upload system is ready to use. 🎉
