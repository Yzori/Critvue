# Avatar Upload Backend Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Service Layer](#service-layer)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Overview

The avatar upload system provides secure, scalable image upload functionality with:
- Multi-format support (JPEG, PNG, WebP, GIF)
- Automatic image optimization and resizing
- Multiple size variants generation
- EXIF metadata stripping for privacy
- Comprehensive security validation
- Rate limiting and authentication

### Key Features
- ✅ Magic number validation (not just extension checking)
- ✅ Automatic image optimization
- ✅ 5 size variants (thumbnail, small, medium, large, full)
- ✅ EXIF metadata stripping
- ✅ Path traversal protection
- ✅ Rate limiting (5 uploads/minute)
- ✅ Transaction rollback on errors
- ✅ Comprehensive error handling

## Architecture

### Component Diagram
```
┌─────────────────┐
│  FastAPI Route  │ profile.py
└────────┬────────┘
         │
         ├──────────┬──────────────┐
         │          │              │
         ▼          ▼              ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐
│ImageService │ │ Storage  │ │   CRUD   │
│             │ │ Service  │ │ (profile)│
└─────────────┘ └──────────┘ └──────────┘
         │          │              │
         │          │              ▼
         │          │        ┌──────────┐
         │          │        │ Database │
         │          │        │ (users)  │
         │          │        └──────────┘
         │          ▼
         │    ┌──────────┐
         │    │  File    │
         │    │ System   │
         │    └──────────┘
         ▼
    ┌─────────┐
    │  Pillow │
    │ (Image) │
    └─────────┘
```

### Service Factory Pattern
```python
# Centralized service management
ServiceFactory
├── get_image_service()    → ImageService
└── get_storage_service()  → StorageService
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),

    -- Avatar field
    avatar_url VARCHAR(500),  -- Stores URL to medium variant

    -- Profile fields
    bio TEXT,
    title VARCHAR(255),
    specialty_tags TEXT,  -- JSON array
    badges TEXT,          -- JSON array

    -- Stats
    total_reviews_given INTEGER DEFAULT 0,
    total_reviews_received INTEGER DEFAULT 0,
    avg_rating NUMERIC(3,2),
    avg_response_time_hours INTEGER,

    -- Metadata
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    last_login DATETIME
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_avatar_url ON users(avatar_url);
CREATE INDEX idx_users_avg_rating ON users(avg_rating);
CREATE INDEX idx_users_total_reviews_given ON users(total_reviews_given);
```

### Migration
```bash
# Apply the avatar_url index migration
cd /home/user/Critvue/backend
alembic upgrade j3k4l5m6n7o8
```

## API Endpoints

### 1. Upload Avatar
**POST** `/api/v1/profile/me/avatar`

Uploads and processes a new avatar image.

**Authentication**: Required (JWT in httpOnly cookie)

**Rate Limit**: 5 requests/minute

**Request**:
```http
POST /api/v1/profile/me/avatar HTTP/1.1
Content-Type: multipart/form-data
Cookie: access_token=<jwt-token>

--boundary
Content-Disposition: form-data; name="file"; filename="avatar.jpg"
Content-Type: image/jpeg

<binary-image-data>
--boundary--
```

