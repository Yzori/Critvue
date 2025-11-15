"""
Comprehensive tests for avatar upload functionality

Tests cover:
- Image validation (file type, size, dimensions)
- Image processing (optimization, variant generation)
- Storage operations (save, retrieve, delete)
- API endpoints (upload, delete, retrieve)
- Security measures (path traversal, malicious files)
- Error handling
"""

import io
import os
import pytest
from pathlib import Path
from PIL import Image
from fastapi import UploadFile
from app.services.image_service import (
    ImageService,
    ImageValidationError,
    ImageProcessingError,
)
from app.services.storage_service import StorageService, StorageError


# Fixtures

@pytest.fixture
def image_service():
    """Image service instance"""
    return ImageService(max_file_size=5 * 1024 * 1024)


@pytest.fixture
def storage_service(tmp_path):
    """Storage service instance with temp directory"""
    return StorageService(
        storage_type="local",
        base_path=tmp_path / "avatars",
        base_url="/files/avatars"
    )


@pytest.fixture
def valid_jpeg_image():
    """Create a valid JPEG image for testing"""
    img = Image.new('RGB', (500, 500), color='red')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    return buffer.getvalue()


@pytest.fixture
def valid_png_image():
    """Create a valid PNG image for testing"""
    img = Image.new('RGB', (500, 500), color='blue')
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()


@pytest.fixture
def valid_webp_image():
    """Create a valid WebP image for testing"""
    img = Image.new('RGB', (500, 500), color='green')
    buffer = io.BytesIO()
    img.save(buffer, format='WEBP', quality=85)
    return buffer.getvalue()


@pytest.fixture
def large_image():
    """Create an image that exceeds size limits"""
    img = Image.new('RGB', (5000, 5000), color='white')
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', compress_level=0)  # No compression for larger size
    return buffer.getvalue()


@pytest.fixture
def small_image():
    """Create an image below minimum dimensions"""
    img = Image.new('RGB', (50, 50), color='yellow')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    return buffer.getvalue()


@pytest.fixture
def image_with_exif():
    """Create an image with EXIF data"""
    img = Image.new('RGB', (500, 500), color='cyan')
    buffer = io.BytesIO()

    # Add EXIF data
    exif = img.getexif()
    exif[271] = "Test Camera"  # Make
    exif[272] = "Test Model"   # Model

    img.save(buffer, format='JPEG', quality=85, exif=exif)
    return buffer.getvalue()


# Image Validation Tests

class TestImageValidation:
    """Test image validation logic"""

    @pytest.mark.asyncio
    async def test_validate_valid_jpeg(self, image_service, valid_jpeg_image):
        """Test validation of valid JPEG image"""
        mime_type, image = await image_service.validate_image(
            valid_jpeg_image,
            "test.jpg"
        )

        assert mime_type == "image/jpeg"
        assert image.size == (500, 500)

    @pytest.mark.asyncio
    async def test_validate_valid_png(self, image_service, valid_png_image):
        """Test validation of valid PNG image"""
        mime_type, image = await image_service.validate_image(
            valid_png_image,
            "test.png"
        )

        assert mime_type == "image/png"
        assert image.size == (500, 500)

    @pytest.mark.asyncio
    async def test_validate_valid_webp(self, image_service, valid_webp_image):
        """Test validation of valid WebP image"""
        mime_type, image = await image_service.validate_image(
            valid_webp_image,
            "test.webp"
        )

        assert mime_type == "image/webp"
        assert image.size == (500, 500)

    @pytest.mark.asyncio
    async def test_reject_empty_file(self, image_service):
        """Test rejection of empty file"""
        with pytest.raises(ImageValidationError, match="File is empty"):
            await image_service.validate_image(b"", "test.jpg")

    @pytest.mark.asyncio
    async def test_reject_too_large_file(self, image_service):
        """Test rejection of file exceeding size limit"""
        # Create file larger than 5MB
        large_content = b"x" * (6 * 1024 * 1024)

        with pytest.raises(ImageValidationError, match="File too large"):
            await image_service.validate_image(large_content, "test.jpg")

    @pytest.mark.asyncio
    async def test_reject_wrong_extension(self, image_service, valid_jpeg_image):
        """Test rejection when extension doesn't match content"""
        with pytest.raises(ImageValidationError, match="extension.*does not match"):
            await image_service.validate_image(valid_jpeg_image, "test.png")

    @pytest.mark.asyncio
    async def test_reject_invalid_mime_type(self, image_service):
        """Test rejection of non-image file"""
        # Create a text file
        text_content = b"This is not an image"

        with pytest.raises(ImageValidationError, match="Invalid file type"):
            await image_service.validate_image(text_content, "test.txt")

    @pytest.mark.asyncio
    async def test_reject_corrupted_image(self, image_service):
        """Test rejection of corrupted image file"""
        # Create corrupted JPEG (valid header but corrupted data)
        corrupted = b'\xff\xd8\xff\xe0' + b'corrupted_data' + b'\xff\xd9'

        with pytest.raises(ImageValidationError, match="Invalid or corrupted"):
            await image_service.validate_image(corrupted, "test.jpg")

    @pytest.mark.asyncio
    async def test_reject_oversized_dimensions(self, image_service):
        """Test rejection of image with excessive dimensions"""
        # Create image larger than max dimensions
        img = Image.new('RGB', (5000, 5000), color='white')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=50)

        with pytest.raises(ImageValidationError, match="dimensions too large"):
            await image_service.validate_image(buffer.getvalue(), "test.jpg")

    @pytest.mark.asyncio
    async def test_reject_undersized_dimensions(self, image_service, small_image):
        """Test rejection of image below minimum dimensions"""
        with pytest.raises(ImageValidationError, match="dimensions too small"):
            await image_service.validate_image(small_image, "test.jpg")


