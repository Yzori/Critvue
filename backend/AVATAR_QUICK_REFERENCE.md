# Avatar Upload - Backend Quick Reference

## Quick Start

### 1. Apply Database Migration
```bash
cd /home/user/Critvue/backend
alembic upgrade j3k4l5m6n7o8
```

### 2. Verify Configuration
```python
# Check .env has these settings:
MAX_AVATAR_SIZE=5242880
AVATAR_STORAGE_TYPE=local
AVATAR_STORAGE_PATH=/home/user/Critvue/backend/uploads/avatars
AVATAR_BASE_URL=/files/avatars
AVATAR_STRIP_METADATA=true
```

### 3. Run Tests
```bash
pytest tests/test_avatar_upload.py -v
```

## API Endpoints

### Upload Avatar
```bash
POST /api/v1/profile/me/avatar
Content-Type: multipart/form-data

# Example
curl -X POST http://localhost:8000/api/v1/profile/me/avatar \
  -H "Cookie: access_token=YOUR_JWT" \
  -F "file=@avatar.jpg"
```

**Response**:
```json
{
  "avatar_url": "/files/avatars/medium/avatar_123_abc.jpg",
  "variants": {
    "thumbnail": "/files/avatars/thumbnail/avatar_123_abc_thumbnail.jpg",
    "small": "/files/avatars/small/avatar_123_abc_small.jpg",
    "medium": "/files/avatars/medium/avatar_123_abc_medium.jpg",
    "large": "/files/avatars/large/avatar_123_abc_large.jpg",
    "full": "/files/avatars/full/avatar_123_abc_full.jpg"
  }
}
```

### Delete Avatar
```bash
DELETE /api/v1/profile/me/avatar

# Example
curl -X DELETE http://localhost:8000/api/v1/profile/me/avatar \
  -H "Cookie: access_token=YOUR_JWT"
```

### Get Avatar URL
```bash
GET /api/v1/profile/me/avatar?size=medium

# Example
curl http://localhost:8000/api/v1/profile/me/avatar?size=large \
  -H "Cookie: access_token=YOUR_JWT"
```

## File Specifications

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### Size Limits
- Maximum file size: 5MB
- Minimum dimensions: 100x100px
- Maximum dimensions: 4096x4096px

### Generated Variants
| Variant | Dimensions |
|---------|-----------|
| thumbnail | 64x64 |
| small | 128x128 |
| medium | 256x256 |
| large | 512x512 |
| full | 1024x1024 |

## Rate Limits
- Upload: 5 requests/minute
- Delete: 10 requests/minute
- Get: No limit

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Invalid file (type, size, or dimensions) |
| 401 | Not authenticated |
| 404 | User or avatar not found |
| 429 | Rate limit exceeded |
| 500 | Server error (processing or storage) |

## Common Tasks

### Check Storage Usage
```bash
du -sh /home/user/Critvue/backend/uploads/avatars/
```

### Clean Up Orphaned Files
```bash
# Files older than 30 days
find /home/user/Critvue/backend/uploads/avatars/ -type f -mtime +30 -delete
```

### View Logs
```bash
# Backend logs
tail -f /var/log/critvue/backend.log | grep avatar

# Or if using Docker
docker logs critvue-backend --tail 100 -f | grep avatar
```

## Troubleshooting

### "Module 'magic' not found"
```bash
pip install python-magic
sudo apt-get install libmagic1  # Linux
brew install libmagic  # macOS
```

### "Permission denied" on uploads
```bash
chmod 700 /home/user/Critvue/backend/uploads/avatars
chown $USER:$USER /home/user/Critvue/backend/uploads/avatars
```

### Database migration issues
```bash
# Check current version
alembic current

# Apply all migrations
alembic upgrade head

# Verify avatar_url column
psql -d critvue -c "\d users"
```

### Rate limit issues in development
```bash
# In .env
ENABLE_RATE_LIMITING=false
```

## File Locations

### Code
- API Endpoints: `/home/user/Critvue/backend/app/api/v1/profile.py`
- Image Service: `/home/user/Critvue/backend/app/services/image_service.py`
- Storage Service: `/home/user/Critvue/backend/app/services/storage_service.py`
- Service Factory: `/home/user/Critvue/backend/app/services/service_factory.py`
- CRUD: `/home/user/Critvue/backend/app/crud/profile.py`
- Models: `/home/user/Critvue/backend/app/models/user.py`
- Schemas: `/home/user/Critvue/backend/app/schemas/profile.py`
- Config: `/home/user/Critvue/backend/app/core/config.py`
- Validators: `/home/user/Critvue/backend/app/core/validators.py`

### Tests
- `/home/user/Critvue/backend/tests/test_avatar_upload.py`

### Documentation
- Implementation Guide: `/home/user/Critvue/backend/docs/AVATAR_BACKEND_IMPLEMENTATION.md`
- Security Audit: `/home/user/Critvue/backend/docs/AVATAR_SECURITY_AUDIT.md`
- Review Report: `/home/user/Critvue/backend/AVATAR_BACKEND_REVIEW_REPORT.md`
- API Spec: `/home/user/Critvue/backend/docs/AVATAR_UPLOAD_API.md`

### Migrations
- Initial users table: `e662b57b32b5_create_users_table.py`
- Avatar index: `j3k4l5m6n7o8_add_avatar_url_index.py`

## Security Checklist

- ✅ Magic number validation (not just extensions)
- ✅ File size limits enforced
- ✅ Dimension validation
- ✅ Path traversal prevention
- ✅ Filename sanitization
- ✅ EXIF metadata stripping
- ✅ JWT authentication required
- ✅ Rate limiting enabled
- ✅ Secure file permissions (600)
- ✅ Secure directory permissions (700)

## Performance Tips

### Optimize Image Quality
```python
# In image_service.py (adjust if needed)
JPEG_QUALITY = 85  # Default: good balance
WEBP_QUALITY = 85
PNG_COMPRESSION = 6
```

### Reduce Variants
```python
# In image_service.py (comment out unused sizes)
AVATAR_SIZES = {
    'thumbnail': (64, 64),
    'medium': (256, 256),
    # 'large': (512, 512),  # Skip if not needed
}
```

### Enable CDN (Production)
```nginx
# In nginx.conf
location /files/avatars/ {
    add_header Cache-Control "public, max-age=604800, immutable";
    expires 7d;
}
```

## Health Check

```bash
# Check avatar system health
curl http://localhost:8000/health/avatar
```

**Expected Response**:
```json
{
  "status": "healthy",
  "config_valid": true,
  "errors": [],
  "storage": {
    "total_files": 150,
    "total_size_mb": 45.2
  }
}
```

## Related Documentation

- 📖 [Full Implementation Guide](./docs/AVATAR_BACKEND_IMPLEMENTATION.md)
- 🔒 [Security Audit](./docs/AVATAR_SECURITY_AUDIT.md)
- 📊 [Review Report](./AVATAR_BACKEND_REVIEW_REPORT.md)
- 🚀 [Quick Start](./AVATAR_QUICK_START.md)
- 📡 [API Documentation](./docs/AVATAR_UPLOAD_API.md)

## Support

For issues or questions:
1. Check [Troubleshooting Guide](./docs/AVATAR_BACKEND_IMPLEMENTATION.md#troubleshooting)
2. Review [Security Audit](./docs/AVATAR_SECURITY_AUDIT.md)
3. Check logs for detailed error messages
4. Run tests to verify system health
