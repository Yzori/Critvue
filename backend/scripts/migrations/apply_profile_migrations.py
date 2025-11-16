#!/usr/bin/env python3
"""
Script to directly apply profile-related migrations to SQLite database
Applies two migrations:
1. h1a2b3c4d5e6 - Add profile fields to users
2. i2b3c4d5e6f7 - Create portfolio table
"""
import sqlite3
import sys
import os

def run_migrations(db_path="critvue_dev.db"):
    """Apply the profile migrations"""

    print(f"Applying profile migrations to {db_path}...")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # MIGRATION 1: Add profile fields to users table
        print("\n=== Migration 1: Adding profile fields to users ===")

        # Check which columns already exist
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = {col[1] for col in cursor.fetchall()}

        profile_columns = [
            ('title', 'TEXT'),
            ('specialty_tags', 'TEXT'),
            ('badges', 'TEXT'),
            ('total_reviews_given', 'INTEGER DEFAULT 0 NOT NULL'),
            ('total_reviews_received', 'INTEGER DEFAULT 0 NOT NULL'),
            ('avg_rating', 'NUMERIC(3,2)'),
            ('avg_response_time_hours', 'INTEGER'),
        ]

        for col_name, col_type in profile_columns:
            if col_name not in existing_columns:
                print(f"Adding column: {col_name}")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            else:
                print(f"Column {col_name} already exists, skipping")

        # Create indexes if they don't exist
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='index' AND name='idx_users_avg_rating'
        """)
        if not cursor.fetchone():
            print("Creating index: idx_users_avg_rating")
            cursor.execute("""
                CREATE INDEX idx_users_avg_rating ON users(avg_rating)
            """)
        else:
            print("Index idx_users_avg_rating already exists")

        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='index' AND name='idx_users_total_reviews_given'
        """)
        if not cursor.fetchone():
            print("Creating index: idx_users_total_reviews_given")
            cursor.execute("""
                CREATE INDEX idx_users_total_reviews_given ON users(total_reviews_given)
            """)
        else:
            print("Index idx_users_total_reviews_given already exists")

        # MIGRATION 2: Create portfolio table
        print("\n=== Migration 2: Creating portfolio table ===")

        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='portfolio'
        """)

        if cursor.fetchone():
            print("Portfolio table already exists, skipping creation")
        else:
            print("Creating portfolio table")
            cursor.execute("""
                CREATE TABLE portfolio (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    content_type VARCHAR(50) NOT NULL,
                    image_url VARCHAR(500),
                    project_url VARCHAR(500),
                    rating NUMERIC(3,2),
                    views_count INTEGER DEFAULT 0 NOT NULL,
                    is_featured INTEGER DEFAULT 0 NOT NULL,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)

            # Create indexes for portfolio table
            print("Creating portfolio indexes")
            cursor.execute("""
                CREATE INDEX idx_portfolio_user_created
                ON portfolio(user_id, created_at)
            """)
            cursor.execute("""
                CREATE INDEX idx_portfolio_content_type
                ON portfolio(content_type, created_at)
            """)
            cursor.execute("""
                CREATE INDEX idx_portfolio_featured
                ON portfolio(is_featured, created_at)
            """)
            cursor.execute("""
                CREATE INDEX ix_portfolio_id ON portfolio(id)
            """)
            cursor.execute("""
                CREATE INDEX ix_portfolio_user_id ON portfolio(user_id)
            """)
            cursor.execute("""
                CREATE INDEX ix_portfolio_content_type ON portfolio(content_type)
            """)

        # Update alembic_version to reflect these migrations
        print("\n=== Updating alembic_version table ===")
        cursor.execute("""
            SELECT version_num FROM alembic_version
        """)
        current_version = cursor.fetchone()

        if current_version:
            current_version = current_version[0]
            print(f"Current version: {current_version}")

            # Update to the latest migration version
            cursor.execute("""
                UPDATE alembic_version SET version_num = 'i2b3c4d5e6f7'
            """)
            print("Updated alembic_version to: i2b3c4d5e6f7")
        else:
            print("No alembic_version found, inserting new version")
            cursor.execute("""
                INSERT INTO alembic_version (version_num) VALUES ('i2b3c4d5e6f7')
            """)

        conn.commit()
        print("\n✓ All migrations applied successfully!")

        # Verify the changes
        print("\n=== Verifying database schema ===")
        cursor.execute("PRAGMA table_info(users)")
        user_columns = cursor.fetchall()
        profile_cols = [col for col in user_columns if col[1] in
                       ['title', 'specialty_tags', 'badges', 'total_reviews_given',
                        'total_reviews_received', 'avg_rating', 'avg_response_time_hours']]
        print(f"Profile columns in users table: {len(profile_cols)}/7")
        for col in profile_cols:
            print(f"  - {col[1]} ({col[2]})")

        cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='portfolio'")
        portfolio_exists = cursor.fetchone()[0]
        print(f"\nPortfolio table exists: {bool(portfolio_exists)}")

        if portfolio_exists:
            cursor.execute("PRAGMA table_info(portfolio)")
            portfolio_columns = cursor.fetchall()
            print(f"Portfolio table columns: {len(portfolio_columns)}")
            for col in portfolio_columns:
                print(f"  - {col[1]} ({col[2]})")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"Error applying migrations: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    db_path = sys.argv[1] if len(sys.argv) > 1 else "critvue_dev.db"

    if not os.path.exists(db_path):
        print(f"Error: Database file {db_path} not found", file=sys.stderr)
        sys.exit(1)

    success = run_migrations(db_path)
    sys.exit(0 if success else 1)
