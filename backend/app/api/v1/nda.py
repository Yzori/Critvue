"""NDA (Non-Disclosure Agreement) API endpoints"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path as PathParam, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.review_request import ReviewRequest, ReviewType
from app.models.nda_signature import NDASignature, NDARole, CURRENT_NDA_VERSION
from app.schemas.nda import (
    NDASignRequest,
    NDASignResponse,
    NDAStatusResponse,
    NDAContentResponse,
    NDASignatureResponse,
)
from app.core.logging_config import security_logger

router = APIRouter(prefix="/nda", tags=["NDA"])


# NDA document content (could be stored in database or config for versioning)
NDA_CONTENT = """
NON-DISCLOSURE AGREEMENT (NDA)
Between Creator and Reviewer on Critvue

This Non-Disclosure Agreement ("Agreement") is made and entered into as of the date of electronic signature, by and between:

The "Creator" — the individual or entity submitting work on Critvue for review, and
The "Reviewer" — the individual or entity providing feedback on Critvue.

Collectively: "the Parties."

1. Purpose
The Reviewer may be given access to creative work, drafts, concepts, code, images, or other proprietary material from the Creator ("Work"). Both parties agree this material is confidential and shared solely for the purpose of receiving and giving constructive feedback on Critvue.

2. Definition of Confidential Information
"Confidential Information" includes all non-public work, drafts, designs, concepts, text, algorithms, source code, audio, video, proprietary processes, brand assets, or any materials shared within the Critvue platform or privately between Creator and Reviewer.

It excludes information that:
(a) becomes public through no fault of the receiving Party,
(b) was already lawfully known,
(c) is independently created,
(d) is lawfully provided by a third party.

3. Obligations
The Reviewer agrees to:
• Keep all Creator materials confidential.
• Not copy, reproduce, reshare, or distribute the Work.
• Not use the Work for any purpose other than giving feedback.
• Not claim ownership, authorship, or contribution.
• Not develop competing material directly derived from the Work.

The Creator agrees to:
• Only disclose materials they have rights to share.
• Respect any private information disclosed by the Reviewer.

Both Parties agree to reasonable protection of all Confidential Information.

4. Non-Use
The Reviewer may not commercialize, publish, or profit from the Creator's Work without explicit written permission.

5. Required Disclosure
If legally compelled to disclose information, the receiving Party must notify the other unless prohibited by law.

6. Ownership
All Work and Confidential Information remains the sole property of the Creator.

7. Term & Survival
This Agreement remains effective for 3 years from the date of signing.
Confidentiality obligations survive for 5 years, or indefinitely with respect to trade secrets or unpublished creative work.

8. Return or Deletion
Upon request, the Reviewer must delete all materials provided by the Creator.

9. No Warranty
The Creator provides their Work "as is." No warranties are given.

10. Remedies
Unauthorized disclosure or misuse may cause irreparable harm. The Creator may seek injunctive relief or other legal remedies.

11. Governing Law
This Agreement is governed by the laws of the jurisdiction specified in the platform's Terms of Service.