**Response** (200 OK):
```json
{
  "avatar_url": "/files/avatars/medium/avatar_123_a1b2c3d4.jpg",
  "message": "Avatar uploaded and processed successfully",
  "variants": {
    "thumbnail": "/files/avatars/thumbnail/avatar_123_a1b2c3d4_thumbnail.jpg",
    "small": "/files/avatars/small/avatar_123_a1b2c3d4_small.jpg",
    "medium": "/files/avatars/medium/avatar_123_a1b2c3d4_medium.jpg",
    "large": "/files/avatars/large/avatar_123_a1b2c3d4_large.jpg",
    "full": "/files/avatars/full/avatar_123_a1b2c3d4_full.jpg"
  },
  "metadata": {
    "original_size": 2048576,
    "original_dimensions": "2000x2000",
    "format": "JPEG"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid file type, size, or dimensions
- `401 Unauthorized`: Not authenticated
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Processing or storage failure

**Validation Rules**:
- File types: JPEG, PNG, WebP, GIF
- Max file size: 5MB
- Min dimensions: 100x100px
- Max dimensions: 4096x4096px

### 2. Delete Avatar
**DELETE** `/api/v1/profile/me/avatar`

Deletes the user's avatar and all variants.

**Authentication**: Required

**Rate Limit**: 10 requests/minute

**Response** (200 OK):
```json
{
  "message": "Avatar deleted successfully",
  "files_deleted": 5
}
```

**Error Responses**:
- `404 Not Found`: User has no avatar
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Deletion failed

### 3. Get Avatar
**GET** `/api/v1/profile/me/avatar?size=medium`

Returns the avatar URL for the authenticated user.

**Authentication**: Required

**Query Parameters**:
- `size` (optional): `thumbnail`, `small`, `medium`, `large`, `full`

**Response** (200 OK):
```json
{
  "avatar_url": "/files/avatars/medium/avatar_123_a1b2c3d4.jpg",
  "size": "medium"
}
```

## Service Layer

### ImageService

Handles image validation, processing, and optimization.

**Key Methods**:

```python
class ImageService:
    async def validate_image(
        self,
        file_content: bytes,
        filename: str
    ) -> Tuple[str, Image.Image]:
        """
        Validates uploaded image
        - Checks file size
        - Validates MIME type with magic numbers
        - Verifies image integrity
        - Checks dimensions
        """

    async def optimize_image(
        self,
        image: Image.Image,
        size_name: str = 'full',
        strip_metadata: bool = True
    ) -> Tuple[bytes, str]:
        """
        Optimizes image
        - Resizes to target dimensions
        - Converts format if needed
        - Compresses with quality settings
        - Strips EXIF metadata
        """

    async def generate_variants(
        self,
        image: Image.Image,
        strip_metadata: bool = True
    ) -> Dict[str, Tuple[bytes, str]]:
        """
        Generates all size variants
        - thumbnail: 64x64
        - small: 128x128
        - medium: 256x256
        - large: 512x512
        - full: 1024x1024
        """
```

### StorageService

Manages file storage operations.

**Key Methods**:

```python
class StorageService:
    async def save_file(
        self,
        file_content: bytes,
        filename: str,
        subdirectory: Optional[str] = None
    ) -> str:
        """
        Saves file to storage
        - Creates subdirectories
        - Sets proper permissions
        - Returns relative path
        """

    async def delete_file(self, relative_path: str) -> bool:
        """Deletes single file"""

    async def delete_user_avatars(self, user_id: int) -> int:
        """Deletes all avatar variants for user"""

    async def cleanup_old_files(self, days: int = 30) -> int:
        """Removes orphaned files older than N days"""
```

### ServiceFactory

Provides dependency injection for services.

```python
from app.services.service_factory import (
    get_image_service,
    get_storage_service
)

# Usage in FastAPI endpoint
@router.post("/upload")
async def upload(
    image_service: ImageService = Depends(get_image_service),
    storage_service: StorageService = Depends(get_storage_service)
):
    # Services are singleton instances
    pass
```

## Configuration

### Environment Variables

Required settings in `.env`:

```bash
# Avatar Upload Configuration
MAX_AVATAR_SIZE=5242880  # 5MB in bytes
AVATAR_STORAGE_TYPE=local  # 'local' or 'cloud'
AVATAR_STORAGE_PATH=/home/user/Critvue/backend/uploads/avatars
AVATAR_BASE_URL=/files/avatars
AVATAR_STRIP_METADATA=true

# Security
SECRET_KEY=your-secret-key-here
ENABLE_RATE_LIMITING=true

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/critvue
```

### Configuration Validation

The system validates configuration at startup:

```python
from app.core.validators import check_config_or_exit

