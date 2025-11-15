# Manual Test Scripts

This directory contains manual integration test scripts used during development and debugging.

## Avatar Upload Tests

### Quick Test Scripts

**`test_avatar_api.py`**
- Python script for testing avatar upload API endpoints
- Tests basic upload, retrieval, and deletion
- Run: `python test_avatar_api.py`

**`test_avatar_api.sh`**
- Bash script for curl-based API testing
- Tests avatar endpoints with sample images
- Run: `./test_avatar_api.sh`

### Comprehensive Tests

**`test-avatar-complete-flow.sh`**
- Complete end-to-end avatar upload flow
- Tests all variants generation and storage
- Validates file persistence and URLs
- Run: `./test-avatar-complete-flow.sh`

**`test_avatar_persistence.py`**
- Tests avatar persistence after page refresh
- Validates database and file system state
- Checks cross-origin URL handling
- Run: `python test_avatar_persistence.py`

**`test_avatar_persistence_fix.py`**
- Verification script for avatar persistence fixes
- Tests ProfileResponse schema compatibility
- Validates absolute URL conversion
- Checks all required fields (including is_active)
- Run: `python test_avatar_persistence_fix.py`

## Usage

These scripts are intended for:
- Manual testing during development
- Debugging specific issues
- Verifying bug fixes
- Integration testing with real API calls

For automated unit/integration tests, see `../test_avatar_upload.py` and the `../integration/` directory.

## Requirements

- Backend server running on http://localhost:8000
- Test user account (arend@gmail.com / Test123!)
- Python 3.9+ with requests library
- curl (for bash scripts)

## Notes

- These scripts make real API calls to localhost
- Some scripts create temporary test files
- Scripts are preserved for reference and debugging
- For CI/CD, use pytest-based tests instead