# Image Processing Tests

class TestImageProcessing:
    """Test image processing and optimization"""

    @pytest.mark.asyncio
    async def test_extract_metadata(self, image_service, valid_jpeg_image):
        """Test metadata extraction"""
        _, image = await image_service.validate_image(valid_jpeg_image, "test.jpg")
        metadata = await image_service.extract_metadata(image)

        assert metadata['width'] == 500
        assert metadata['height'] == 500
        assert metadata['format'] == 'JPEG'

    @pytest.mark.asyncio
    async def test_extract_exif_metadata(self, image_service, image_with_exif):
        """Test EXIF metadata extraction"""
        _, image = await image_service.validate_image(image_with_exif, "test.jpg")
        metadata = await image_service.extract_metadata(image)

        assert 'exif' in metadata
        assert metadata['exif']['make'] == "Test Camera"
        assert metadata['exif']['model'] == "Test Model"

    @pytest.mark.asyncio
    async def test_optimize_image(self, image_service, valid_jpeg_image):
        """Test image optimization"""
        _, image = await image_service.validate_image(valid_jpeg_image, "test.jpg")

        optimized_bytes, fmt = await image_service.optimize_image(
            image,
            size_name='medium',
            strip_metadata=True
        )

        # Check that optimized image is smaller or similar size
        assert len(optimized_bytes) <= len(valid_jpeg_image)
        assert fmt in ['jpeg', 'jpg', 'webp']

    @pytest.mark.asyncio
    async def test_generate_variants(self, image_service, valid_jpeg_image):
        """Test generation of multiple image variants"""
        _, image = await image_service.validate_image(valid_jpeg_image, "test.jpg")

        variants = await image_service.generate_variants(image, strip_metadata=True)

        # Should have all size variants
        expected_sizes = ['thumbnail', 'small', 'medium', 'large', 'full']
        assert all(size in variants for size in expected_sizes)

        # Each variant should have bytes and format
        for size, (img_bytes, fmt) in variants.items():
            assert isinstance(img_bytes, bytes)
            assert len(img_bytes) > 0
            assert fmt in ['jpeg', 'jpg', 'webp', 'png']

    @pytest.mark.asyncio
    async def test_strip_metadata(self, image_service, image_with_exif):
        """Test that metadata is stripped when requested"""
        _, image = await image_service.validate_image(image_with_exif, "test.jpg")

        # Optimize with metadata stripping
        optimized_bytes, _ = await image_service.optimize_image(
            image,
            size_name='full',
            strip_metadata=True
        )

        # Check that EXIF is removed
        optimized_image = Image.open(io.BytesIO(optimized_bytes))
        exif = optimized_image.getexif()

        # Should have no EXIF data or minimal EXIF
        assert len(exif) == 0 or 271 not in exif  # Make field should be removed

    @pytest.mark.asyncio
    async def test_thumbnail_size(self, image_service, valid_jpeg_image):
        """Test that thumbnail is properly resized"""
        _, image = await image_service.validate_image(valid_jpeg_image, "test.jpg")

        optimized_bytes, _ = await image_service.optimize_image(
            image,
            size_name='thumbnail',
            strip_metadata=True
        )

        optimized_image = Image.open(io.BytesIO(optimized_bytes))

        # Thumbnail should be 64x64 or smaller (maintaining aspect ratio)
        assert optimized_image.width <= 64
        assert optimized_image.height <= 64


