"""
Background job scheduler for review workflow automation

Handles:
- Abandoning claimed reviews after timeout (72 hours default)
- Auto-accepting submitted reviews after timeout (7 days default)
- Sending daily and weekly email digests
"""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_maker
from app.crud.review_slot import process_expired_claims, process_auto_accepts
from app.core.scheduler_config import scheduler_settings
from app.services.committee_service import CommitteeService
from app.services.email_digest import send_daily_digests, send_weekly_digests

logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = AsyncIOScheduler()


async def get_db_session() -> AsyncSession:
    """
    Get database session for background jobs

    This creates a new session for each background job execution
    to ensure proper connection management and transaction handling.
    """
    async with async_session_maker() as session:
        return session


def start_background_jobs():
    """
    Start all background jobs for review workflow

    This function registers and starts scheduled jobs:
    1. process_expired_claims - Runs every hour to abandon timed-out claims
    2. process_auto_accepts - Runs every hour to auto-accept reviews

    The scheduler is configured to run jobs at the top of each hour (:00).
    max_instances=1 ensures no overlapping job executions.
    """

    if not scheduler_settings.SCHEDULER_ENABLED:
        logger.info("Background job scheduler is disabled (SCHEDULER_ENABLED=False)")
        return

    logger.info("Starting background job scheduler...")

    # Job 1: Process expired claims (every hour at :00)
    scheduler.add_job(
        process_expired_claims_job,
        CronTrigger(minute=0),  # Run at :00 of every hour
        id='process_expired_claims',
        replace_existing=True,
        max_instances=1,  # Prevent overlapping runs
        coalesce=True,  # If job was missed, only run once when scheduler starts
        misfire_grace_time=300  # 5 minutes grace period for misfired jobs
    )
    logger.info(
        f"Scheduled job: process_expired_claims "
        f"(every {scheduler_settings.SCHEDULER_INTERVAL_MINUTES} minutes, "
        f"timeout={scheduler_settings.CLAIM_TIMEOUT_HOURS}h)"
    )

    # Job 2: Process auto-accepts (every hour at :00)
    scheduler.add_job(
        process_auto_accepts_job,
        CronTrigger(minute=0),  # Run at :00 of every hour
        id='process_auto_accepts',
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=300
    )
    logger.info(
        f"Scheduled job: process_auto_accepts "
        f"(every {scheduler_settings.SCHEDULER_INTERVAL_MINUTES} minutes, "
        f"timeout={scheduler_settings.AUTO_ACCEPT_DAYS}d)"
    )

    # Job 3: Auto-release stale application review claims (daily at 2:00 AM)
    scheduler.add_job(
        process_stale_application_claims_job,
        CronTrigger(hour=2, minute=0),  # Run at 2:00 AM daily
        id='process_stale_application_claims',
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600  # 1 hour grace period
    )
    logger.info("Scheduled job: process_stale_application_claims (daily at 2:00 AM, timeout=7d)")

    # Job 4: Send daily email digests (every hour at :05)
    # Runs every hour to check which users have daily digest set for that hour
    scheduler.add_job(
        send_daily_digests_job,
        CronTrigger(minute=5),  # Run at :05 of every hour
        id='send_daily_digests',
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600  # 1 hour grace period
    )
    logger.info("Scheduled job: send_daily_digests (every hour at :05)")

    # Job 5: Send weekly email digests (every hour at :10)
    # Runs every hour to check which users have weekly digest set for that hour/day
    scheduler.add_job(
        send_weekly_digests_job,
        CronTrigger(minute=10),  # Run at :10 of every hour
        id='send_weekly_digests',
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600  # 1 hour grace period
    )
    logger.info("Scheduled job: send_weekly_digests (every hour at :10)")

    # Start the scheduler
    scheduler.start()
    logger.info("Background job scheduler started successfully")


def stop_background_jobs():
    """
    Stop all background jobs gracefully

    This should be called during application shutdown to ensure:
    - Running jobs are allowed to complete
    - No new jobs are started
    - Resources are cleaned up properly
    """
    logger.info("Stopping background job scheduler...")
    scheduler.shutdown(wait=True)  # wait=True ensures running jobs complete
    logger.info("Background job scheduler stopped successfully")


async def process_expired_claims_job():
    """
    Background job: Mark expired claims as abandoned

    This job runs hourly and:
    - Finds all slots where status=CLAIMED and claim_deadline < NOW()
    - Marks them as ABANDONED
    - Decrements the reviews_claimed counter on the review request
    - Logs all abandoned claims for monitoring

    Handles errors gracefully to prevent one failure from stopping the job.
    """
    try:
        async with async_session_maker() as db:
            count = await process_expired_claims(db)

            if count > 0:
                logger.info(f"Abandoned {count} expired claim(s)")
            else:
                logger.debug("No expired claims to process")

    except Exception as e:
        logger.error(
            f"Error in process_expired_claims job: {e}",
            exc_info=True,
            extra={
                "job": "process_expired_claims",
                "error_type": type(e).__name__
            }
        )


