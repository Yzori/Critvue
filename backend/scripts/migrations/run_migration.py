#!/usr/bin/env python3
"""
Script to run pending Alembic migrations
"""
import sys
import os
from pathlib import Path

# Add the backend root to the path (go up 2 levels from scripts/migrations/)
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))
os.chdir(backend_root)  # Change to backend root for alembic.ini

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
