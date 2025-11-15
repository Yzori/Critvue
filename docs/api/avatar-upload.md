# Avatar Upload API Documentation

## Overview

The Avatar Upload API provides secure, robust endpoints for managing user profile avatars. The system includes comprehensive validation, image processing, and storage management with multiple security layers.

## Features

- **Multi-format Support**: JPEG, PNG, WebP, GIF
- **Security Validation**: Magic number verification, file signature checking, path traversal prevention
- **Image Processing**: Automatic optimization, compression, and variant generation
- **Multiple Sizes**: Thumbnail (64x64), Small (128x128), Medium (256x256), Large (512x512), Full (1024x1024)
- **Privacy Protection**: Automatic EXIF metadata stripping
- **Rate Limiting**: 5 uploads per minute, 10 deletes per minute
- **File Size Limit**: 5MB maximum
- **Dimension Validation**: 100-4096px width/height

## API Endpoints

### 1. Upload Avatar

Upload and process a user avatar image.

**Endpoint**: `POST /api/v1/profile/me/avatar`

**Authentication**: Required (Bearer token)

**Rate Limit**: 5 requests/minute

**Request**:
```http
POST /api/v1/profile/me/avatar HTTP/1.1
Host: api.critvue.com
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <binary image data>
```

**cURL Example**:
```bash
curl -X POST "https://api.critvue.com/api/v1/profile/me/avatar" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/avatar.jpg"
```

**Response** (200 OK):
```json
{
  "avatar_url": "/files/avatars/medium/avatar_123_a1b2c3d4_medium.jpg",
  "message": "Avatar uploaded and processed successfully",
  "variants": {
    "thumbnail": "/files/avatars/thumbnail/avatar_123_a1b2c3d4_thumbnail.jpg",
    "small": "/files/avatars/small/avatar_123_a1b2c3d4_small.jpg",
    "medium": "/files/avatars/medium/avatar_123_a1b2c3d4_medium.jpg",
    "large": "/files/avatars/large/avatar_123_a1b2c3d4_large.jpg",
    "full": "/files/avatars/full/avatar_123_a1b2c3d4_full.jpg"
  },
  "metadata": {
    "original_size": 2456789,
    "original_dimensions": "2000x2000",
    "format": "JPEG"
  }
}
```

**Error Responses**:

400 Bad Request - Invalid file:
```json
{
  "detail": "Invalid file type: image/bmp. Allowed types: JPEG, PNG, WebP, GIF"
}
```

400 Bad Request - File too large:
```json
{
  "detail": "File too large. Maximum size is 5MB"
}
```

400 Bad Request - Invalid dimensions:
```json
{
  "detail": "Image dimensions too large. Maximum: 4096x4096px"
}
```

413 Request Entity Too Large:
```json
{
  "detail": "File too large. Maximum size: 5.0MB"
}
```

429 Too Many Requests:
```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds"
}
```

500 Internal Server Error:
```json
{
  "detail": "Image processing failed: unable to generate variants"
}
```

---

### 2. Get Current User Avatar

Retrieve the authenticated user's avatar URL.

**Endpoint**: `GET /api/v1/profile/me/avatar`

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `size` (optional): Variant size (thumbnail, small, medium, large, full). Default: medium

**Request**:
```http
GET /api/v1/profile/me/avatar?size=large HTTP/1.1
Host: api.critvue.com
Authorization: Bearer <access_token>
```

**cURL Example**:
```bash
curl -X GET "https://api.critvue.com/api/v1/profile/me/avatar?size=large" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response** (200 OK):
```json
{
  "avatar_url": "/files/avatars/medium/avatar_123_a1b2c3d4_medium.jpg",
  "size": "large"
}
```

**Error Responses**:

404 Not Found:
```json
{
  "detail": "No avatar set"
}
```

---

### 3. Delete Avatar

Delete the user's avatar and all its variants.

**Endpoint**: `DELETE /api/v1/profile/me/avatar`

**Authentication**: Required (Bearer token)

**Rate Limit**: 10 requests/minute

**Request**:
```http
DELETE /api/v1/profile/me/avatar HTTP/1.1
Host: api.critvue.com
Authorization: Bearer <access_token>
```

**cURL Example**:
```bash
curl -X DELETE "https://api.critvue.com/api/v1/profile/me/avatar" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response** (200 OK):
```json
{
  "message": "Avatar deleted successfully",
  "files_deleted": 5
}
```