# Storage Service Tests

class TestStorageService:
    """Test storage operations"""

    @pytest.mark.asyncio
    async def test_save_file(self, storage_service, valid_jpeg_image):
        """Test saving file to storage"""
        filename = "test_avatar.jpg"
        relative_path = await storage_service.save_file(
            valid_jpeg_image,
            filename
        )

        assert relative_path == filename
        assert await storage_service.file_exists(relative_path)

    @pytest.mark.asyncio
    async def test_save_file_with_subdirectory(self, storage_service, valid_jpeg_image):
        """Test saving file to subdirectory"""
        filename = "test_avatar.jpg"
        relative_path = await storage_service.save_file(
            valid_jpeg_image,
            filename,
            subdirectory="medium"
        )

        assert "medium" in relative_path
        assert await storage_service.file_exists(relative_path)

    @pytest.mark.asyncio
    async def test_delete_file(self, storage_service, valid_jpeg_image):
        """Test deleting file from storage"""
        filename = "test_avatar.jpg"
        relative_path = await storage_service.save_file(valid_jpeg_image, filename)

        # File should exist
        assert await storage_service.file_exists(relative_path)

        # Delete file
        deleted = await storage_service.delete_file(relative_path)
        assert deleted is True

        # File should no longer exist
        assert not await storage_service.file_exists(relative_path)

    @pytest.mark.asyncio
    async def test_delete_user_avatars(self, storage_service, valid_jpeg_image):
        """Test deleting all avatars for a user"""
        user_id = 123

        # Save multiple variants
        for size in ['thumbnail', 'small', 'medium']:
            filename = f"avatar_{user_id}_abc123.jpg"
            await storage_service.save_file(
                valid_jpeg_image,
                filename,
                subdirectory=size
            )

        # Delete all user avatars
        deleted_count = await storage_service.delete_user_avatars(user_id)

        assert deleted_count == 3

    @pytest.mark.asyncio
    async def test_get_file_info(self, storage_service, valid_jpeg_image):
        """Test retrieving file metadata"""
        filename = "test_avatar.jpg"
        relative_path = await storage_service.save_file(valid_jpeg_image, filename)

        file_info = await storage_service.get_file_info(relative_path)

        assert file_info is not None
        assert file_info['size'] == len(valid_jpeg_image)
        assert 'created' in file_info
        assert 'modified' in file_info

    @pytest.mark.asyncio
    async def test_get_file_url(self, storage_service):
        """Test URL generation"""
        relative_path = "medium/avatar_123_abc.jpg"
        url = storage_service.get_file_url(relative_path)

        assert url.startswith("/files/avatars/")
        assert "avatar_123_abc.jpg" in url

    @pytest.mark.asyncio
    async def test_prevent_path_traversal(self, storage_service, valid_jpeg_image):
        """Test protection against path traversal attacks"""
        # Try to save file with path traversal
        malicious_filename = "../../etc/passwd"

        # Should not raise exception but should sanitize path
        relative_path = await storage_service.save_file(
            valid_jpeg_image,
            malicious_filename
        )

        # Path should be sanitized (no traversal)
        assert ".." not in relative_path
        assert not relative_path.startswith("/etc")


# Security Tests

