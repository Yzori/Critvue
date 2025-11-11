"""File upload utilities for handling file validation, storage, and processing"""

import hashlib
import os
import uuid
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image
import magic  # python-magic for file type detection

# File type configurations based on content type
ALLOWED_MIME_TYPES = {
    "design": [
        "image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp",
        "application/pdf", "image/gif"
    ],
    "code": [
        "application/zip", "application/x-zip-compressed",
        "application/x-tar", "application/gzip",
        "text/plain"  # For single file uploads
    ],
    "video": [
        "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
        "video/x-matroska"
    ],
    "audio": [
        "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
        "audio/ogg", "audio/aac", "audio/webm"
    ],
    "writing": [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain", "text/markdown", "application/rtf"
    ],
    "art": [
        "image/png", "image/jpeg", "image/jpg", "image/webp",
        "image/svg+xml", "image/gif", "application/pdf"
    ]
}

# Size limits in bytes (can be adjusted per content type)
SIZE_LIMITS = {
    "design": 10 * 1024 * 1024,  # 10MB for design files
    "code": 50 * 1024 * 1024,     # 50MB for code archives
    "video": 100 * 1024 * 1024,   # 100MB for videos
    "audio": 50 * 1024 * 1024,    # 50MB for audio
    "writing": 10 * 1024 * 1024,  # 10MB for documents
    "art": 10 * 1024 * 1024,      # 10MB for art files
}

# Thumbnail settings
THUMBNAIL_SIZE = (300, 300)
THUMBNAIL_QUALITY = 85

# Upload directory
UPLOAD_BASE_DIR = Path("/home/user/Critvue/backend/uploads")


def get_upload_directory(content_type: str) -> Path:
    """
    Get the upload directory for a specific content type

    Args:
        content_type: The type of content being uploaded

    Returns:
        Path object for the upload directory
    """
    upload_dir = UPLOAD_BASE_DIR / content_type
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def generate_unique_filename(original_filename: str) -> str:
    """
    Generate a unique filename while preserving the extension

    Args:
        original_filename: Original filename from user

    Returns:
        Unique filename with UUID prefix
    """
    # Sanitize the original filename to prevent path traversal
    safe_filename = os.path.basename(original_filename)

    # Get file extension
    _, ext = os.path.splitext(safe_filename)

    # Generate UUID-based unique name
    unique_id = str(uuid.uuid4())

    return f"{unique_id}{ext}"


def calculate_file_hash(file_content: bytes) -> str:
    """
    Calculate SHA-256 hash of file content for integrity checking

    Args:
        file_content: Raw file bytes

    Returns:
        Hex string of SHA-256 hash
    """
    return hashlib.sha256(file_content).hexdigest()


