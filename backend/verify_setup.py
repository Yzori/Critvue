#!/usr/bin/env python3
"""
Verification script to check if Review Request system is properly set up.
Run this before starting the application to verify all imports work.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def check_imports():
    """Check if all new modules can be imported"""
    print("Checking imports...")

    try:
        # Check models
        print("  ✓ Importing models...")
        from app.models.review_request import ReviewRequest, ContentType, ReviewType, ReviewStatus
        from app.models.review_file import ReviewFile
        from app.models.user import User

        # Check schemas
        print("  ✓ Importing schemas...")
        from app.schemas.review import (
            ReviewRequestCreate,
            ReviewRequestUpdate,
            ReviewRequestResponse,
            ReviewFileCreate,
            ReviewFileResponse
        )

        # Check CRUD
        print("  ✓ Importing CRUD operations...")
        from app.crud.review import review_crud

        # Check API
        print("  ✓ Importing API router...")
        from app.api.v1.reviews import router

        print("\n✅ All imports successful!\n")
        return True

    except ImportError as e:
        print(f"\n❌ Import error: {e}\n")
        return False


def check_enums():
    """Check if enums are properly defined"""
    print("Checking enums...")

    try:
        from app.models.review_request import ContentType, ReviewType, ReviewStatus

        # Check ContentType
        content_types = [ct.value for ct in ContentType]
        expected_content = ['design', 'code', 'video', 'audio', 'writing', 'art']
        assert content_types == expected_content, f"ContentType mismatch: {content_types}"
        print(f"  ✓ ContentType: {', '.join(content_types)}")

        # Check ReviewType
        review_types = [rt.value for rt in ReviewType]
        expected_review = ['free', 'expert']
        assert review_types == expected_review, f"ReviewType mismatch: {review_types}"
        print(f"  ✓ ReviewType: {', '.join(review_types)}")

        # Check ReviewStatus
        statuses = [rs.value for rs in ReviewStatus]
        expected_status = ['draft', 'pending', 'in_review', 'completed', 'cancelled']
        assert statuses == expected_status, f"ReviewStatus mismatch: {statuses}"
        print(f"  ✓ ReviewStatus: {', '.join(statuses)}")

        print("\n✅ All enums properly defined!\n")
        return True

    except Exception as e:
        print(f"\n❌ Enum check failed: {e}\n")
        return False


def check_models():
    """Check if models have required relationships"""
    print("Checking model relationships...")

    try:
        from app.models.user import User
        from app.models.review_request import ReviewRequest
        from app.models.review_file import ReviewFile

        # Check User has review_requests relationship
        assert hasattr(User, 'review_requests'), "User missing review_requests relationship"
        print("  ✓ User.review_requests relationship")

        # Check ReviewRequest has user and files relationships
        assert hasattr(ReviewRequest, 'user'), "ReviewRequest missing user relationship"
        assert hasattr(ReviewRequest, 'files'), "ReviewRequest missing files relationship"
        print("  ✓ ReviewRequest.user relationship")
        print("  ✓ ReviewRequest.files relationship")

        # Check ReviewFile has review_request relationship
        assert hasattr(ReviewFile, 'review_request'), "ReviewFile missing review_request relationship"
        print("  ✓ ReviewFile.review_request relationship")

        print("\n✅ All relationships properly defined!\n")
        return True

    except Exception as e:
        print(f"\n❌ Relationship check failed: {e}\n")
        return False


def check_crud_methods():
    """Check if CRUD class has all required methods"""
    print("Checking CRUD methods...")

    try:
        from app.crud.review import review_crud

        required_methods = [
            'create_review_request',
            'get_review_request',
            'get_user_review_requests',
            'update_review_request',
            'delete_review_request',
            'add_file_to_review',
            'get_review_stats'
        ]

        for method in required_methods:
            assert hasattr(review_crud, method), f"Missing method: {method}"
            print(f"  ✓ review_crud.{method}")

        print("\n✅ All CRUD methods present!\n")
        return True

    except Exception as e:
        print(f"\n❌ CRUD check failed: {e}\n")
        return False


def check_api_endpoints():
    """Check if API router has all endpoints"""
    print("Checking API endpoints...")

    try:
        from app.api.v1.reviews import router

        # Get all routes
        routes = [route.path for route in router.routes]

        expected_paths = [
            '',  # POST/GET /reviews
            '/stats',  # GET /reviews/stats
            '/{review_id}'  # GET/PATCH/DELETE /reviews/{id}
        ]

        for path in expected_paths:
            # Check if path exists in routes
            matching_routes = [r for r in routes if r.endswith(path)]
            assert len(matching_routes) > 0, f"Missing endpoint: {path}"
            print(f"  ✓ {path}")

        print(f"\n  Total routes: {len(router.routes)}")
        print("\n✅ All API endpoints present!\n")
        return True

    except Exception as e:
        print(f"\n❌ API check failed: {e}\n")
        return False


def main():
    """Run all verification checks"""
    print("=" * 60)
    print("Review Request System - Setup Verification")
    print("=" * 60)
    print()

    checks = [
        check_imports,
        check_enums,
        check_models,
        check_crud_methods,
        check_api_endpoints
    ]

    results = []
    for check in checks:
        result = check()
        results.append(result)

    print("=" * 60)
    if all(results):
        print("✅ ALL CHECKS PASSED!")
        print("\nYour Review Request system is properly configured.")
        print("You can now run the database migration:")
        print("  $ alembic upgrade head")
        print("\nThen start the application:")
        print("  $ uvicorn app.main:app --reload")
    else:
        print("❌ SOME CHECKS FAILED!")
        print("\nPlease fix the errors above before proceeding.")
        sys.exit(1)
    print("=" * 60)


if __name__ == "__main__":
    main()
