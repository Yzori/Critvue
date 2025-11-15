"""
Image processing and validation service for avatar uploads.

This service handles:
- File type validation using magic numbers (not just extensions)
- Image dimension validation
- File size validation
- Image optimization and compression
- Thumbnail generation
- EXIF metadata extraction and stripping
- Security checks for malicious content
"""

import io
import logging
import magic
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
from PIL import Image, ImageOps
from PIL.Image import Resampling
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)

# Allowed MIME types with their magic number signatures
ALLOWED_MIME_TYPES = {
    'image/jpeg': [b'\xff\xd8\xff'],
    'image/png': [b'\x89PNG\r\n\x1a\n'],
    'image/webp': [b'RIFF', b'WEBP'],
    'image/gif': [b'GIF87a', b'GIF89a'],
}

# Maximum dimensions for uploaded images
MAX_IMAGE_WIDTH = 4096
MAX_IMAGE_HEIGHT = 4096
MIN_IMAGE_WIDTH = 100
MIN_IMAGE_HEIGHT = 100

# Target sizes for different variants
AVATAR_SIZES = {
    'thumbnail': (64, 64),
    'small': (128, 128),
    'medium': (256, 256),
    'large': (512, 512),
    'full': (1024, 1024),  # Max size for full version
}

# Image quality settings
JPEG_QUALITY = 85
WEBP_QUALITY = 85
PNG_COMPRESSION = 6


class ImageValidationError(Exception):
    """Raised when image validation fails"""
    pass


class ImageProcessingError(Exception):
    """Raised when image processing fails"""
    pass


