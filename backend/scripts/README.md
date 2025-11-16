# Backend Utility Scripts

This directory contains utility scripts organized by purpose. All scripts should be run from the backend root directory.

## Directory Structure

```
scripts/
├── migrations/          # Database migration utilities
├── dev/                 # Development and testing utilities
└── validation/          # Setup verification and validation scripts
```

## Migration Scripts (`migrations/`)

Scripts for applying and managing database migrations.

### `apply_profile_migrations.py`
Directly applies profile-related migrations to SQLite database.
```bash
python scripts/migrations/apply_profile_migrations.py [db_path]
```

### `apply_review_slots_migration.py`
Applies review_slots table migration to SQLite database.
```bash
python scripts/migrations/apply_review_slots_migration.py [db_path]
```

### `run_migration.py`
Runs pending Alembic migrations.
```bash
python scripts/migrations/run_migration.py
```

## Development Scripts (`dev/`)

Scripts for generating test data and development utilities.

### `create_mock_reviews.py`
Creates mock review requests for testing the browse page.
```bash
python scripts/dev/create_mock_reviews.py
```

## Validation Scripts (`validation/`)

Scripts for verifying system setup and database integrity.

### `verify_setup.py`
Comprehensive verification of Review Request system setup.
```bash
python scripts/validation/verify_setup.py
```

Checks:
- All imports successful
- All enums properly defined
- All model relationships configured
- All CRUD methods present
- All API endpoints registered

### `validate_review_slots.py`
Validates review_slots database structure.
```bash
python scripts/validation/validate_review_slots.py
```

Checks:
- review_slots table exists
- All columns are present
- All indexes are created
- Foreign key constraints are configured
- reviews_completed field exists

## Usage Guidelines

1. Always run scripts from the backend root directory
2. Activate the virtual environment first: `source venv/bin/activate`
3. Ensure the database file exists before running migration scripts
4. Run validation scripts after migrations to verify success

## Notes

- Migration scripts work directly with SQLite for development
- Use Alembic for production migrations: `alembic upgrade head`
- Validation scripts are safe to run anytime (read-only operations)
- Development scripts should only be used in development environments