async def process_auto_accepts_job():
    """
    Background job: Auto-accept submitted reviews after timeout

    This job runs hourly and:
    - Finds all slots where status=SUBMITTED and auto_accept_at < NOW()
    - Marks them as ACCEPTED with acceptance_type=AUTO
    - Releases payment (if expert review)
    - Increments reviews_completed counter
    - Updates request status to COMPLETED if all reviews done
    - Logs all auto-accepted reviews for monitoring

    Handles errors gracefully to prevent one failure from stopping the job.
    """
    try:
        async with async_session_maker() as db:
            count = await process_auto_accepts(db)

            if count > 0:
                logger.info(f"Auto-accepted {count} review(s)")
            else:
                logger.debug("No reviews to auto-accept")

    except Exception as e:
        logger.error(
            f"Error in process_auto_accepts job: {e}",
            exc_info=True,
            extra={
                "job": "process_auto_accepts",
                "error_type": type(e).__name__
            }
        )


async def process_stale_application_claims_job():
    """
    Background job: Auto-release stale expert application review claims

    This job runs daily and:
    - Finds all application reviews where status=CLAIMED and claimed_at < 7 days ago
    - Marks them as RELEASED with a note about auto-release
    - Reverts the application status back to SUBMITTED if no other reviews exist
    - Logs all released claims for monitoring

    This ensures applications don't get stuck when committee members claim
    but don't complete their reviews within 7 days.
    """
    try:
        async with async_session_maker() as db:
            service = CommitteeService(db)
            count = await service.auto_release_stale_claims()

            if count > 0:
                logger.info(f"Auto-released {count} stale application review claim(s)")
            else:
                logger.debug("No stale application review claims to process")

    except Exception as e:
        logger.error(
            f"Error in process_stale_application_claims job: {e}",
            exc_info=True,
            extra={
                "job": "process_stale_application_claims",
                "error_type": type(e).__name__
            }
        )


async def send_daily_digests_job():
    """
    Background job: Send daily email digests

    This job runs every hour and sends daily digest emails to users
    who have configured their digest time for that hour.
    """
    try:
        async with async_session_maker() as db:
            count = await send_daily_digests(db)

            if count > 0:
                logger.info(f"Sent {count} daily digest email(s)")
            else:
                logger.debug("No daily digests to send this hour")

    except Exception as e:
        logger.error(
            f"Error in send_daily_digests job: {e}",
            exc_info=True,
            extra={
                "job": "send_daily_digests",
                "error_type": type(e).__name__
            }
        )


async def send_weekly_digests_job():
    """
    Background job: Send weekly email digests

    This job runs every hour and sends weekly digest emails to users
    who have configured their digest time and day for that hour/day.
    """
    try:
        async with async_session_maker() as db:
            count = await send_weekly_digests(db)

            if count > 0:
                logger.info(f"Sent {count} weekly digest email(s)")
            else:
                logger.debug("No weekly digests to send this hour")

    except Exception as e:
        logger.error(
            f"Error in send_weekly_digests job: {e}",
            exc_info=True,
            extra={
                "job": "send_weekly_digests",
                "error_type": type(e).__name__
            }
        )


# ===== Manual Trigger Functions (for testing/admin use) =====

async def trigger_expired_claims_now():
    """
    Manually trigger expired claims processing

    Useful for:
    - Testing the scheduler functionality
    - Admin manual intervention
    - Emergency cleanup operations
    """
    logger.info("Manually triggering expired claims processing...")
    await process_expired_claims_job()


async def trigger_auto_accepts_now():
    """
    Manually trigger auto-accept processing

    Useful for:
    - Testing the scheduler functionality
    - Admin manual intervention
    - Emergency review acceptance
    """
    logger.info("Manually triggering auto-accept processing...")
    await process_auto_accepts_job()


async def trigger_stale_application_claims_now():
    """
    Manually trigger stale application claims processing

    Useful for:
    - Testing the scheduler functionality
    - Admin manual intervention
    - Emergency cleanup of stuck applications
    """
    logger.info("Manually triggering stale application claims processing...")
    await process_stale_application_claims_job()


async def trigger_daily_digests_now():
    """
    Manually trigger daily digest sending

    Useful for:
    - Testing the email digest functionality
    - Admin manual intervention
    """
    logger.info("Manually triggering daily digest sending...")
    await send_daily_digests_job()


async def trigger_weekly_digests_now():
    """
    Manually trigger weekly digest sending

    Useful for:
    - Testing the email digest functionality
    - Admin manual intervention
    """
    logger.info("Manually triggering weekly digest sending...")
    await send_weekly_digests_job()


def get_scheduler_status() -> dict:
    """
    Get current scheduler status and job information

    Returns:
        Dictionary with scheduler state and job details
    """
    if not scheduler.running:
        return {
            "status": "stopped",
            "enabled": scheduler_settings.SCHEDULER_ENABLED,
            "jobs": []
        }

    jobs = []
    for job in scheduler.get_jobs():
        next_run = job.next_run_time.isoformat() if job.next_run_time else None
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": next_run,
            "trigger": str(job.trigger)
        })

    return {
        "status": "running",
        "enabled": scheduler_settings.SCHEDULER_ENABLED,
        "jobs": jobs,
        "settings": {
            "claim_timeout_hours": scheduler_settings.CLAIM_TIMEOUT_HOURS,
            "auto_accept_days": scheduler_settings.AUTO_ACCEPT_DAYS,
            "interval_minutes": scheduler_settings.SCHEDULER_INTERVAL_MINUTES
        }
    }