**Error Responses**:

404 Not Found:
```json
{
  "detail": "No avatar to delete"
}
```

500 Internal Server Error:
```json
{
  "detail": "Failed to delete avatar"
}
```

---

## Validation Rules

### File Type Validation

The system performs multi-layer validation:

1. **MIME Type Check**: Uses magic numbers, not just file extension
2. **File Signature Verification**: Validates the actual file header bytes
3. **Extension Matching**: Ensures extension matches detected MIME type
4. **Image Integrity**: Opens and verifies the image can be processed

**Allowed MIME Types**:
- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/webp` (.webp)
- `image/gif` (.gif)

### Size Constraints

- **File Size**: Maximum 5MB (5,242,880 bytes)
- **Width**: 100px - 4,096px
- **Height**: 100px - 4,096px

### Security Validations

1. **Path Traversal Prevention**: Filenames sanitized to prevent directory traversal
2. **Executable Detection**: Rejects files with executable signatures
3. **Content Safety**: Basic checks for corrupted or suspicious images
4. **Magic Number Verification**: Validates file signature matches declared type

---

## Image Processing

### Variant Generation

Each uploaded image is automatically processed into 5 optimized variants:

| Variant | Max Dimensions | Use Case |
|---------|---------------|----------|
| `thumbnail` | 64x64px | User list thumbnails, comments |
| `small` | 128x128px | Compact profile displays |
| `medium` | 256x256px | Standard profile view (default) |
| `large` | 512x512px | Detailed profile page |
| `full` | 1024x1024px | Full-resolution view |

### Optimization Features

- **Compression**: JPEG quality 85%, WebP quality 85%
- **Format Conversion**: Converts RGBA to RGB for JPEG compatibility
- **Progressive JPEG**: Enables progressive loading for better UX
- **Metadata Stripping**: Removes EXIF data (GPS, camera info) for privacy
- **Aspect Ratio**: Maintains original aspect ratio with thumbnail sizing

---

## Security Measures

### 1. Authentication & Authorization
- All endpoints require valid JWT bearer token
- Users can only upload/delete their own avatars

### 2. Rate Limiting
- Upload: 5 requests per minute per user
- Delete: 10 requests per minute per user
- Prevents abuse and DoS attacks

### 3. File Validation
- Magic number verification (not just extension checking)
- File signature validation
- Image integrity verification
- Dimension and size limits

### 4. Storage Security
- Secure filename generation (SHA-256 hash-based)
- Path traversal prevention
- File permissions: Owner read/write only (0600)
- Directory permissions: Owner read/write/execute only (0700)

### 5. Privacy Protection
- Automatic EXIF metadata stripping
- Removes GPS coordinates
- Removes camera information
- Removes timestamps

### 6. Input Sanitization
- Filename sanitization
- Removal of dangerous characters
- Length limits on filenames
- No special characters in paths

---

## Error Handling

### Common Error Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 400 | Bad Request | Invalid file type, dimensions, corrupted image |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | No avatar exists, user not found |
| 413 | Payload Too Large | File exceeds 5MB limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Processing failure, storage error |

### Error Response Format

All errors follow a consistent format:

```json
{
  "detail": "Human-readable error message"
}
```

---

## Usage Examples

### Python (requests)

```python
import requests

# Upload avatar
url = "https://api.critvue.com/api/v1/profile/me/avatar"
headers = {"Authorization": f"Bearer {access_token}"}