# In main.py or startup
check_config_or_exit()  # Raises ConfigValidationError if invalid
```

**Validated Settings**:
- Storage type is 'local' or 'cloud'
- Storage path is absolute and writable
- File size limits are positive
- Database pool settings are valid
- Secret keys are not using defaults (in production)

## Testing

### Running Tests

```bash
cd /home/user/Critvue/backend

# Run all avatar upload tests
pytest tests/test_avatar_upload.py -v

# Run with coverage
pytest tests/test_avatar_upload.py --cov=app/services --cov=app/api/v1/profile

# Run specific test class
pytest tests/test_avatar_upload.py::TestImageValidation -v

# Run integration tests
pytest tests/test_avatar_upload.py::TestIntegration -v
```

### Test Coverage

The test suite covers:
- ✅ Image validation (valid/invalid formats)
- ✅ File size limits (too large/too small)
- ✅ Dimension validation (oversized/undersized)
- ✅ EXIF metadata extraction and stripping
- ✅ Image optimization and compression
- ✅ Multi-variant generation
- ✅ Storage operations (save/delete)
- ✅ Path traversal prevention
- ✅ Security checks (malicious files)
- ✅ Complete upload workflow
- ✅ Error handling and rollback

### Manual Testing

```bash
# 1. Upload a valid image
curl -X POST http://localhost:8000/api/v1/profile/me/avatar \
  -H "Cookie: access_token=<your-jwt>" \
  -F "file=@avatar.jpg"

