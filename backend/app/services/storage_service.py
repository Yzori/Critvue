"""
Storage service for managing avatar files.

Supports:
- Local filesystem storage with security controls
- Cloud storage integration (ready for UploadThing, Cloudinary, S3, etc.)
- File lifecycle management (upload, retrieve, delete)
- Automatic cleanup of old files
- CDN-ready URL generation
"""

import os
import shutil
import logging
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
import aiofiles
import aiofiles.os

logger = logging.getLogger(__name__)


class StorageError(Exception):
    """Raised when storage operations fail"""
    pass


class StorageService:
    """Service for managing file storage"""

    def __init__(
        self,
        storage_type: str = "local",
        base_path: Optional[Path | str] = None,
        base_url: Optional[str] = None,
    ):
        """
        Initialize storage service

        Args:
            storage_type: Type of storage ("local", "cloud")
            base_path: Base path for local storage (Path or str)
            base_url: Base URL for accessing files
        """
        self.storage_type = storage_type
        # Ensure base_path is a Path object, whether input is str or Path
        if base_path is None:
            self.base_path = Path("/home/user/Critvue/backend/uploads/avatars")
        elif isinstance(base_path, str):
            self.base_path = Path(base_path)
        else:
            self.base_path = base_path
        self.base_url = base_url or "/files/avatars"

        # Ensure base directory exists with proper permissions
        if storage_type == "local":
            self._ensure_directory_exists(self.base_path)

    def _ensure_directory_exists(self, path: Path) -> None:
        """
        Ensure directory exists with proper permissions

        Args:
            path: Directory path

        Raises:
            StorageError: If directory cannot be created
        """
        try:
            path.mkdir(parents=True, exist_ok=True)

            # Set proper permissions (owner read/write/execute only)
            # This prevents unauthorized access
            os.chmod(path, 0o700)

            logger.info(f"Storage directory ensured: {path}")

        except Exception as e:
            logger.error(f"Failed to create storage directory: {e}")
            raise StorageError(f"Cannot create storage directory: {str(e)}")

    async def save_file(
        self,
        file_content: bytes,
        filename: str,
        subdirectory: Optional[str] = None
    ) -> str:
        """
        Save file to storage

        Args:
            file_content: File bytes
            filename: Sanitized filename
            subdirectory: Optional subdirectory (e.g., "thumbnails", "full")

        Returns:
            Relative file path

        Raises:
            StorageError: If save operation fails
        """
        try:
            # Determine full path
            if subdirectory:
                storage_path = self.base_path / subdirectory
                self._ensure_directory_exists(storage_path)
            else:
                storage_path = self.base_path

            file_path = storage_path / filename

            # Ensure we're not writing outside the base path (security check)
            if not self._is_safe_path(file_path):
                raise StorageError("Invalid file path detected")

            # Check if file already exists
            if await aiofiles.os.path.exists(file_path):
                logger.warning(f"File already exists, will be overwritten: {file_path}")

            # Write file asynchronously
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_content)

            # Set file permissions (owner read/write only)
            os.chmod(file_path, 0o600)

            # Return relative path
            relative_path = str(file_path.relative_to(self.base_path))

            logger.info(f"File saved successfully: {relative_path} ({len(file_content)} bytes)")

            return relative_path

        except Exception as e:
            logger.error(f"Failed to save file {filename}: {e}")
            raise StorageError(f"Cannot save file: {str(e)}")

    async def save_variants(
        self,
        variants: Dict[str, bytes],
        base_filename: str
    ) -> Dict[str, str]:
        """
        Save multiple image variants

        Args:
            variants: Dictionary mapping size name to file bytes
            base_filename: Base filename (without size suffix)

        Returns:
            Dictionary mapping size name to file path
        """
        saved_paths = {}

        for size_name, file_bytes in variants.items():
            try:
                # Create filename with size suffix
                name_parts = base_filename.rsplit('.', 1)
                if len(name_parts) == 2:
                    filename = f"{name_parts[0]}_{size_name}.{name_parts[1]}"
                else:
                    filename = f"{base_filename}_{size_name}"

                # Save to subdirectory based on size
                relative_path = await self.save_file(
                    file_bytes,
                    filename,
                    subdirectory=size_name
                )

                saved_paths[size_name] = relative_path

            except Exception as e:
                logger.error(f"Failed to save {size_name} variant: {e}")
                # Continue with other variants even if one fails

        return saved_paths

    async def delete_file(self, relative_path: str) -> bool:
        """
        Delete file from storage

        Args:
            relative_path: Relative file path

        Returns:
            True if file was deleted, False otherwise
        """
        try:
            file_path = self.base_path / relative_path

            # Security check
            if not self._is_safe_path(file_path):
                logger.error(f"Unsafe path detected: {relative_path}")
                return False

            # Check if file exists
            if not await aiofiles.os.path.exists(file_path):
                logger.warning(f"File not found for deletion: {file_path}")
                return False

            # Delete file
            await aiofiles.os.remove(file_path)

            logger.info(f"File deleted: {relative_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete file {relative_path}: {e}")
            return False

    async def delete_user_avatars(self, user_id: int) -> int:
        """
        Delete all avatar files for a user

        Args:
            user_id: User ID

        Returns:
            Number of files deleted
        """
        deleted_count = 0

        try:
            # Search for all files matching user pattern
            pattern = f"avatar_{user_id}_*"

            # Search in base directory and all subdirectories
            for size_dir in ['thumbnail', 'small', 'medium', 'large', 'full']:
                search_path = self.base_path / size_dir
                if search_path.exists():
                    for file_path in search_path.glob(pattern):
                        if await self.delete_file(str(file_path.relative_to(self.base_path))):
                            deleted_count += 1

            # Also search in base directory
            for file_path in self.base_path.glob(pattern):
                if file_path.is_file():
                    if await self.delete_file(str(file_path.relative_to(self.base_path))):
                        deleted_count += 1

            logger.info(f"Deleted {deleted_count} avatar files for user {user_id}")

        except Exception as e:
            logger.error(f"Error deleting avatars for user {user_id}: {e}")

        return deleted_count

    async def file_exists(self, relative_path: str) -> bool:
        """
        Check if file exists

        Args:
            relative_path: Relative file path

        Returns:
            True if file exists, False otherwise
        """
        try:
            file_path = self.base_path / relative_path

            if not self._is_safe_path(file_path):
                return False

            return await aiofiles.os.path.exists(file_path)

        except Exception as e:
            logger.error(f"Error checking file existence: {e}")
            return False

    async def get_file_info(self, relative_path: str) -> Optional[Dict]:
        """
        Get file metadata

        Args:
            relative_path: Relative file path

        Returns:
            Dictionary with file info or None if file not found
        """
        try:
            file_path = self.base_path / relative_path

            if not self._is_safe_path(file_path):
                return None

            if not await aiofiles.os.path.exists(file_path):
                return None

            stat = await aiofiles.os.stat(file_path)

            return {
                'size': stat.st_size,
                'created': datetime.fromtimestamp(stat.st_ctime),
                'modified': datetime.fromtimestamp(stat.st_mtime),
                'path': relative_path,
            }

        except Exception as e:
            logger.error(f"Error getting file info: {e}")
            return None

    def get_file_url(self, relative_path: str, size: str = 'medium') -> str:
        """
        Generate URL for accessing file

        Args:
            relative_path: Relative file path
            size: Image size variant

        Returns:
            Public URL for file
        """
        # For local storage, construct URL based on base_url
        # For cloud storage, this would return the CDN URL

        if self.storage_type == "local":
            # Convert path separators to URL format
            url_path = relative_path.replace(os.sep, '/')
            return f"{self.base_url}/{url_path}"

        # Placeholder for cloud storage URL generation
        return f"{self.base_url}/{relative_path}"

    def get_variant_url(self, base_filename: str, size: str = 'medium') -> str:
        """
        Get URL for a specific image variant

        Args:
            base_filename: Base filename
            size: Image size variant (thumbnail, small, medium, large, full)

        Returns:
            URL for the variant
        """
        name_parts = base_filename.rsplit('.', 1)
        if len(name_parts) == 2:
            variant_filename = f"{name_parts[0]}_{size}.{name_parts[1]}"
        else:
            variant_filename = f"{base_filename}_{size}"

        return self.get_file_url(f"{size}/{variant_filename}")

    def _is_safe_path(self, file_path: Path) -> bool:
        """
        Check if path is safe (within base directory)

        Prevents path traversal attacks

        Args:
            file_path: File path to check

        Returns:
            True if path is safe, False otherwise
        """
        try:
            # Resolve to absolute path
            resolved_path = file_path.resolve()
            resolved_base = self.base_path.resolve()

            # Check if file path is within base path
            return resolved_path.parts[:len(resolved_base.parts)] == resolved_base.parts

        except Exception as e:
            logger.error(f"Error checking path safety: {e}")
            return False

    async def cleanup_old_files(self, days: int = 30) -> int:
        """
        Clean up files older than specified days

        Useful for removing orphaned files or temporary uploads

        Args:
            days: Delete files older than this many days

        Returns:
            Number of files deleted
        """
        deleted_count = 0
        cutoff_time = datetime.now().timestamp() - (days * 86400)

        try:
            for root, dirs, files in os.walk(self.base_path):
                for filename in files:
                    file_path = Path(root) / filename

                    try:
                        # Check file modification time
                        mtime = os.path.getmtime(file_path)

                        if mtime < cutoff_time:
                            await aiofiles.os.remove(file_path)
                            deleted_count += 1
                            logger.info(f"Cleaned up old file: {file_path}")

                    except Exception as e:
                        logger.error(f"Error processing file {file_path}: {e}")

            logger.info(f"Cleanup completed: {deleted_count} files deleted")

        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

        return deleted_count

    async def get_storage_stats(self) -> Dict:
        """
        Get storage statistics

        Returns:
            Dictionary with storage statistics
        """
        stats = {
            'total_files': 0,
            'total_size': 0,
            'by_size': {},
        }

        try:
            for root, dirs, files in os.walk(self.base_path):
                for filename in files:
                    file_path = Path(root) / filename

                    try:
                        size = os.path.getsize(file_path)
                        stats['total_files'] += 1
                        stats['total_size'] += size

                        # Track by subdirectory
                        subdir = Path(root).name
                        if subdir not in stats['by_size']:
                            stats['by_size'][subdir] = {'count': 0, 'size': 0}

                        stats['by_size'][subdir]['count'] += 1
                        stats['by_size'][subdir]['size'] += size

                    except Exception as e:
                        logger.error(f"Error processing file {file_path}: {e}")

        except Exception as e:
            logger.error(f"Error getting storage stats: {e}")

        return stats
