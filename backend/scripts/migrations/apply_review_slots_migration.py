#!/usr/bin/env python3
"""
Script to directly apply review_slots table migration to SQLite database
"""
import sqlite3
import sys
import os

def run_migration(db_path="critvue_dev.db"):
    """Apply the review_slots migration"""

    print(f"Applying migration to {db_path}...")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if review_slots table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='review_slots';
        """)
        if cursor.fetchone():
            print("✓ review_slots table already exists")
        else:
            # Create review_slots table
            cursor.execute("""
                CREATE TABLE review_slots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    review_request_id INTEGER NOT NULL,
                    reviewer_id INTEGER,

                    -- State management
                    status TEXT NOT NULL DEFAULT 'available',

                    -- Lifecycle timestamps
                    claimed_at DATETIME,
                    submitted_at DATETIME,
                    reviewed_at DATETIME,
                    claim_deadline DATETIME,
                    auto_accept_at DATETIME,

                    -- Review content
                    review_text TEXT,
                    rating INTEGER,
                    review_attachments TEXT,  -- JSON stored as string

                    -- Acceptance/Rejection metadata
                    acceptance_type TEXT,
                    rejection_reason TEXT,
                    rejection_notes TEXT,

                    -- Dispute handling
                    is_disputed BOOLEAN NOT NULL DEFAULT 0,
                    dispute_reason TEXT,
                    dispute_resolved_at DATETIME,
                    dispute_resolution TEXT,
                    dispute_notes TEXT,

                    -- Payment tracking
                    payment_amount DECIMAL(10, 2),
                    payment_status TEXT NOT NULL DEFAULT 'pending',
                    payment_released_at DATETIME,
                    transaction_id TEXT,

                    -- Quality metrics
                    requester_helpful_rating INTEGER,

                    -- Audit trail
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                    -- Constraints
                    CHECK (rating >= 1 AND rating <= 5),
                    CHECK (requester_helpful_rating >= 1 AND requester_helpful_rating <= 5),
                    FOREIGN KEY (review_request_id) REFERENCES review_requests(id) ON DELETE CASCADE,
                    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
                );
            """)
            print("✓ Created review_slots table")

            # Create indexes
            indexes = [
                ("idx_slot_review_request", "review_request_id"),
                ("idx_slot_reviewer", "reviewer_id"),
                ("idx_slot_status", "status"),
                ("idx_slot_payment_status", "payment_status"),
            ]

            for idx_name, column in indexes:
                cursor.execute(f"CREATE INDEX {idx_name} ON review_slots ({column});")

            # Create composite indexes
            cursor.execute("CREATE INDEX idx_slot_status_deadline ON review_slots (status, claim_deadline);")
            cursor.execute("CREATE INDEX idx_slot_status_auto_accept ON review_slots (status, auto_accept_at);")
            cursor.execute("CREATE INDEX idx_slot_reviewer_status ON review_slots (reviewer_id, status);")
            cursor.execute("CREATE INDEX idx_slot_request_status ON review_slots (review_request_id, status);")

            print("✓ Created indexes")

        # Check if reviews_completed column exists in review_requests
        cursor.execute("PRAGMA table_info(review_requests);")
        columns = [col[1] for col in cursor.fetchall()]

        if 'reviews_completed' not in columns:
            # Add reviews_completed column
            cursor.execute("""
                ALTER TABLE review_requests
                ADD COLUMN reviews_completed INTEGER NOT NULL DEFAULT 0;
            """)
            print("✓ Added reviews_completed column to review_requests")

            # Create index
            cursor.execute("CREATE INDEX idx_reviews_completed ON review_requests (reviews_completed);")
            print("✓ Created index on reviews_completed")
        else:
            print("✓ reviews_completed column already exists")

        # Update alembic_version to mark migration as applied
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL PRIMARY KEY
            );
        """)

        cursor.execute("SELECT version_num FROM alembic_version;")
        current_version = cursor.fetchone()

        # Update to new version
        new_version = '788b36ab8d73'
        if current_version:
            cursor.execute("UPDATE alembic_version SET version_num = ?;", (new_version,))
        else:
            cursor.execute("INSERT INTO alembic_version (version_num) VALUES (?);", (new_version,))

        print(f"✓ Updated alembic_version to {new_version}")

        # Commit changes
        conn.commit()
        print("\n✓ Migration completed successfully!")

        # Display table info
        cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='review_slots';")
        if cursor.fetchone()[0] == 1:
            cursor.execute("SELECT COUNT(*) FROM review_slots;")
            count = cursor.fetchone()[0]
            print(f"  - review_slots table exists with {count} rows")

        conn.close()
        return True

    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    db_path = sys.argv[1] if len(sys.argv) > 1 else "critvue_dev.db"
    success = run_migration(db_path)
    sys.exit(0 if success else 1)
