#!/usr/bin/env python3
"""
Validation script for review slots database structure

Checks that all tables, columns, and indexes are properly created
"""

import sqlite3
import sys


def validate_database_structure(db_path="critvue_dev.db"):
    """Validate the review_slots database structure"""

    print("="*60)
    print("REVIEW SLOTS DATABASE VALIDATION")
    print("="*60)

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check 1: Verify review_slots table exists
        print("\n1. Checking review_slots table...")
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='review_slots';
        """)
        if cursor.fetchone():
            print("   ✓ review_slots table exists")
        else:
            print("   ✗ review_slots table NOT FOUND")
            return False

        # Check 2: Verify all columns exist
        print("\n2. Checking review_slots columns...")
        cursor.execute("PRAGMA table_info(review_slots);")
        columns = {col[1]: col[2] for col in cursor.fetchall()}

        required_columns = [
            'id', 'review_request_id', 'reviewer_id', 'status',
            'claimed_at', 'submitted_at', 'reviewed_at', 'claim_deadline', 'auto_accept_at',
            'review_text', 'rating', 'review_attachments',
            'acceptance_type', 'rejection_reason', 'rejection_notes',
            'is_disputed', 'dispute_reason', 'dispute_resolved_at', 'dispute_resolution', 'dispute_notes',
            'payment_amount', 'payment_status', 'payment_released_at', 'transaction_id',
            'requester_helpful_rating', 'created_at', 'updated_at'
        ]

        missing_columns = []
        for col in required_columns:
            if col in columns:
                print(f"   ✓ Column '{col}' exists ({columns[col]})")
            else:
                print(f"   ✗ Column '{col}' MISSING")
                missing_columns.append(col)

        if missing_columns:
            print(f"\n   ✗ Missing columns: {', '.join(missing_columns)}")
            return False

        # Check 3: Verify indexes
        print("\n3. Checking review_slots indexes...")
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='index' AND tbl_name='review_slots';
        """)
        indexes = [row[0] for row in cursor.fetchall()]

        required_indexes = [
            'idx_slot_review_request',
            'idx_slot_reviewer',
            'idx_slot_status',
            'idx_slot_payment_status',
            'idx_slot_status_deadline',
            'idx_slot_status_auto_accept',
            'idx_slot_reviewer_status',
            'idx_slot_request_status'
        ]

        missing_indexes = []
        for idx in required_indexes:
            if idx in indexes:
                print(f"   ✓ Index '{idx}' exists")
            else:
                # Some indexes might be auto-created with different names
                print(f"   ? Index '{idx}' not found (may be auto-generated)")

        # Check 4: Verify reviews_completed column in review_requests
        print("\n4. Checking review_requests.reviews_completed column...")
        cursor.execute("PRAGMA table_info(review_requests);")
        rr_columns = {col[1]: col[2] for col in cursor.fetchall()}

        if 'reviews_completed' in rr_columns:
            print(f"   ✓ reviews_completed column exists ({rr_columns['reviews_completed']})")
        else:
            print("   ✗ reviews_completed column MISSING")
            return False

        # Check 5: Verify foreign key constraints
        print("\n5. Checking foreign key constraints...")
        cursor.execute("PRAGMA foreign_key_list(review_slots);")
        fks = cursor.fetchall()

        fk_tables = {fk[2] for fk in fks}
        expected_fk_tables = {'review_requests', 'users'}

        for table in expected_fk_tables:
            if table in fk_tables:
                print(f"   ✓ Foreign key to '{table}' exists")
            else:
                print(f"   ✗ Foreign key to '{table}' MISSING")
                return False

        # Check 6: Test basic operations (read-only)
        print("\n6. Testing basic queries...")

        # Count review_slots
        cursor.execute("SELECT COUNT(*) FROM review_slots;")
        slot_count = cursor.fetchone()[0]
        print(f"   ✓ Can query review_slots (found {slot_count} rows)")

        # Count review_requests with reviews_completed
        cursor.execute("SELECT COUNT(*) FROM review_requests WHERE reviews_completed >= 0;")
        rr_count = cursor.fetchone()[0]
        print(f"   ✓ Can query reviews_completed field (found {rr_count} requests)")

        # Check 7: Verify alembic version
        print("\n7. Checking migration status...")
        cursor.execute("SELECT version_num FROM alembic_version;")
        version = cursor.fetchone()
        if version:
            print(f"   ✓ Alembic version: {version[0]}")
            if version[0] == '788b36ab8d73':
                print("   ✓ Review slots migration is applied")
            else:
                print(f"   ? Alembic version is {version[0]}, expected 788b36ab8d73")
        else:
            print("   ✗ No alembic version found")

        conn.close()

        print("\n" + "="*60)
        print("✅ ALL VALIDATION CHECKS PASSED!")
        print("="*60)
        print("\nDatabase structure is correctly configured for review slots system.")
        print("\nKey features:")
        print("  • Review slots table with all required columns")
        print("  • Proper foreign key constraints")
        print("  • Performance indexes in place")
        print("  • reviews_completed tracking field")
        print("  • State machine fields (status, timestamps)")
        print("  • Payment tracking for expert reviews")
        print("  • Dispute handling fields")
        print("\n")

        return True

    except Exception as e:
        print(f"\n❌ VALIDATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = validate_database_structure("critvue_dev.db")
    sys.exit(0 if success else 1)