class TestSecurity:
    """Test security features"""

    def test_sanitize_filename(self, image_service):
        """Test filename sanitization"""
        dangerous_filenames = [
            "../../../etc/passwd",
            "test<script>.jpg",
            "test|command.jpg",
            "test\0null.jpg",
            "a" * 300 + ".jpg",  # Very long filename
        ]

        for dangerous in dangerous_filenames:
            sanitized = image_service.sanitize_filename(dangerous)

            # Should not contain dangerous characters
            assert ".." not in sanitized
            assert "<" not in sanitized
            assert ">" not in sanitized
            assert "|" not in sanitized
            assert "\0" not in sanitized
            assert len(sanitized) <= 255

    def test_generate_secure_filename(self, image_service):
        """Test secure filename generation"""
        user_id = 123
        original_filename = "my photo.jpg"

        filename1 = image_service.generate_secure_filename(user_id, original_filename, "jpeg")
        filename2 = image_service.generate_secure_filename(user_id, original_filename, "jpeg")

        # Filenames should be different (contain unique hash)
        assert filename1 != filename2

        # Should contain user_id
        assert f"avatar_{user_id}_" in filename1

        # Should have proper extension
        assert filename1.endswith(".jpg")

    @pytest.mark.asyncio
    async def test_reject_executable_disguised_as_image(self, image_service):
        """Test rejection of executable files with image extension"""
        # Create fake executable with JPEG extension
        fake_image = b"MZ\x90\x00" + b"\x00" * 100  # DOS executable header

        with pytest.raises(ImageValidationError):
            await image_service.validate_image(fake_image, "malware.jpg")

    @pytest.mark.asyncio
    async def test_content_safety_check(self, image_service, valid_jpeg_image):
        """Test basic content safety check"""
        _, image = await image_service.validate_image(valid_jpeg_image, "test.jpg")

        is_safe = await image_service.check_image_content(image)

        # Valid image should pass safety check
        assert is_safe is True


# Integration Tests

class TestIntegration:
    """Test complete upload workflow"""

    @pytest.mark.asyncio
    async def test_complete_upload_workflow(
        self,
        image_service,
        storage_service,
        valid_jpeg_image
    ):
        """Test complete upload workflow from validation to storage"""
        user_id = 456
        filename = "profile_photo.jpg"

        # 1. Validate image
        mime_type, image = await image_service.validate_image(
            valid_jpeg_image,
            filename
        )
        assert mime_type == "image/jpeg"

        # 2. Extract metadata
        metadata = await image_service.extract_metadata(image)
        assert metadata['width'] == 500

        # 3. Generate variants
        variants = await image_service.generate_variants(image, strip_metadata=True)
        assert len(variants) == 5

        # 4. Generate secure filename
        secure_filename = image_service.generate_secure_filename(
            user_id,
            filename,
            "jpeg"
        )
        assert "avatar_456_" in secure_filename

        # 5. Save all variants
        saved_paths = {}
        for size_name, (img_bytes, fmt) in variants.items():
            name_parts = secure_filename.rsplit('.', 1)
            variant_filename = f"{name_parts[0]}_{size_name}.{name_parts[1]}"

            relative_path = await storage_service.save_file(
                img_bytes,
                variant_filename,
                subdirectory=size_name
            )
            saved_paths[size_name] = relative_path

        # 6. Verify all files saved
        assert len(saved_paths) == 5
        for path in saved_paths.values():
            assert await storage_service.file_exists(path)

        # 7. Delete all user avatars
        deleted_count = await storage_service.delete_user_avatars(user_id)
        assert deleted_count == 5

        # 8. Verify all files deleted
        for path in saved_paths.values():
            assert not await storage_service.file_exists(path)


# Performance Tests

class TestPerformance:
    """Test performance characteristics"""

    @pytest.mark.asyncio
    async def test_optimization_reduces_size(self, image_service):
        """Test that optimization actually reduces file size"""
        # Create uncompressed image
        img = Image.new('RGB', (1000, 1000), color='red')
        buffer = io.BytesIO()
        img.save(buffer, format='PNG', compress_level=0)  # No compression
        original_size = len(buffer.getvalue())

        # Validate and optimize
        _, image = await image_service.validate_image(buffer.getvalue(), "test.png")
        optimized_bytes, _ = await image_service.optimize_image(
            image,
            size_name='full',
            strip_metadata=True
        )

        # Optimized should be significantly smaller
        assert len(optimized_bytes) < original_size * 0.8  # At least 20% reduction

    @pytest.mark.asyncio
    async def test_variant_generation_time(self, image_service, valid_jpeg_image):
        """Test that variant generation completes in reasonable time"""
        import time

        _, image = await image_service.validate_image(valid_jpeg_image, "test.jpg")

        start_time = time.time()
        variants = await image_service.generate_variants(image, strip_metadata=True)
        elapsed_time = time.time() - start_time

        # Should complete in less than 2 seconds for a 500x500 image
        assert elapsed_time < 2.0
        assert len(variants) == 5