# 2. Verify variants created
ls -la /home/user/Critvue/backend/uploads/avatars/*/avatar_*

# 3. Get avatar URL
curl http://localhost:8000/api/v1/profile/me/avatar \
  -H "Cookie: access_token=<your-jwt>"

# 4. Delete avatar
curl -X DELETE http://localhost:8000/api/v1/profile/me/avatar \
  -H "Cookie: access_token=<your-jwt>"
```

## Deployment

### Production Checklist

#### 1. Environment Configuration
```bash
# Set secure secrets
export SECRET_KEY=$(openssl rand -hex 32)
export REFRESH_SECRET_KEY=$(openssl rand -hex 32)

# Enable rate limiting
export ENABLE_RATE_LIMITING=true

# Configure storage
export AVATAR_STORAGE_PATH=/var/www/critvue/uploads/avatars
export AVATAR_STRIP_METADATA=true
```

#### 2. Database Migration
```bash
# Apply all migrations
alembic upgrade head

# Verify avatar_url column exists
psql -d critvue -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url';"
```

#### 3. Storage Setup
```bash
# Create storage directory
sudo mkdir -p /var/www/critvue/uploads/avatars

# Set ownership
sudo chown www-data:www-data /var/www/critvue/uploads/avatars

# Set permissions
sudo chmod 700 /var/www/critvue/uploads/avatars

# Create subdirectories
cd /var/www/critvue/uploads/avatars
for size in thumbnail small medium large full; do
    mkdir -p $size
    chmod 700 $size
done
```

#### 4. Nginx Configuration
```nginx
# Serve avatar files
location /files/avatars/ {
    alias /var/www/critvue/uploads/avatars/;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header Content-Security-Policy "default-src 'none'; img-src 'self'";

    # Cache control
    expires 7d;
    add_header Cache-Control "public, immutable";

    # Only allow images
    types {
        image/jpeg jpg jpeg;
        image/png png;
        image/webp webp;
        image/gif gif;
    }
    default_type application/octet-stream;
}

# Upload endpoint
location /api/v1/profile/me/avatar {
    client_max_body_size 5M;
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_request_buffering off;
}
```

#### 5. Systemd Service
```ini
[Unit]
Description=Critvue Backend
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/critvue/backend
Environment="PATH=/var/www/critvue/backend/venv/bin"
EnvironmentFile=/var/www/critvue/backend/.env
ExecStart=/var/www/critvue/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Health Checks

```python
# Add to main.py
@app.get("/health/avatar")
async def avatar_health():
    """Health check for avatar upload system"""
    from app.services.service_factory import ServiceFactory
    from app.core.validators import validate_avatar_config

    is_valid, errors = validate_avatar_config()

    storage_stats = await ServiceFactory.get_storage_service().get_storage_stats()

    return {
        "status": "healthy" if is_valid else "unhealthy",
        "config_valid": is_valid,
        "errors": errors,
        "storage": {
            "total_files": storage_stats["total_files"],
            "total_size_mb": storage_stats["total_size"] / 1024 / 1024,
        }
    }
```

### Monitoring

```python
# Prometheus metrics (optional)
from prometheus_client import Counter, Histogram

avatar_uploads_total = Counter(
    'avatar_uploads_total',
    'Total avatar uploads',
    ['status']
)

avatar_upload_duration = Histogram(
    'avatar_upload_duration_seconds',
    'Avatar upload duration'
)

# Usage in endpoint
with avatar_upload_duration.time():
    # ... upload logic ...
    avatar_uploads_total.labels(status='success').inc()
```

## Troubleshooting

### Common Issues

#### 1. "Module 'magic' not found"
```bash
# Install system dependency
sudo apt-get install libmagic1

# Install Python package
pip install python-magic
```

#### 2. "Permission denied" when saving files
```bash
# Check ownership
ls -la /home/user/Critvue/backend/uploads/

# Fix permissions
sudo chown -R $USER:$USER /home/user/Critvue/backend/uploads/
chmod 700 /home/user/Critvue/backend/uploads/avatars
```

#### 3. "Database update failed"
```bash
# Check if migration applied
alembic current

# Apply missing migrations
alembic upgrade head

# Verify column exists
psql -d critvue -c "\d users"
```

#### 4. Rate limit issues in development
```python
# In .env
ENABLE_RATE_LIMITING=false
```

#### 5. Images not optimizing
```bash
# Install Pillow with all formats
pip uninstall Pillow
pip install Pillow[webp,jpeg]
```

### Debug Mode

Enable detailed logging:

```python
# In .env
LOG_LEVEL=DEBUG

# Or in code
import logging
logging.getLogger('app.services.image_service').setLevel(logging.DEBUG)
logging.getLogger('app.services.storage_service').setLevel(logging.DEBUG)
```

### Performance Tuning

```python
# In config.py
AVATAR_SIZES = {
    'thumbnail': (64, 64),    # Reduce if too slow
    'small': (128, 128),
    'medium': (256, 256),     # Default size
    'large': (512, 512),
    # 'full': (1024, 1024),  # Comment out if not needed
}

# Adjust compression quality
JPEG_QUALITY = 80  # Lower = faster, smaller files
WEBP_QUALITY = 80
PNG_COMPRESSION = 4  # Lower = faster, larger files
```

## Best Practices

### 1. Regular Maintenance
```bash
# Weekly: Clean up orphaned files
python -m app.scripts.cleanup_orphaned_avatars

# Monthly: Check storage usage
du -sh /var/www/critvue/uploads/avatars/*
```

### 2. Backup Strategy
```bash
# Backup avatars
rsync -av /var/www/critvue/uploads/avatars/ /backup/avatars/

# Backup database
pg_dump critvue > backup_$(date +%Y%m%d).sql
```

### 3. Monitoring Alerts
- Storage usage > 90%
- Upload error rate > 5%
- Average upload time > 5 seconds
- Rate limit violations > 10/hour

### 4. Security Updates
```bash
# Monthly: Update dependencies
pip list --outdated
pip install -U python-magic pillow aiofiles

# Check for vulnerabilities
pip-audit
```

## Additional Resources

- [Security Audit](./AVATAR_SECURITY_AUDIT.md)
- [API Documentation](./AVATAR_UPLOAD_API.md)
- [Architecture Design](../design/avatar-upload-architecture.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pillow Documentation](https://pillow.readthedocs.io/)