12. Entire Agreement
This document constitutes the full confidentiality understanding between Creator and Reviewer.
""".strip()


@router.get(
    "/content",
    response_model=NDAContentResponse,
    summary="Get NDA document content"
)
async def get_nda_content() -> NDAContentResponse:
    """
    Get the current NDA document content.
    This endpoint is public so users can read the NDA before deciding to sign.
    """
    return NDAContentResponse(
        version=CURRENT_NDA_VERSION,
        title="Non-Disclosure Agreement (NDA)",
        subtitle="Between Creator and Reviewer on Critvue",
        content=NDA_CONTENT
    )


@router.get(
    "/status/{review_id}",
    response_model=NDAStatusResponse,
    summary="Check NDA status for a review request"
)
async def get_nda_status(
    review_id: int = PathParam(..., ge=1, description="ID of the review request"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> NDAStatusResponse:
    """
    Check the NDA status for a specific review request.

    Returns whether NDA is required, who has signed, and whether
    the current user can view the full content.
    """
    # Get the review request
    result = await db.execute(
        select(ReviewRequest).where(ReviewRequest.id == review_id)
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review request with id {review_id} not found"
        )

    # If NDA not required, user can always view
    if not review.requires_nda:
        return NDAStatusResponse(
            review_request_id=review_id,
            requires_nda=False,
            can_view_content=True
        )

    # Check for creator signature
    creator_sig_result = await db.execute(
        select(NDASignature).where(
            NDASignature.review_request_id == review_id,
            NDASignature.role == NDARole.CREATOR.value
        )
    )
    creator_sig = creator_sig_result.scalar_one_or_none()

    # Check for current user's signature
    user_sig_result = await db.execute(
        select(NDASignature).where(
            NDASignature.review_request_id == review_id,
            NDASignature.user_id == current_user.id
        )
    )
    user_sig = user_sig_result.scalar_one_or_none()

    # Determine if user can view content:
    # - Owner can always view their own content
    # - Reviewers can view if they've signed the NDA
    is_owner = review.user_id == current_user.id
    can_view = is_owner or (user_sig is not None)

    return NDAStatusResponse(
        review_request_id=review_id,
        requires_nda=True,
        nda_version=review.nda_version or CURRENT_NDA_VERSION,
        creator_signed=creator_sig is not None,
        creator_signed_at=creator_sig.signed_at if creator_sig else None,
        current_user_signed=user_sig is not None,
        current_user_signed_at=user_sig.signed_at if user_sig else None,
        can_view_content=can_view
    )


@router.post(
    "/sign/{review_id}",
    response_model=NDASignResponse,
    summary="Sign NDA for a review request"
)
async def sign_nda(
    request: Request,
    sign_data: NDASignRequest,
    review_id: int = PathParam(..., ge=1, description="ID of the review request"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> NDASignResponse:
    """
    Sign the NDA for a specific review request.

    The creator signs when enabling NDA on their request.
    Reviewers sign before they can view the full request details.
    """
    # Get the review request
    result = await db.execute(
        select(ReviewRequest).where(ReviewRequest.id == review_id)
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review request with id {review_id} not found"
        )

    # Verify this is an NDA-required review
    if not review.requires_nda:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This review request does not require an NDA"
        )

    # Determine the user's role
    is_owner = review.user_id == current_user.id
    role = NDARole.CREATOR if is_owner else NDARole.REVIEWER

    # Check if user has already signed
    existing_sig_result = await db.execute(
        select(NDASignature).where(
            NDASignature.review_request_id == review_id,
            NDASignature.user_id == current_user.id
        )
    )
    existing_sig = existing_sig_result.scalar_one_or_none()

    if existing_sig:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already signed the NDA for this review request"
        )

    # Get client IP and user agent for audit trail
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")[:500]  # Limit length

    # Create the signature
    now = datetime.utcnow()
    signature = NDASignature(
        review_request_id=review_id,
        user_id=current_user.id,
        role=role.value,
        full_legal_name=sign_data.full_legal_name,
        nda_version=CURRENT_NDA_VERSION,
        signature_ip=client_ip,
        signature_user_agent=user_agent,
        signed_at=now,
        created_at=now
    )

    db.add(signature)

    # If creator is signing, update the review request's nda_version
    if is_owner and not review.nda_version:
        review.nda_version = CURRENT_NDA_VERSION

    await db.commit()
    await db.refresh(signature)

    security_logger.logger.info(
        f"NDA signed: review_id={review_id}, user={current_user.email}, "
        f"role={role.value}, signature_id={signature.id}"
    )

    return NDASignResponse(
        success=True,
        message=f"NDA signed successfully as {role.value}",
        signature_id=signature.id,
        signed_at=signature.signed_at,
        nda_version=signature.nda_version,
        review_request_id=review_id
    )


@router.get(
    "/signatures/{review_id}",
    response_model=list[NDASignatureResponse],
    summary="Get all NDA signatures for a review request"
)
async def get_nda_signatures(
    review_id: int = PathParam(..., ge=1, description="ID of the review request"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> list[NDASignatureResponse]:
    """
    Get all NDA signatures for a review request.

    Only the review owner can see all signatures.
    Reviewers can only see their own signature.
    """
    # Get the review request
    result = await db.execute(
        select(ReviewRequest).where(ReviewRequest.id == review_id)
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review request with id {review_id} not found"
        )

    is_owner = review.user_id == current_user.id

    # Build query based on user role
    if is_owner:
        # Owner can see all signatures
        sig_result = await db.execute(
            select(NDASignature).where(
                NDASignature.review_request_id == review_id
            ).order_by(NDASignature.signed_at)
        )
    else:
        # Non-owner can only see their own signature
        sig_result = await db.execute(
            select(NDASignature).where(
                NDASignature.review_request_id == review_id,
                NDASignature.user_id == current_user.id
            )
        )

    signatures = sig_result.scalars().all()

    return [
        NDASignatureResponse(
            id=sig.id,
            review_request_id=sig.review_request_id,
            user_id=sig.user_id,
            role=sig.role,
            full_legal_name=sig.full_legal_name,
            nda_version=sig.nda_version,
            signed_at=sig.signed_at
        )
        for sig in signatures
    ]