async def validate_file_type(
    file: UploadFile,
    content_type: str
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate file type using both MIME type and magic numbers

    Args:
        file: The uploaded file
        content_type: The content type category (design, code, video, etc.)

    Returns:
        Tuple of (is_valid, detected_mime_type, error_message)
    """
    # Get allowed types for this content type
    allowed_types = ALLOWED_MIME_TYPES.get(content_type, [])

    if not allowed_types:
        return False, None, f"Invalid content type: {content_type}"

    # Read file header for magic number detection
    file_header = await file.read(2048)
    await file.seek(0)  # Reset file pointer

    # Detect actual file type using magic numbers
    mime = magic.Magic(mime=True)
    detected_mime = mime.from_buffer(file_header)

    # Check if detected MIME type is allowed
    if detected_mime not in allowed_types:
        return False, detected_mime, (
            f"File type '{detected_mime}' is not allowed for {content_type} content. "
            f"Allowed types: {', '.join(allowed_types)}"
        )

    return True, detected_mime, None


async def validate_file_size(
    file: UploadFile,
    content_type: str
) -> Tuple[bool, int, Optional[str]]:
    """
    Validate file size against content type limits

    Args:
        file: The uploaded file
        content_type: The content type category

    Returns:
        Tuple of (is_valid, file_size, error_message)
    """
    # Get size limit for this content type
    size_limit = SIZE_LIMITS.get(content_type, 10 * 1024 * 1024)  # Default 10MB

    # Read entire file to get size
    file_content = await file.read()
    file_size = len(file_content)
    await file.seek(0)  # Reset file pointer

    if file_size > size_limit:
        size_mb = file_size / (1024 * 1024)
        limit_mb = size_limit / (1024 * 1024)
        return False, file_size, (
            f"File size ({size_mb:.2f}MB) exceeds limit ({limit_mb:.0f}MB) "
            f"for {content_type} content"
        )

    if file_size == 0:
        return False, file_size, "File is empty"

    return True, file_size, None


async def save_uploaded_file(
    file: UploadFile,
    content_type: str,
    unique_filename: str
) -> Tuple[str, str]:
    """
    Save uploaded file to disk

    Args:
        file: The uploaded file
        content_type: The content type category
        unique_filename: Unique filename generated for this file

    Returns:
        Tuple of (file_path, file_url)
    """
    # Get upload directory
    upload_dir = get_upload_directory(content_type)

    # Full file path
    file_path = upload_dir / unique_filename

    # Write file to disk
    file_content = await file.read()
    with open(file_path, "wb") as f:
        f.write(file_content)

    # Generate relative path for database storage
    relative_path = f"uploads/{content_type}/{unique_filename}"

    # Generate URL (for now, just relative URL; can be CDN later)
    file_url = f"/files/{content_type}/{unique_filename}"

    return str(relative_path), file_url


def create_thumbnail(
    image_path: Path,
    thumbnail_path: Path,
    size: Tuple[int, int] = THUMBNAIL_SIZE
) -> bool:
    """
    Create a thumbnail for an image file

    Args:
        image_path: Path to the original image
        thumbnail_path: Path where thumbnail should be saved
        size: Tuple of (width, height) for thumbnail

    Returns:
        True if successful, False otherwise
    """
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary (for JPEG)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background

            # Create thumbnail (maintains aspect ratio)
            img.thumbnail(size, Image.Resampling.LANCZOS)

            # Save thumbnail
            img.save(thumbnail_path, "JPEG", quality=THUMBNAIL_QUALITY, optimize=True)

        return True
    except Exception as e:
        print(f"Failed to create thumbnail: {e}")
        return False


async def process_upload(
    file: UploadFile,
    content_type: str
) -> dict:
    """
    Process an uploaded file: validate, save, and generate metadata

    Args:
        file: The uploaded file
        content_type: The content type category

    Returns:
        Dictionary with file metadata

    Raises:
        HTTPException: If validation fails
    """
    # Validate file type
    is_valid_type, detected_mime, type_error = await validate_file_type(file, content_type)
    if not is_valid_type:
        raise HTTPException(status_code=400, detail=type_error)

    # Validate file size
    is_valid_size, file_size, size_error = await validate_file_size(file, content_type)
    if not is_valid_size:
        raise HTTPException(status_code=400, detail=size_error)

    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename or "unnamed")

    # Calculate file hash (for integrity checking)
    file_content = await file.read()
    content_hash = calculate_file_hash(file_content)
    await file.seek(0)  # Reset for saving

    # Save file
    file_path, file_url = await save_uploaded_file(file, content_type, unique_filename)

    # Create thumbnail for images
    thumbnail_url = None
    if detected_mime and detected_mime.startswith("image/") and detected_mime != "image/svg+xml":
        try:
            upload_dir = get_upload_directory(content_type)
            thumbnail_filename = f"thumb_{unique_filename}"
            thumbnail_path = upload_dir / thumbnail_filename

            if create_thumbnail(Path(file_path.replace("uploads/", str(UPLOAD_BASE_DIR) + "/")), thumbnail_path):
                thumbnail_url = f"/files/{content_type}/{thumbnail_filename}"
        except Exception as e:
            print(f"Thumbnail generation failed: {e}")
            # Don't fail the upload if thumbnail generation fails

    return {
        "filename": unique_filename,
        "original_filename": file.filename or "unnamed",
        "file_size": file_size,
        "file_type": detected_mime,
        "file_path": file_path,
        "file_url": file_url,
        "content_hash": content_hash,
        "thumbnail_url": thumbnail_url
    }


def delete_file(file_path: str) -> bool:
    """
    Delete a file from disk

    Args:
        file_path: Relative path to the file

    Returns:
        True if successful, False otherwise
    """
    try:
        # Construct full path
        full_path = UPLOAD_BASE_DIR.parent / file_path

        if full_path.exists() and full_path.is_file():
            full_path.unlink()

            # Also try to delete thumbnail if it exists
            thumbnail_path = full_path.parent / f"thumb_{full_path.name}"
            if thumbnail_path.exists():
                thumbnail_path.unlink()

            return True
        return False
    except Exception as e:
        print(f"Failed to delete file {file_path}: {e}")
        return False
