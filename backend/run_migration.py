#!/usr/bin/env python3
"""
Script to run pending Alembic migrations
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from alembic.config import Config
    from alembic import command

    # Create Alembic config
    alembic_cfg = Config("alembic.ini")

    # Run migrations to head
    print("Running database migrations...")
    command.upgrade(alembic_cfg, "head")
    print("✓ Migrations completed successfully")

except Exception as e:
    print(f"✗ Migration failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
