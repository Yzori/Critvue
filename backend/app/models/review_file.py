"""Review File database model"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    BigInteger,
    String
)
from sqlalchemy.orm import relationship

from app.models.user import Base

if TYPE_CHECKING:
    from app.models.review_request import ReviewRequest


class ReviewFile(Base):
    """Review File model for managing uploaded files associated with review requests"""

    __tablename__ = "review_files"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to review request
    review_request_id = Column(
        Integer,
        ForeignKey("review_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # File metadata
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)  # Store user's original filename
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    file_type = Column(String(100), nullable=False)  # MIME type (e.g., image/png, video/mp4)

    # File storage information
    file_url = Column(String(1000), nullable=True)  # Public URL (for S3/cloud storage)
    file_path = Column(String(500), nullable=True)  # Local path or S3 key

    # File validation
    content_hash = Column(String(64), nullable=True)  # SHA-256 hash for integrity checking

    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    review_request = relationship("ReviewRequest", back_populates="files")

    def __repr__(self) -> str:
        return f"<ReviewFile {self.id}: {self.original_filename}>"

    @property
    def file_size_mb(self) -> float:
        """Get file size in megabytes"""
        return self.file_size / (1024 * 1024)

    @property
    def is_image(self) -> bool:
        """Check if file is an image"""
        return self.file_type.startswith("image/")

    @property
    def is_video(self) -> bool:
        """Check if file is a video"""
        return self.file_type.startswith("video/")

    @property
    def is_audio(self) -> bool:
        """Check if file is audio"""
        return self.file_type.startswith("audio/")

    @property
    def is_document(self) -> bool:
        """Check if file is a document"""
        document_types = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "application/rtf"
        ]
        return self.file_type in document_types