class ImageService:
    """Service for handling image upload, validation, and processing"""

    def __init__(self, max_file_size: int = 5 * 1024 * 1024):
        """
        Initialize image service

        Args:
            max_file_size: Maximum file size in bytes (default 5MB)
        """
        self.max_file_size = max_file_size
        self.magic = magic.Magic(mime=True)

    async def validate_image(
        self,
        file_content: bytes,
        filename: str
    ) -> Tuple[str, Image.Image]:
        """
        Validate uploaded image file

        Performs multiple validation checks:
        1. File size
        2. MIME type using magic numbers
        3. File extension
        4. Image integrity (can be opened)
        5. Dimensions

        Args:
            file_content: Raw file bytes
            filename: Original filename

        Returns:
            Tuple of (mime_type, PIL Image object)

        Raises:
            ImageValidationError: If validation fails
        """
        # 1. Check file size
        if len(file_content) > self.max_file_size:
            max_mb = self.max_file_size / (1024 * 1024)
            raise ImageValidationError(
                f"File too large. Maximum size is {max_mb}MB"
            )

        if len(file_content) == 0:
            raise ImageValidationError("File is empty")

        # 2. Validate MIME type using magic numbers
        mime_type = self.magic.from_buffer(file_content)

        if mime_type not in ALLOWED_MIME_TYPES:
            raise ImageValidationError(
                f"Invalid file type: {mime_type}. "
                f"Allowed types: JPEG, PNG, WebP, GIF"
            )

        # 3. Validate file signature (magic numbers)
        if not self._validate_file_signature(file_content, mime_type):
            raise ImageValidationError(
                "File signature does not match expected format"
            )

        # 4. Validate file extension
        file_ext = Path(filename).suffix.lower()
        expected_extensions = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'image/gif': ['.gif'],
        }

        if file_ext not in expected_extensions.get(mime_type, []):
            raise ImageValidationError(
                f"File extension {file_ext} does not match file type {mime_type}"
            )

        # 5. Try to open and validate the image
        try:
            image = Image.open(io.BytesIO(file_content))
            image.verify()  # Verify it's a valid image

            # Reopen after verify (verify closes the file)
            image = Image.open(io.BytesIO(file_content))

        except Exception as e:
            logger.error(f"Failed to open image: {e}")
            raise ImageValidationError(f"Invalid or corrupted image file: {str(e)}")

        # 6. Validate dimensions
        width, height = image.size

        if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:
            raise ImageValidationError(
                f"Image dimensions too large. Maximum: {MAX_IMAGE_WIDTH}x{MAX_IMAGE_HEIGHT}px"
            )

        if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
            raise ImageValidationError(
                f"Image dimensions too small. Minimum: {MIN_IMAGE_WIDTH}x{MIN_IMAGE_HEIGHT}px"
            )

        # 7. Check for animated GIFs (optional - can disable animations)
        if mime_type == 'image/gif':
            try:
                image.seek(1)
                # If we can seek to frame 1, it's animated
                logger.warning(f"Animated GIF detected: {filename}")
                # We'll allow it but only use the first frame
                image.seek(0)
            except EOFError:
                # Not animated, which is fine
                pass

        logger.info(
            f"Image validated successfully: {mime_type}, "
            f"{width}x{height}px, {len(file_content)} bytes"
        )

        return mime_type, image

    def _validate_file_signature(self, file_content: bytes, mime_type: str) -> bool:
        """
        Validate file signature (magic numbers) matches the MIME type

        Args:
            file_content: Raw file bytes
            mime_type: Detected MIME type

        Returns:
            True if signature is valid, False otherwise
        """
        signatures = ALLOWED_MIME_TYPES.get(mime_type, [])

        for signature in signatures:
            if file_content.startswith(signature):
                return True

        # Special case for WebP (RIFF container)
        if mime_type == 'image/webp':
            return file_content.startswith(b'RIFF') and b'WEBP' in file_content[:12]

        return False

    async def extract_metadata(self, image: Image.Image) -> Dict[str, Any]:
        """
        Extract metadata from image

        Args:
            image: PIL Image object

        Returns:
            Dictionary containing metadata
        """
        metadata = {
            'width': image.width,
            'height': image.height,
            'format': image.format,
            'mode': image.mode,
        }

        # Extract EXIF data if available
        try:
            exif_data = image.getexif()
            if exif_data:
                # Extract useful EXIF fields
                # 271: Make (Camera manufacturer)
                # 272: Model (Camera model)
                # 274: Orientation
                # 306: DateTime

                metadata['exif'] = {
                    'make': exif_data.get(271),
                    'model': exif_data.get(272),
                    'orientation': exif_data.get(274),
                    'datetime': exif_data.get(306),
                }

                logger.info(f"Extracted EXIF metadata: {metadata['exif']}")
        except Exception as e:
            logger.warning(f"Failed to extract EXIF data: {e}")

        return metadata

    async def optimize_image(
        self,
        image: Image.Image,
        size_name: str = 'full',
        strip_metadata: bool = True
    ) -> Tuple[bytes, str]:
        """
        Optimize image: resize, compress, and optionally strip metadata

        Args:
            image: PIL Image object
            size_name: Size variant name (thumbnail, small, medium, large, full)
            strip_metadata: Whether to strip EXIF and other metadata

        Returns:
            Tuple of (optimized image bytes, format)

        Raises:
            ImageProcessingError: If processing fails
        """
        try:
            # Get target size
            target_size = AVATAR_SIZES.get(size_name, AVATAR_SIZES['full'])

            # Convert RGBA to RGB for JPEG
            if image.mode in ('RGBA', 'LA', 'P'):
                # Create white background
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                image = background
            elif image.mode not in ('RGB', 'L'):
                image = image.convert('RGB')

            # Apply orientation from EXIF if present
            image = ImageOps.exif_transpose(image)

            # Resize image maintaining aspect ratio
            image.thumbnail(target_size, Resampling.LANCZOS)

            # Save to bytes buffer
            output_buffer = io.BytesIO()

            # Determine output format
            original_format = image.format
            output_format = 'JPEG'  # Default to JPEG for better compression

            # Use WebP if original was WebP
            if original_format == 'WEBP':
                output_format = 'WEBP'

            # Save with optimization
            save_kwargs = {}

            if output_format == 'JPEG':
                save_kwargs = {
                    'quality': JPEG_QUALITY,
                    'optimize': True,
                    'progressive': True,  # Progressive JPEG for better perceived load
                }
            elif output_format == 'WEBP':
                save_kwargs = {
                    'quality': WEBP_QUALITY,
                    'method': 6,  # Maximum compression effort
                }
            elif output_format == 'PNG':
                save_kwargs = {
                    'optimize': True,
                    'compress_level': PNG_COMPRESSION,
                }

            # Strip metadata if requested
            if strip_metadata:
                save_kwargs['exif'] = b''

            image.save(output_buffer, format=output_format, **save_kwargs)

            optimized_bytes = output_buffer.getvalue()

            logger.info(
                f"Image optimized: {size_name} variant, "
                f"{image.width}x{image.height}px, "
                f"{len(optimized_bytes)} bytes"
            )

            return optimized_bytes, output_format.lower()

        except Exception as e:
            logger.error(f"Failed to optimize image: {e}")
            raise ImageProcessingError(f"Image optimization failed: {str(e)}")

    async def generate_variants(
        self,
        image: Image.Image,
        strip_metadata: bool = True
    ) -> Dict[str, Tuple[bytes, str]]:
        """
        Generate multiple size variants of the image

        Args:
            image: PIL Image object
            strip_metadata: Whether to strip EXIF and other metadata

        Returns:
            Dictionary mapping size name to (image bytes, format) tuple
        """
        variants = {}

        for size_name in AVATAR_SIZES.keys():
            try:
                # Create a copy of the image for each variant
                img_copy = image.copy()
                optimized_bytes, fmt = await self.optimize_image(
                    img_copy,
                    size_name,
                    strip_metadata
                )
                variants[size_name] = (optimized_bytes, fmt)
            except Exception as e:
                logger.error(f"Failed to generate {size_name} variant: {e}")
                # Continue with other variants even if one fails

        return variants

    def generate_secure_filename(
        self,
        user_id: int,
        original_filename: str,
        file_format: str
    ) -> str:
        """
        Generate a secure, unique filename

        Args:
            user_id: User ID
            original_filename: Original filename
            file_format: File format (jpeg, png, webp, gif)

        Returns:
            Secure filename
        """
        # Generate hash of user_id + timestamp + original filename
        timestamp = datetime.utcnow().isoformat()
        hash_input = f"{user_id}_{timestamp}_{original_filename}".encode('utf-8')
        file_hash = hashlib.sha256(hash_input).hexdigest()[:16]

        # Format: avatar_{user_id}_{hash}.{ext}
        extension_map = {
            'jpeg': 'jpg',
            'jpg': 'jpg',
            'png': 'png',
            'webp': 'webp',
            'gif': 'gif',
        }

        ext = extension_map.get(file_format.lower(), 'jpg')
        filename = f"avatar_{user_id}_{file_hash}.{ext}"

        return filename

    def sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to prevent path traversal and other attacks

        Args:
            filename: Original filename

        Returns:
            Sanitized filename
        """
        # Remove path components
        filename = Path(filename).name

        # Remove dangerous characters
        dangerous_chars = ['..', '/', '\\', '\0', '<', '>', ':', '"', '|', '?', '*']
        for char in dangerous_chars:
            filename = filename.replace(char, '_')

        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            filename = name[:250] + ('.' + ext if ext else '')

        return filename

    async def check_image_content(self, image: Image.Image) -> bool:
        """
        Basic content safety check

        This is a placeholder for more sophisticated checks.
        In production, you might integrate with:
        - Cloud Vision API for content moderation
        - ClamAV for virus scanning
        - Custom ML models for inappropriate content detection

        Args:
            image: PIL Image object

        Returns:
            True if image passes safety checks
        """
        # Basic checks

        # 1. Check if image is too uniform (might be corrupted or suspicious)
        try:
            extrema = image.getextrema()
            # For RGB images, check if all channels have some variation
            if isinstance(extrema[0], tuple):
                for channel_min, channel_max in extrema:
                    if channel_min == channel_max:
                        logger.warning("Image has no variation in one or more channels")
                        return False
        except Exception as e:
            logger.warning(f"Failed to check image extrema: {e}")

        # 2. Additional checks could go here
        # - Check for steganography
        # - Check for known malicious patterns
        # - API-based content moderation

        return True
