"""
Expert Application Service

Handles business logic for expert reviewer application submission,
verification, evaluation, and decision-making.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.models.expert_application import (
    ExpertApplication,
    ApplicationStatus,
    ReviewerTier,
    ApplicationDocument,
    CredentialVerification,
    ApplicationReference,
    PortfolioReview,
    SampleReviewEvaluation,
    CommitteeFinalDecision,
    ReviewerProbation,
    ApplicationWaitlist,
    FraudDetectionCheck
)
from app.services.verification_service import VerificationService
from app.core.exceptions import ApplicationError, ValidationError

# NOTE: This service uses sync SQLAlchemy and is not currently integrated.
# The actual expert application workflow is handled by committee_service.py
# which uses async patterns with NotificationService.


class ApplicationService:
    """Service for managing expert applications (DEPRECATED - use committee_service.py)"""

    def __init__(self, db: Session):
        self.db = db
        self.verification_service = VerificationService(db)
        # NOTE: Notification methods in this class are stubs that need implementation
        # if this service is ever activated. Use committee_service.py for the
        # working expert application workflow.

    # =====================================================
    # APPLICATION SUBMISSION
    # =====================================================

    def create_application(
        self,
        user_id: Optional[uuid.UUID],
        email: str,
        full_name: str,
        target_tier: ReviewerTier,
        **application_data
    ) -> ExpertApplication:
        """
        Create a new expert application (initial draft state).

        Args:
            user_id: User ID if registered user, None if new applicant
            email: Contact email
            full_name: Applicant's full name
            target_tier: Tier they're applying for (expert, master, elite)
            **application_data: Additional application fields

        Returns:
            ExpertApplication instance

        Raises:
            ValidationError: If validation fails
            ApplicationError: If there's an active application already
        """
        # Check for duplicate active applications
        existing = self.db.query(ExpertApplication).filter(
            and_(
                ExpertApplication.email == email,
                ExpertApplication.status.in_([
                    ApplicationStatus.DRAFT,
                    ApplicationStatus.SUBMITTED,
                    ApplicationStatus.UNDER_REVIEW,
                    ApplicationStatus.CREDENTIALS_VERIFICATION,
                    ApplicationStatus.PORTFOLIO_REVIEW,
                    ApplicationStatus.SAMPLE_EVALUATION,
                    ApplicationStatus.COMMITTEE_REVIEW
                ])
            )
        ).first()

        if existing:
            raise ApplicationError(
                f"You already have an active application (#{existing.application_number}). "
                "Please complete or withdraw that application before submitting a new one."
            )

        # Check blacklist
        if self._is_blacklisted(email):
            raise ApplicationError(
                "This email is not eligible to submit applications. "
                "Please contact support if you believe this is an error."
            )

        # Check cooling period for previous rejections
        self._check_reapplication_eligibility(email)

        # Check rate limits
        self._check_rate_limits(email, application_data.get('ip_address'))

        # Generate application number
        application_number = self._generate_application_number(target_tier)

        # Create application
        application = ExpertApplication(
            user_id=user_id,
            email=email,
            full_name=full_name,
            target_tier=target_tier,
            application_number=application_number,
            status=ApplicationStatus.DRAFT,
            **application_data
        )

        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)

        # Log activity
        self._log_activity(
            application.id,
            'application_created',
            actor_id=user_id,
            details={'target_tier': target_tier.value}
        )

        return application

    def submit_application(
        self,
        application_id: uuid.UUID
    ) -> ExpertApplication:
        """
        Submit an application for review.

        Args:
            application_id: Application UUID

        Returns:
            Updated application

        Raises:
            ValidationError: If application incomplete or invalid
        """
        application = self._get_application(application_id)

        # Validate application is in draft state
        if application.status != ApplicationStatus.DRAFT:
            raise ApplicationError(
                f"Application cannot be submitted. Current status: {application.status.value}"
            )

        # Validate completeness
        validation_errors = self._validate_application_completeness(application)
        if validation_errors:
            raise ValidationError("Application incomplete", errors=validation_errors)

        # Verify email is verified
        if not application.email_verified:
            raise ValidationError(
                "Email must be verified before submission. "
                "Please check your inbox for the verification link."
            )

        # Update application
        application.status = ApplicationStatus.SUBMITTED
        application.submitted_at = datetime.utcnow()
        application.review_deadline = datetime.utcnow() + timedelta(days=21)

        self.db.commit()
        self.db.refresh(application)

        # Log activity
        self._log_activity(
            application.id,
            'application_submitted',
            details={'submitted_at': application.submitted_at.isoformat()}
        )

        # TODO: Send confirmation email when this service is activated
        # self.notification_service.send_application_received(application)

        # Trigger automated pre-screening
        self._initiate_automated_prescreening(application)

        return application

    # =====================================================
    # AUTOMATED PRE-SCREENING
    # =====================================================

    def _initiate_automated_prescreening(
        self,
        application: ExpertApplication
    ) -> None:
        """
        Run automated checks on submitted application.

        Automated checks include:
        - Email verification
        - Duplicate detection
        - Blacklist check
        - Minimum requirements check
        - Fraud pattern detection
        """
        # Update status
        application.status = ApplicationStatus.UNDER_REVIEW
        application.review_started_at = datetime.utcnow()

        # Run fraud detection checks
        fraud_score = self._run_fraud_detection(application)
        application.fraud_risk_score = fraud_score

        if fraud_score > 70:
            application.has_red_flags = True
            self._log_activity(
                application.id,
                'fraud_risk_detected',
                actor_type='system',
                details={'fraud_score': fraud_score}
            )

        # Check minimum requirements
        meets_requirements, reasons = self._check_minimum_requirements(application)

        if not meets_requirements:
            # Auto-reject
            self._auto_reject_application(application, reasons)
            return

        # Move to credential verification stage
        application.status = ApplicationStatus.CREDENTIALS_VERIFICATION
        self.db.commit()

        # Assign to verification queue
        self._assign_to_verification_queue(application)

        # Log activity
        self._log_activity(
            application.id,
            'prescreening_passed',
            actor_type='system'
        )

    def _run_fraud_detection(self, application: ExpertApplication) -> int:
        """
        Run fraud detection algorithms.

        Returns fraud risk score (0-100).
        Higher score = higher risk.

        Updated scoring to account for no payment barrier:
        - Increased weight on email verification (required, not optional)
        - Added checks for account age and verification status
        - More aggressive duplicate detection
        """
        risk_score = 0
        risk_factors = []

        # Check 1: Email domain legitimacy (increased weight)
        email_risk = self.verification_service.check_email_legitimacy(
            application.email
        )
        if email_risk > 50:
            risk_score += 20
            risk_factors.append({
                'type': 'suspicious_email_domain',
                'score': email_risk
            })

        # Check 2: Email not verified (critical without payment barrier)
        if not application.email_verified:
            risk_score += 15
            risk_factors.append({
                'type': 'email_not_verified',
                'severity': 'high'
            })

        # Check 3: Duplicate detection (increased weight)
        duplicate_risk = self._detect_duplicates(application)
        if duplicate_risk > 0:
            risk_score += 25
            risk_factors.append({
                'type': 'potential_duplicate',
                'matches': duplicate_risk
            })

        # Check 4: Portfolio plagiarism (basic check)
        plagiarism_risk = self._check_portfolio_duplicates(application)
        if plagiarism_risk > 0:
            risk_score += 20
            risk_factors.append({
                'type': 'portfolio_duplicate',
                'matches': plagiarism_risk
            })

        # Check 5: Behavioral patterns (application completion too fast)
        if application.submitted_at and application.created_at:
            completion_time = (
                application.submitted_at - application.created_at
            ).total_seconds() / 60  # minutes

            # Application should take at least 30 minutes (increased from 20)
            if completion_time < 30:
                risk_score += 10
                risk_factors.append({
                    'type': 'suspiciously_fast_completion',
                    'minutes': completion_time
                })

        # Check 6: Reference email patterns
        reference_risk = self._check_reference_patterns(application)
        if reference_risk > 0:
            risk_score += 10
            risk_factors.append({
                'type': 'suspicious_reference_pattern',
                'details': reference_risk
            })

        # Cap at 100
        risk_score = min(risk_score, 100)

        # Log fraud detection check
        fraud_check = FraudDetectionCheck(
            application_id=application.id,
            check_type='comprehensive_fraud_detection',
            is_suspicious=risk_score > 50,
            risk_score=risk_score,
            risk_factors={'factors': risk_factors},
            automated=True
        )
        self.db.add(fraud_check)
        self.db.commit()

        return risk_score

    # =====================================================
    # CREDENTIAL VERIFICATION
    # =====================================================

    def verify_credentials(
        self,
        application_id: uuid.UUID
    ) -> Tuple[int, List[Dict]]:
        """
        Verify all claimed credentials.

        Returns:
            Tuple of (verification_score_percentage, credential_details)
        """
        application = self._get_application(application_id)

        total_points = 0
        earned_points = 0
        credential_details = []

        # Verify education
        if application.credentials and 'education' in application.credentials:
            for edu in application.credentials['education']:
                verification = self.verification_service.verify_education(
                    institution=edu['institution'],
                    degree=edu['degree'],
                    graduation_year=edu['graduation_year']
                )

                total_points += 3
                earned_points += verification['score']

                # Store verification result
                cred_verification = CredentialVerification(
                    application_id=application.id,
                    credential_type='education',
                    credential_name=edu['degree'],
                    issuing_organization=edu['institution'],
                    verification_method=verification['method'],
                    verification_status='verified' if verification['score'] >= 2 else 'failed',
                    verification_score=verification['score'],
                    verification_details=verification
                )
                self.db.add(cred_verification)
                credential_details.append(verification)

        # Verify certifications
        if application.credentials and 'certifications' in application.credentials:
            for cert in application.credentials['certifications']:
                verification = self.verification_service.verify_certification(
                    certification_name=cert['certification_name'],
                    issuing_organization=cert['issuing_organization'],
                    credential_id=cert.get('credential_id'),
                    verification_url=cert.get('verification_url')
                )

                total_points += 3
                earned_points += verification['score']

                cred_verification = CredentialVerification(
                    application_id=application.id,
                    credential_type='certification',
                    credential_name=cert['certification_name'],
                    issuing_organization=cert['issuing_organization'],
                    credential_id=cert.get('credential_id'),
                    verification_method=verification['method'],
                    verification_status='verified' if verification['score'] >= 2 else 'failed',
                    verification_score=verification['score'],
                    verification_details=verification
                )
                self.db.add(cred_verification)
                credential_details.append(verification)

        # Verify employment (via LinkedIn or reference checks)
        if application.professional_background and 'employment_history' in application.professional_background:
            for job in application.professional_background['employment_history']:
                verification = self.verification_service.verify_employment(
                    company=job['company'],
                    role=job['role'],
                    start_date=job['start_date'],
                    end_date=job.get('end_date'),
                    linkedin_url=application.personal_info.get('linkedin_url')
                )

                total_points += 3
                earned_points += verification['score']

                cred_verification = CredentialVerification(
                    application_id=application.id,
                    credential_type='employment',
                    credential_name=job['role'],
                    issuing_organization=job['company'],
                    verification_method=verification['method'],
                    verification_status='verified' if verification['score'] >= 2 else 'partial',
                    verification_score=verification['score'],
                    verification_details=verification
                )
                self.db.add(cred_verification)
                credential_details.append(verification)

        self.db.commit()

        # Calculate percentage
        if total_points == 0:
            verification_percentage = 0
        else:
            verification_percentage = int((earned_points / total_points) * 100)

        # Log activity
        self._log_activity(
            application.id,
            'credentials_verified',
            actor_type='system',
            details={
                'verification_percentage': verification_percentage,
                'total_points': total_points,
                'earned_points': earned_points
            }
        )

        return verification_percentage, credential_details

    # =====================================================
    # PORTFOLIO REVIEW ASSIGNMENT
    # =====================================================

    def assign_portfolio_reviewers(
        self,
        application_id: uuid.UUID,
        num_reviewers: int = 2
    ) -> List[PortfolioReview]:
        """
        Assign portfolio reviewers to an application.

        Uses load-balancing algorithm to distribute work fairly.

        Args:
            application_id: Application UUID
            num_reviewers: Number of reviewers to assign (default 2)

        Returns:
            List of PortfolioReview assignments
        """
        application = self._get_application(application_id)

        # Determine required reviewer tier
        # Expert applications: Master+ reviewers
        # Master applications: Elite reviewers
        # Elite applications: Elite + external expert

        if application.target_tier == ReviewerTier.EXPERT:
            min_reviewer_tier = ReviewerTier.MASTER
        elif application.target_tier == ReviewerTier.MASTER:
            min_reviewer_tier = ReviewerTier.ELITE
        else:  # Elite applications
            min_reviewer_tier = ReviewerTier.ELITE
            num_reviewers = 3  # Elite needs 3 reviewers

        # Find available reviewers
        available_reviewers = self._find_available_portfolio_reviewers(
            domain_ids=application.expertise_domain_ids,
            min_tier=min_reviewer_tier,
            exclude_conflicts=self._get_conflict_reviewer_ids(application)
        )

        if len(available_reviewers) < num_reviewers:
            raise ApplicationError(
                f"Not enough qualified reviewers available. "
                f"Need {num_reviewers}, found {len(available_reviewers)}."
            )

        # Select reviewers using load-balancing
        selected_reviewers = self._select_reviewers_load_balanced(
            available_reviewers,
            num_reviewers
        )

        # Create portfolio review assignments
        assignments = []
        deadline = datetime.utcnow() + timedelta(days=4)

        for reviewer_id, reviewer_tier in selected_reviewers:
            portfolio_review = PortfolioReview(
                application_id=application.id,
                reviewer_id=reviewer_id,
                reviewer_tier=reviewer_tier,
                reviewer_payment_amount=Decimal('50.00'),
                assigned_at=datetime.utcnow()
            )
            self.db.add(portfolio_review)
            assignments.append(portfolio_review)

            # TODO: Notify reviewer when this service is activated
            # self.notification_service.send_portfolio_review_assignment(
            #     reviewer_id=reviewer_id,
            #     application=application,
            #     deadline=deadline
            # )

        # Update application status
        application.status = ApplicationStatus.PORTFOLIO_REVIEW
        self.db.commit()

        # Log activity
        self._log_activity(
            application.id,
            'portfolio_reviewers_assigned',
            details={
                'num_reviewers': num_reviewers,
                'reviewer_ids': [str(r[0]) for r in selected_reviewers]
            }
        )

        return assignments

    def _find_available_portfolio_reviewers(
        self,
        domain_ids: List[uuid.UUID],
        min_tier: ReviewerTier,
        exclude_conflicts: List[uuid.UUID]
    ) -> List[Tuple[uuid.UUID, ReviewerTier]]:
        """
        Find reviewers qualified and available for portfolio review.

        Returns list of (reviewer_id, tier) tuples.
        """
        from app.models.reviewer import Reviewer

        # Query reviewers
        query = self.db.query(Reviewer.id, Reviewer.reviewer_tier).filter(
            and_(
                Reviewer.status == 'active',
                Reviewer.can_review_applications == True,
                Reviewer.reviewer_tier >= min_tier,
                Reviewer.id.notin_(exclude_conflicts),
                # Check domain expertise match
                Reviewer.expertise_domain_ids.overlap(domain_ids)
            )
        )

        reviewers = query.all()

        # Filter by current workload (not overloaded)
        available = []
        for reviewer_id, tier in reviewers:
            workload = self._get_reviewer_workload(reviewer_id)
            if workload < 10:  # Max 10 pending reviews
                available.append((reviewer_id, tier))

        return available

    def _select_reviewers_load_balanced(
        self,
        available_reviewers: List[Tuple[uuid.UUID, ReviewerTier]],
        num_to_select: int
    ) -> List[Tuple[uuid.UUID, ReviewerTier]]:
        """
        Select reviewers using load-balancing algorithm.

        Prioritizes reviewers with lowest current workload.
        """
        # Get workload for each reviewer
        reviewer_workloads = [
            (reviewer_id, tier, self._get_reviewer_workload(reviewer_id))
            for reviewer_id, tier in available_reviewers
        ]

        # Sort by workload (ascending)
        reviewer_workloads.sort(key=lambda x: x[2])

        # Select top N with lowest workload
        selected = [
            (reviewer_id, tier)
            for reviewer_id, tier, _ in reviewer_workloads[:num_to_select]
        ]

        return selected

    def _get_reviewer_workload(self, reviewer_id: uuid.UUID) -> int:
        """Get current number of pending portfolio + sample reviews for a reviewer."""
        portfolio_count = self.db.query(PortfolioReview).filter(
            and_(
                PortfolioReview.reviewer_id == reviewer_id,
                PortfolioReview.is_complete == False
            )
        ).count()

        sample_count = self.db.query(SampleReviewEvaluation).filter(
            and_(
                SampleReviewEvaluation.evaluator_id == reviewer_id,
                SampleReviewEvaluation.is_complete == False
            )
        ).count()

        return portfolio_count + sample_count

    # =====================================================
    # TIER QUALIFICATION LOGIC
    # =====================================================

    def determine_qualified_tier(
        self,
        application_id: uuid.UUID
    ) -> Tuple[Optional[ReviewerTier], Dict]:
        """
        Determine the highest tier an applicant qualifies for based on scores.

        Returns:
            Tuple of (qualified_tier, qualification_details)
        """
        application = self._get_application(application_id)

        # Get all scores
        scores = {
            'years_experience': application.years_of_experience or 0,
            'credential_verification': self._calculate_credential_verification_score(
                application.id
            ),
            'portfolio_score': self._calculate_portfolio_average_score(
                application.id
            ),
            'sample_review_score': self._calculate_sample_review_average_score(
                application.id
            ),
            'reference_confirmations': self._count_confirmed_references(
                application.id
            )
        }

        # Tier thresholds
        thresholds = {
            ReviewerTier.ELITE: {
                'years_experience': 12,
                'credential_verification': 90,
                'portfolio_score': 90,
                'sample_review_score': 90,
                'reference_confirmations': 3
            },
            ReviewerTier.MASTER: {
                'years_experience': 7,
                'credential_verification': 80,
                'portfolio_score': 80,
                'sample_review_score': 82,
                'reference_confirmations': 2
            },
            ReviewerTier.EXPERT: {
                'years_experience': 3,
                'credential_verification': 70,
                'portfolio_score': 70,
                'sample_review_score': 75,
                'reference_confirmations': 2
            }
        }

        # Check Elite
        if all(scores[k] >= v for k, v in thresholds[ReviewerTier.ELITE].items()):
            # Check additional Elite requirements
            if self._check_elite_additional_requirements(application):
                return ReviewerTier.ELITE, {
                    'scores': scores,
                    'thresholds': thresholds[ReviewerTier.ELITE],
                    'qualification': 'meets_all_requirements'
                }

        # Check Master
        if all(scores[k] >= v for k, v in thresholds[ReviewerTier.MASTER].items()):
            return ReviewerTier.MASTER, {
                'scores': scores,
                'thresholds': thresholds[ReviewerTier.MASTER],
                'qualification': 'meets_all_requirements'
            }

        # Check Expert
        if all(scores[k] >= v for k, v in thresholds[ReviewerTier.EXPERT].items()):
            return ReviewerTier.EXPERT, {
                'scores': scores,
                'thresholds': thresholds[ReviewerTier.EXPERT],
                'qualification': 'meets_all_requirements'
            }

        # Does not qualify for any expert tier
        return None, {
            'scores': scores,
            'qualification': 'does_not_meet_minimum_requirements',
            'gaps': self._identify_qualification_gaps(scores, thresholds)
        }

    def _check_elite_additional_requirements(
        self,
        application: ExpertApplication
    ) -> bool:
        """
        Check additional requirements for Elite tier beyond scores.

        Elite tier requires:
        - Published work or recognized contributions
        - Significant impact project
        - Recognition as expert in field
        """
        has_published_work = False
        has_major_impact = False
        has_recognition = False

        if application.portfolio:
            # Check for published works
            if 'published_works' in application.portfolio:
                published = application.portfolio['published_works']
                if len(published) >= 2:  # At least 2 publications
                    has_published_work = True

            # Check for major impact projects
            if 'work_samples' in application.portfolio:
                for sample in application.portfolio['work_samples']:
                    if sample.get('project_type') in [
                        'Major Product Launch',
                        'Industry-Standard Tool',
                        'High-Impact Research'
                    ]:
                        has_major_impact = True
                        break

        # Check for recognition (awards, speaking, etc.)
        if application.credentials:
            if 'awards' in application.credentials:
                if len(application.credentials['awards']) > 0:
                    has_recognition = True

        return has_published_work and (has_major_impact or has_recognition)

    # =====================================================
    # COMMITTEE DECISION
    # =====================================================

    def record_committee_decision(
        self,
        application_id: uuid.UUID,
        decision: str,  # 'approve', 'conditional_approve', 'reject', 'waitlist'
        approved_tier: Optional[ReviewerTier],
        decision_rationale: str,
        committee_votes: List[Dict],
        probation_duration_days: Optional[int] = None,
        probation_review_count: Optional[int] = None,
        mentor_id: Optional[uuid.UUID] = None,
        conditions: Optional[List[str]] = None,
        decided_by: uuid.UUID = None
    ) -> CommitteeFinalDecision:
        """
        Record the committee's final decision on an application.

        Args:
            application_id: Application UUID
            decision: Final decision type
            approved_tier: Tier approved (if approved)
            decision_rationale: Explanation of decision
            committee_votes: List of individual committee member votes
            probation_duration_days: Probation period (if approved)
            probation_review_count: Minimum reviews during probation
            mentor_id: Assigned mentor (if approved)
            conditions: Conditions if conditional approval
            decided_by: Committee chair ID

        Returns:
            CommitteeFinalDecision record
        """
        application = self._get_application(application_id)

        # Count votes
        vote_tally = {
            'approve': 0,
            'conditional_approve': 0,
            'reject': 0,
            'waitlist': 0,
            'abstain': 0
        }

        for vote in committee_votes:
            vote_tally[vote['vote']] += 1

        # Create decision record
        committee_decision = CommitteeFinalDecision(
            application_id=application.id,
            decision=decision,
            approved_tier=approved_tier,
            decision_rationale=decision_rationale,
            approve_votes=vote_tally['approve'],
            conditional_votes=vote_tally['conditional_approve'],
            reject_votes=vote_tally['reject'],
            waitlist_votes=vote_tally['waitlist'],
            abstain_votes=vote_tally['abstain'],
            conditions=conditions or [],
            probation_duration_days=probation_duration_days,
            probation_review_count=probation_review_count,
            probation_mentor_assigned=mentor_id,
            decided_by=decided_by
        )
        self.db.add(committee_decision)

        # Update application
        application.status = ApplicationStatus.APPROVED if decision == 'approve' else ApplicationStatus.REJECTED
        application.approved_tier = approved_tier
        application.decision_rationale = decision_rationale
        application.decision_made_by = decided_by
        application.decision_made_at = datetime.utcnow()

        self.db.commit()

        # Handle based on decision type
        if decision == 'approve' or decision == 'conditional_approve':
            self._handle_approval(
                application,
                approved_tier,
                probation_duration_days,
                probation_review_count,
                mentor_id
            )
        elif decision == 'reject':
            self._handle_rejection(application)
        elif decision == 'waitlist':
            self._handle_waitlist(application, approved_tier)

        # Log activity
        self._log_activity(
            application.id,
            'committee_decision_recorded',
            actor_id=decided_by,
            details={
                'decision': decision,
                'approved_tier': approved_tier.value if approved_tier else None,
                'votes': vote_tally
            }
        )

        return committee_decision

    def _handle_approval(
        self,
        application: ExpertApplication,
        approved_tier: ReviewerTier,
        probation_duration_days: int,
        probation_review_count: int,
        mentor_id: uuid.UUID
    ) -> None:
        """Handle approved application: create reviewer profile and start probation."""
        from app.models.reviewer import Reviewer

        # Create reviewer profile
        reviewer = Reviewer(
            user_id=application.user_id,
            reviewer_tier=approved_tier,
            status='probation',
            onboarding_path='fast_track',
            expertise_domain_ids=application.expertise_domain_ids,
            specializations=application.primary_specializations,
            can_review_applications=False  # Not until probation complete
        )
        self.db.add(reviewer)
        self.db.flush()

        # Create probation record
        probation = ReviewerProbation(
            application_id=application.id,
            reviewer_id=reviewer.id,
            assigned_tier=approved_tier,
            probation_status='active',
            probation_start_date=datetime.utcnow().date(),
            probation_end_date=(
                datetime.utcnow() + timedelta(days=probation_duration_days)
            ).date(),
            minimum_reviews_required=probation_review_count,
            mentor_id=mentor_id
        )
        self.db.add(probation)
        self.db.commit()

        # TIER/REPUTATION SYSTEM: Fast-track to MASTER tier
        # Import TierService for async context
        try:
            from app.services.tier_service import TierService
            tier_service = TierService(self.db)

            # Use asyncio to run the async method if needed, or make this method async
            # For now, manually update the user's tier fields
            from app.models.user import User, UserTier
            user = self.db.query(User).filter(User.id == application.user_id).first()
            if user:
                # Set expert application approved flag
                user.expert_application_approved = True

                # Award minimum karma if below threshold
                if (user.sparks_points or 0) < 15000:
                    user.sparks_points = 15000

                # Promote to MASTER tier
                user.user_tier = UserTier.MASTER
                user.tier_achieved_at = datetime.utcnow()

                # Create milestone record
                from app.models.tier_milestone import TierMilestone
                milestone = TierMilestone(
                    user_id=application.user_id,
                    from_tier=UserTier.NOVICE,  # Assuming they started as novice
                    to_tier=UserTier.MASTER,
                    reason="Expert application approved (fast-track)",
                    karma_at_promotion=user.sparks_points or 0,
                    achieved_at=datetime.utcnow()
                )
                self.db.add(milestone)
                self.db.commit()
        except ImportError:
            # Tier system not available, continue without it
            pass

        # TODO: Send approval notification when this service is activated
        # self.notification_service.send_application_approved(
        #     application=application,
        #     approved_tier=approved_tier,
        #     probation=probation
        # )

    # =====================================================
    # RATE LIMITING
    # =====================================================

    def _check_rate_limits(self, email: str, ip_address: Optional[str]) -> None:
        """
        Check if applicant has exceeded rate limits.

        Rate limits (without payment barrier):
        - Max 1 application per email per 30 days
        - Max 3 applications per IP per 30 days

        Raises ApplicationError if rate limit exceeded.
        """
        # Check email-based rate limit
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        email_count = self.db.query(ExpertApplication).filter(
            and_(
                ExpertApplication.email == email,
                ExpertApplication.created_at >= thirty_days_ago
            )
        ).count()

        if email_count >= 1:
            # Find most recent application
            most_recent = self.db.query(ExpertApplication).filter(
                and_(
                    ExpertApplication.email == email,
                    ExpertApplication.created_at >= thirty_days_ago
                )
            ).order_by(ExpertApplication.created_at.desc()).first()

            days_until_eligible = 30 - (datetime.utcnow() - most_recent.created_at).days

            raise ApplicationError(
                f"Rate limit exceeded. You may only submit one application per 30 days. "
                f"You can reapply in {days_until_eligible} days."
            )

        # Check IP-based rate limit (if IP provided)
        if ip_address:
            # This would need to be tracked in a separate rate_limits table or in application metadata
            # For now, we'll check application count from same IP
            ip_count = self.db.query(ExpertApplication).filter(
                and_(
                    ExpertApplication.created_at >= thirty_days_ago,
                    # Assuming we store IP in application metadata
                    # This is a simplified check
                )
            ).count()

            # We'd implement full IP tracking in production
            pass

    # =====================================================
    # HELPER METHODS
    # =====================================================

    def _get_application(self, application_id: uuid.UUID) -> ExpertApplication:
        """Get application by ID or raise error."""
        application = self.db.query(ExpertApplication).filter(
            ExpertApplication.id == application_id
        ).first()

        if not application:
            raise ApplicationError(f"Application {application_id} not found")

        return application

    def _generate_application_number(self, tier: ReviewerTier) -> str:
        """Generate unique application number like EXP-2025-00123."""
        prefix = {
            ReviewerTier.EXPERT: 'EXP',
            ReviewerTier.MASTER: 'MST',
            ReviewerTier.ELITE: 'ELT'
        }.get(tier, 'APP')

        year = datetime.utcnow().year

        # Get latest application number for this year
        latest = self.db.query(ExpertApplication).filter(
            ExpertApplication.application_number.like(f'{prefix}-{year}-%')
        ).order_by(ExpertApplication.created_at.desc()).first()

        if latest:
            # Extract sequence number and increment
            last_seq = int(latest.application_number.split('-')[-1])
            seq = last_seq + 1
        else:
            seq = 1

        return f"{prefix}-{year}-{seq:05d}"

    def _log_activity(
        self,
        application_id: uuid.UUID,
        activity_type: str,
        actor_id: Optional[uuid.UUID] = None,
        actor_type: str = 'user',
        details: Optional[Dict] = None
    ) -> None:
        """Log activity to activity log."""
        from app.models.expert_application import ApplicationActivityLog

        log = ApplicationActivityLog(
            application_id=application_id,
            activity_type=activity_type,
            actor_id=actor_id,
            actor_type=actor_type,
            details=details or {}
        )
        self.db.add(log)
        self.db.commit()

    def _validate_application_completeness(
        self,
        application: ExpertApplication
    ) -> List[str]:
        """
        Validate that application has all required fields.

        Returns list of error messages (empty if valid).
        """
        errors = []

        # Check required fields
        if not application.full_name:
            errors.append("Full name is required")

        if not application.email:
            errors.append("Email is required")

        if not application.email_verified:
            errors.append("Email must be verified")

        if not application.years_of_experience or application.years_of_experience < 3:
            errors.append("Minimum 3 years of experience required")

        if not application.expertise_domain_ids:
            errors.append("At least one expertise domain is required")

        # Check credentials
        if not application.credentials:
            errors.append("Credentials are required")

        # Check portfolio
        if not application.portfolio or 'work_samples' not in application.portfolio:
            errors.append("Portfolio work samples are required")
        elif len(application.portfolio['work_samples']) < 3:
            errors.append("Minimum 3 portfolio samples required")

        # Check references
        if not application.references or 'professional_references' not in application.references:
            errors.append("Professional references are required")
        elif len(application.references['professional_references']) < 3:
            errors.append("Minimum 3 professional references required")

        # Check sample review
        if not application.sample_review_data:
            errors.append("Sample review submission is required")

        # Check acknowledgments
        if not application.accuracy_declaration:
            errors.append("Must certify information accuracy")

        if not application.code_of_conduct_agreement:
            errors.append("Must agree to code of conduct")

        return errors

    def _calculate_credential_verification_score(
        self,
        application_id: uuid.UUID
    ) -> int:
        """Calculate credential verification percentage."""
        verifications = self.db.query(CredentialVerification).filter(
            CredentialVerification.application_id == application_id
        ).all()

        if not verifications:
            return 0

        total_points = len(verifications) * 3
        earned_points = sum(v.verification_score or 0 for v in verifications)

        return int((earned_points / total_points) * 100)

    def _calculate_portfolio_average_score(
        self,
        application_id: uuid.UUID
    ) -> float:
        """Calculate average portfolio review score."""
        avg = self.db.query(func.avg(PortfolioReview.total_score)).filter(
            and_(
                PortfolioReview.application_id == application_id,
                PortfolioReview.is_complete == True
            )
        ).scalar()

        return float(avg) if avg else 0.0

    def _calculate_sample_review_average_score(
        self,
        application_id: uuid.UUID
    ) -> float:
        """Calculate average sample review evaluation score."""
        avg = self.db.query(func.avg(SampleReviewEvaluation.total_score)).filter(
            and_(
                SampleReviewEvaluation.application_id == application_id,
                SampleReviewEvaluation.is_complete == True
            )
        ).scalar()

        return float(avg) if avg else 0.0

    def _count_confirmed_references(self, application_id: uuid.UUID) -> int:
        """Count number of verified references."""
        count = self.db.query(ApplicationReference).filter(
            and_(
                ApplicationReference.application_id == application_id,
                ApplicationReference.is_verified == True
            )
        ).count()

        return count

    def _is_blacklisted(self, email: str) -> bool:
        """Check if email is blacklisted."""
        from app.models.expert_application import ApplicationBlacklist

        blacklist_entry = self.db.query(ApplicationBlacklist).filter(
            and_(
                ApplicationBlacklist.email == email,
                ApplicationBlacklist.is_active == True
            )
        ).first()

        return blacklist_entry is not None

    def _check_reapplication_eligibility(self, email: str) -> None:
        """
        Check if applicant is in cooling period from previous rejection.

        Raises ApplicationError if not eligible.
        """
        # Get most recent rejected application
        previous_rejection = self.db.query(ExpertApplication).filter(
            and_(
                ExpertApplication.email == email,
                ExpertApplication.status == ApplicationStatus.REJECTED
            )
        ).order_by(ExpertApplication.decision_made_at.desc()).first()

        if previous_rejection:
            # Check earliest reapplication date
            if previous_rejection.earliest_reapplication_date:
                if datetime.utcnow().date() < previous_rejection.earliest_reapplication_date:
                    days_remaining = (
                        previous_rejection.earliest_reapplication_date -
                        datetime.utcnow().date()
                    ).days

                    raise ApplicationError(
                        f"You cannot reapply until {previous_rejection.earliest_reapplication_date}. "
                        f"({days_remaining} days remaining)"
                    )

    def _check_minimum_requirements(
        self,
        application: ExpertApplication
    ) -> Tuple[bool, List[str]]:
        """
        Check if application meets minimum requirements for review.

        Returns (meets_requirements, rejection_reasons).
        """
        reasons = []

        # Minimum experience
        min_experience = {
            ReviewerTier.EXPERT: 3,
            ReviewerTier.MASTER: 7,
            ReviewerTier.ELITE: 12
        }.get(application.target_tier, 3)

        if (application.years_of_experience or 0) < min_experience:
            reasons.append(
                f"Insufficient experience: {application.years_of_experience} years "
                f"(minimum {min_experience} for {application.target_tier.value} tier)"
            )

        # Email must be verified
        if not application.email_verified:
            reasons.append("Email must be verified before review")

        return len(reasons) == 0, reasons

    def _auto_reject_application(
        self,
        application: ExpertApplication,
        reasons: List[str]
    ) -> None:
        """Auto-reject application that doesn't meet minimum requirements."""
        application.status = ApplicationStatus.REJECTED
        application.decision_rationale = "Automatic rejection: " + "; ".join(reasons)
        application.decision_made_at = datetime.utcnow()

        # Set reapplication date (6 months)
        application.earliest_reapplication_date = (
            datetime.utcnow() + timedelta(days=180)
        ).date()

        self.db.commit()

        # TODO: Send rejection email when this service is activated
        # self.notification_service.send_application_rejected(
        #     application=application,
        #     reasons=reasons
        # )

    def _detect_duplicates(self, application: ExpertApplication) -> int:
        """Detect potential duplicate applications from same person."""
        # Check: same email (increased from 365 to 180 days for stricter control)
        duplicate_count = self.db.query(ExpertApplication).filter(
            and_(
                ExpertApplication.email == application.email,
                ExpertApplication.id != application.id,
                ExpertApplication.created_at >= datetime.utcnow() - timedelta(days=180)
            )
        ).count()

        return duplicate_count

    def _check_portfolio_duplicates(self, application: ExpertApplication) -> int:
        """Check if portfolio files are duplicates of other applications."""
        # TODO: Implement file hash comparison
        # For now, return 0
        return 0

    def _check_reference_patterns(self, application: ExpertApplication) -> int:
        """Check for suspicious patterns in references."""
        if not application.references or 'professional_references' not in application.references:
            return 0

        references = application.references['professional_references']

        # Check if all references from same email domain
        domains = [ref.get('email', '').split('@')[-1] for ref in references if ref.get('email')]

        if len(set(domains)) == 1 and len(domains) >= 3:
            # All references from same domain is suspicious
            return 1

        return 0

    def _assign_to_verification_queue(self, application: ExpertApplication) -> None:
        """Assign application to verification queue for admin review."""
        # TODO: Implement queue assignment logic
        pass

    def _get_conflict_reviewer_ids(self, application: ExpertApplication) -> List[uuid.UUID]:
        """Get reviewer IDs that have conflicts of interest with applicant."""
        conflicts = []

        # TODO: Check for conflicts:
        # - Same employer
        # - Personal connection
        # - Previous collaboration

        return conflicts

    def _identify_qualification_gaps(
        self,
        scores: Dict,
        thresholds: Dict
    ) -> Dict:
        """Identify what's missing for each tier qualification."""
        gaps = {}

        for tier, tier_thresholds in thresholds.items():
            tier_gaps = {}
            for criterion, threshold in tier_thresholds.items():
                if scores[criterion] < threshold:
                    tier_gaps[criterion] = {
                        'current': scores[criterion],
                        'required': threshold,
                        'gap': threshold - scores[criterion]
                    }

            if tier_gaps:
                gaps[tier.value] = tier_gaps

        return gaps

    def _handle_rejection(self, application: ExpertApplication) -> None:
        """Handle rejected application."""
        # Set reapplication date
        application.earliest_reapplication_date = (
            datetime.utcnow() + timedelta(days=180)
        ).date()

        self.db.commit()

        # TODO: Send rejection email when this service is activated
        # self.notification_service.send_application_rejected(application)

    def _handle_waitlist(
        self,
        application: ExpertApplication,
        requested_tier: ReviewerTier
    ) -> None:
        """Handle waitlisted application."""
        # Calculate overall score for prioritization
        portfolio_score = self._calculate_portfolio_average_score(application.id)
        sample_score = self._calculate_sample_review_average_score(application.id)
        overall_score = (portfolio_score + sample_score) / 2

        # Priority score (0-100)
        priority_score = int(overall_score)

        # Create waitlist entry
        waitlist = ApplicationWaitlist(
            application_id=application.id,
            tier_requested=requested_tier,
            domain_ids=application.expertise_domain_ids,
            portfolio_score=Decimal(str(portfolio_score)),
            sample_review_score=Decimal(str(sample_score)),
            overall_score=Decimal(str(overall_score)),
            expires_at=datetime.utcnow() + timedelta(days=90),
            priority_score=priority_score
        )
        self.db.add(waitlist)

        application.status = ApplicationStatus.WAITLISTED
        self.db.commit()

        # TODO: Send waitlist notification when this service is activated
        # self.notification_service.send_application_waitlisted(
        #     application=application,
        #     waitlist=waitlist
        # )
