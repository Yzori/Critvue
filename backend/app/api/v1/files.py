"""File upload API endpoints for review requests"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.review_file import ReviewFile
from app.schemas.review import ReviewFileCreate, ReviewFileResponse
from app.crud.review import review_crud
from app.utils.file_utils import process_upload, delete_file
from app.core.logging_config import security_logger

router = APIRouter(prefix="/reviews", tags=["Files"])


@router.post(
    "/{review_id}/files",
    response_model=ReviewFileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file to a review request"
)
async def upload_review_file(
    review_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReviewFileResponse:
    """
    Upload a file to a specific review request.

    This endpoint handles:
    - File type validation based on review content type
    - File size validation
    - Secure file storage
    - Thumbnail generation for images
    - Metadata extraction

    Args:
        review_id: ID of the review request
        file: The file to upload
        current_user: Currently authenticated user
        db: Database session

    Returns:
        Created file record with metadata

    Raises:
        HTTPException: If validation fails or user doesn't own the review
    """
    try:
        # Get the review request and verify ownership
        review = await review_crud.get_review_request(
            db=db,
            review_id=review_id,
            user_id=current_user.id
        )

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        # Check if review is editable
        if not review.is_editable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot upload files to review in '{review.status.value}' status"
            )

        # Process the file upload
        file_metadata = await process_upload(
            file=file,
            content_type=review.content_type.value
        )

        # Create file record in database
        file_data = ReviewFileCreate(**file_metadata)
        review_file = await review_crud.add_file_to_review(
            db=db,
            review_id=review_id,
            user_id=current_user.id,
            file_data=file_data
        )

        if not review_file:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file metadata"
            )

        security_logger.logger.info(
            f"File uploaded: review_id={review_id}, file_id={review_file.id}, "
            f"user={current_user.email}, size={review_file.file_size_mb:.2f}MB"
        )

        return ReviewFileResponse.model_validate(review_file)

    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(
            f"Failed to upload file for review {review_id}, user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.post(
    "/{review_id}/files/batch",
    response_model=List[ReviewFileResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload multiple files to a review request"
)
async def upload_review_files_batch(
    review_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[ReviewFileResponse]:
    """
    Upload multiple files to a specific review request in batch.

    Args:
        review_id: ID of the review request
        files: List of files to upload
        current_user: Currently authenticated user
        db: Database session

    Returns:
        List of created file records

    Raises:
        HTTPException: If validation fails or user doesn't own the review
    """
    try:
        # Get the review request and verify ownership
        review = await review_crud.get_review_request(
            db=db,
            review_id=review_id,
            user_id=current_user.id
        )

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        # Check if review is editable
        if not review.is_editable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot upload files to review in '{review.status.value}' status"
            )

        # Limit number of files in batch
        if len(files) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot upload more than 10 files at once"
            )

        uploaded_files = []
        errors = []

        # Process each file
        for file in files:
            try:
                # Process the file upload
                file_metadata = await process_upload(
                    file=file,
                    content_type=review.content_type.value
                )

                # Create file record in database
                file_data = ReviewFileCreate(**file_metadata)
                review_file = await review_crud.add_file_to_review(
                    db=db,
                    review_id=review_id,
                    user_id=current_user.id,
                    file_data=file_data
                )

                if review_file:
                    uploaded_files.append(ReviewFileResponse.model_validate(review_file))
                else:
                    errors.append(f"Failed to save metadata for {file.filename}")

            except Exception as e:
                errors.append(f"{file.filename}: {str(e)}")

        if errors and not uploaded_files:
            # All files failed
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"All file uploads failed: {'; '.join(errors)}"
            )

        security_logger.logger.info(
            f"Batch upload: review_id={review_id}, user={current_user.email}, "
            f"success={len(uploaded_files)}, failed={len(errors)}"
        )

        if errors:
            security_logger.logger.warning(f"Partial upload failures: {'; '.join(errors)}")

        return uploaded_files

    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(
            f"Failed batch upload for review {review_id}, user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload files: {str(e)}"
        )


@router.get(
    "/{review_id}/files",
    response_model=List[ReviewFileResponse],
    summary="List files for a review request"
)
async def list_review_files(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[ReviewFileResponse]:
    """
    Get all files associated with a review request.

    Args:
        review_id: ID of the review request
        current_user: Currently authenticated user
        db: Database session

    Returns:
        List of file records

    Raises:
        HTTPException: If review not found or user doesn't have access
    """
    try:
        # Get the review request with files (without ownership check)
        review = await review_crud.get_review_request(
            db=db,
            review_id=review_id,
            user_id=None  # Don't filter by owner yet
        )

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        # Check if user has access (either owner or reviewer)
        is_owner = review.user_id == current_user.id
        is_reviewer = any(
            slot.reviewer_id == current_user.id
            for slot in (review.slots or [])
        )

        if not (is_owner or is_reviewer):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        return [ReviewFileResponse.model_validate(f) for f in review.files]

    except HTTPException:
        raise
    except Exception as e:
        security_logger.logger.error(
            f"Failed to list files for review {review_id}, user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve files"
        )


@router.delete(
    "/{review_id}/files/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a file from a review request"
)
async def delete_review_file(
    review_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a specific file from a review request.

    Args:
        review_id: ID of the review request
        file_id: ID of the file to delete
        current_user: Currently authenticated user
        db: Database session

    Raises:
        HTTPException: If not found or user doesn't have access
    """
    try:
        # Get the review request and verify ownership
        review = await review_crud.get_review_request(
            db=db,
            review_id=review_id,
            user_id=current_user.id
        )

        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review request with id {review_id} not found"
            )

        # Check if review is editable
        if not review.is_editable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete files from review in '{review.status.value}' status"
            )

        # Find the file
        file_to_delete = None
        for file in review.files:
            if file.id == file_id:
                file_to_delete = file
                break

        if not file_to_delete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File with id {file_id} not found in this review"
            )

        # Delete file from disk
        delete_file(file_to_delete.file_path)

        # Delete from database
        await db.delete(file_to_delete)
        await db.commit()

        security_logger.logger.info(
            f"File deleted: review_id={review_id}, file_id={file_id}, "
            f"user={current_user.email}"
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        security_logger.logger.error(
            f"Failed to delete file {file_id} for review {review_id}, "
            f"user {current_user.email}: {str(e)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete file"
        )
