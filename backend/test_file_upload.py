#!/usr/bin/env python3
"""
Quick test script for file upload system
Run this to verify basic functionality
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing imports...")

    try:
        from app.utils.file_utils import (
            validate_file_type,
            validate_file_size,
            generate_unique_filename,
            calculate_file_hash,
            get_upload_directory,
            ALLOWED_MIME_TYPES,
            SIZE_LIMITS
        )
        print("✓ File utilities imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import file utilities: {e}")
        return False

    try:
        from app.api.v1.files import router
        print("✓ Files router imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import files router: {e}")
        return False

    try:
        from app.models.review_file import ReviewFile
        print("✓ ReviewFile model imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import ReviewFile model: {e}")
        return False

    return True


def test_configuration():
    """Test configuration values"""
    print("\nTesting configuration...")

    from app.utils.file_utils import ALLOWED_MIME_TYPES, SIZE_LIMITS, UPLOAD_BASE_DIR

    # Check content types
    expected_types = ["design", "code", "video", "audio", "writing", "art"]
    for content_type in expected_types:
        if content_type not in ALLOWED_MIME_TYPES:
            print(f"✗ Missing allowed MIME types for: {content_type}")
            return False
        if content_type not in SIZE_LIMITS:
            print(f"✗ Missing size limit for: {content_type}")
            return False

    print(f"✓ All content types configured")
    print(f"✓ Upload directory: {UPLOAD_BASE_DIR}")

    return True


def test_utilities():
    """Test utility functions"""
    print("\nTesting utility functions...")

    from app.utils.file_utils import generate_unique_filename, calculate_file_hash

    # Test filename generation
    filename1 = generate_unique_filename("test.jpg")
    filename2 = generate_unique_filename("test.jpg")

    if filename1 == filename2:
        print("✗ Unique filenames are not unique!")
        return False

    if not filename1.endswith(".jpg"):
        print("✗ Extension not preserved in unique filename")
        return False

    print(f"✓ Unique filename generation works: {filename1}")

    # Test hash calculation
    test_data = b"Hello, World!"
    hash1 = calculate_file_hash(test_data)
    hash2 = calculate_file_hash(test_data)

    if hash1 != hash2:
        print("✗ Hash calculation not consistent")
        return False

    if len(hash1) != 64:  # SHA-256 produces 64 hex characters
        print(f"✗ Hash length incorrect: {len(hash1)}")
        return False

    print(f"✓ Hash calculation works: {hash1[:16]}...")

    return True


def test_directory_creation():
    """Test upload directory creation"""
    print("\nTesting directory creation...")

    from app.utils.file_utils import get_upload_directory

    try:
        for content_type in ["design", "code", "video", "audio", "writing", "art"]:
            dir_path = get_upload_directory(content_type)
            if not dir_path.exists():
                print(f"✗ Directory not created for {content_type}")
                return False

        print("✓ All content type directories exist")
        return True
    except Exception as e:
        print(f"✗ Directory creation failed: {e}")
        return False


def test_dependencies():
    """Test required dependencies"""
    print("\nTesting dependencies...")

    try:
        import magic
        print("✓ python-magic available")
    except ImportError:
        print("✗ python-magic not installed (pip install python-magic)")
        return False

    try:
        from PIL import Image
        print("✓ Pillow available")
    except ImportError:
        print("✗ Pillow not installed (pip install pillow)")
        return False

    return True


def main():
    """Run all tests"""
    print("=" * 60)
    print("Critvue File Upload System - Basic Tests")
    print("=" * 60)

    tests = [
        ("Dependencies", test_dependencies),
        ("Imports", test_imports),
        ("Configuration", test_configuration),
        ("Utilities", test_utilities),
        ("Directory Creation", test_directory_creation),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ Test '{name}' raised exception: {e}")
            results.append((name, False))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! File upload system is ready.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