with open("avatar.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post(url, headers=headers, files=files)

if response.status_code == 200:
    data = response.json()
    print(f"Avatar URL: {data['avatar_url']}")
    print(f"Variants: {data['variants']}")
else:
    print(f"Error: {response.json()['detail']}")
```

### JavaScript (Fetch API)

```javascript
// Upload avatar
const uploadAvatar = async (file, accessToken) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.critvue.com/api/v1/profile/me/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Avatar URL:', data.avatar_url);
    console.log('Variants:', data.variants);
    return data;
  } else {
    const error = await response.json();
    throw new Error(error.detail);
  }
};

// Delete avatar
const deleteAvatar = async (accessToken) => {
  const response = await fetch('https://api.critvue.com/api/v1/profile/me/avatar', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (response.ok) {
    const data = await response.json();
    console.log(data.message);
  } else {
    const error = await response.json();
    throw new Error(error.detail);
  }
};
```

### TypeScript (Axios)

```typescript
import axios from 'axios';

interface AvatarUploadResponse {
  avatar_url: string;
  message: string;
  variants: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    full: string;
  };
  metadata: {
    original_size: number;
    original_dimensions: string;
    format: string;
  };
}

const uploadAvatar = async (
  file: File,
  accessToken: string
): Promise<AvatarUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<AvatarUploadResponse>(
    'https://api.critvue.com/api/v1/profile/me/avatar',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return response.data;
};
```

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Avatar Upload Settings
MAX_AVATAR_SIZE=5242880                                    # 5MB in bytes
AVATAR_STORAGE_TYPE=local                                  # "local" or "cloud"
AVATAR_STORAGE_PATH=/path/to/backend/uploads/avatars      # Local storage path
AVATAR_BASE_URL=/files/avatars                             # Base URL for avatars
AVATAR_STRIP_METADATA=true                                 # Strip EXIF data
```

### Storage Configuration

**Local Storage** (Default):
- Files stored in: `/backend/uploads/avatars/`
- Served via: `/files/avatars/` endpoint
- Permissions: 0700 (directories), 0600 (files)

**Cloud Storage** (Future):
- Support for UploadThing, Cloudinary, AWS S3
- CDN integration ready
- Signed URLs for secure access

---

## Performance Considerations

### Upload Performance
- Average processing time: <2 seconds for typical images
- Generates 5 variants in parallel
- Asynchronous file operations
- Streaming for large files

### Storage Impact
- Original 5MB file → ~500KB total for all variants
- 80-90% storage reduction through optimization
- Old avatars automatically deleted on new upload

### Best Practices
1. Upload square images for best results (1:1 aspect ratio)
2. Use JPEG or WebP for smaller file sizes
3. Pre-crop images to desired composition before upload
4. Recommended upload size: 500x500 to 2000x2000px

---

## Troubleshooting

### Common Issues

**Issue**: Upload fails with "Invalid file type"
- **Cause**: File extension doesn't match actual file type
- **Solution**: Ensure file is actually a valid JPEG/PNG/WebP/GIF

**Issue**: Upload fails with "Image dimensions too large"
- **Cause**: Image exceeds 4096x4096px
- **Solution**: Resize image before upload or use image editing software

**Issue**: Upload fails with "File too large"
- **Cause**: File exceeds 5MB limit
- **Solution**: Compress image or reduce quality/dimensions

**Issue**: "Rate limit exceeded"
- **Cause**: Too many upload attempts in short time
- **Solution**: Wait 60 seconds before retrying

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Support for JPEG, PNG, WebP, GIF
- 5 size variants
- EXIF stripping
- Rate limiting
- Comprehensive validation
- Local storage support

### Planned Features
- Cloud storage integration (S3, Cloudinary)
- Content moderation API integration
- Video avatar support
- Animated GIF preservation
- Custom size variant configuration
- Batch avatar processing
- Avatar templates/filters

---

## Support

For issues or questions:
- Email: support@critvue.com
- Documentation: https://docs.critvue.com
- GitHub Issues: https://github.com/critvue/critvue/issues
