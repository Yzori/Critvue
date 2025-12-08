"""
Script to fix invalid content_type values in the database.
Updates any records with 'code' content_type to 'design' (closest equivalent).
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, update, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


async def fix_invalid_content_types():
    """Fix invalid content_type values in the database."""

    print("\n" + "="*60)
    print("Fixing Invalid Content Types")
    print("="*60 + "\n")

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        try:
            # First, find all invalid content_type values
            print("[STEP 1] Finding records with invalid content_type values...")

            # Query using raw SQL to avoid enum validation
            result = await db.execute(
                text("SELECT id, title, content_type FROM review_requests WHERE content_type NOT IN ('design', 'photography', 'video', 'stream', 'audio', 'writing', 'art')")
            )
            invalid_records = result.fetchall()

            if not invalid_records:
                print("  No invalid content_type values found!")
                print("="*60 + "\n")
                return True

            print(f"  Found {len(invalid_records)} records with invalid content_type values:")
            for record in invalid_records:
                print(f"    - ID {record[0]}: '{record[2]}' - {record[1][:50]}...")

            print()

            # Update invalid records to 'design' (most generic category)
            print("[STEP 2] Updating invalid content_type values to 'design'...")

            # Map old invalid types to new valid types
            type_mapping = {
                'code': 'design',  # Code reviews -> design (UI/UX work)
                'marketing': 'design',
                'presentation': 'design',
                'ux': 'design',
                'branding': 'design',
            }

            for old_type, new_type in type_mapping.items():
                result = await db.execute(
                    text(f"UPDATE review_requests SET content_type = :new_type WHERE content_type = :old_type"),
                    {"new_type": new_type, "old_type": old_type}
                )
                if result.rowcount > 0:
                    print(f"  Updated {result.rowcount} records from '{old_type}' to '{new_type}'")

            await db.commit()

            # Verify fix
            print()
            print("[STEP 3] Verifying fix...")
            result = await db.execute(
                text("SELECT id, title, content_type FROM review_requests WHERE content_type NOT IN ('design', 'photography', 'video', 'stream', 'audio', 'writing', 'art')")
            )
            remaining = result.fetchall()

            if remaining:
                print(f"  WARNING: Still found {len(remaining)} invalid records:")
                for record in remaining:
                    print(f"    - ID {record[0]}: '{record[2]}'")
            else:
                print("  All content_type values are now valid!")

            print()
            print("="*60)
            print("Content Type Fix Complete")
            print("="*60 + "\n")

            return True

        except Exception as e:
            print(f"\n[ERROR] Failed: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()
            return False
        finally:
            await engine.dispose()


if __name__ == "__main__":
    success = asyncio.run(fix_invalid_content_types())
    sys.exit(0 if success else 1)
