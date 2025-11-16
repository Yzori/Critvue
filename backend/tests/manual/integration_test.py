#!/usr/bin/env python3
"""
Comprehensive Integration Tests for Critvue Authentication System
Tests all authentication endpoints, CORS, token management, and error handling
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any

# Base URL for the API
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

# Test data
TEST_USER = {
    "email": f"test_{int(time.time())}@example.com",
    "password": "SecurePassword123!",
    "full_name": "Test User"
}

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.tests = []

    def add_test(self, name: str, passed: bool, details: str = "", warning: bool = False):
        status = "PASS" if passed else "FAIL"
        if warning:
            status = "WARN"
            self.warnings += 1
        elif passed:
            self.passed += 1
        else:
            self.failed += 1

        self.tests.append({
            "name": name,
            "status": status,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        })

    def print_summary(self):
        print(f"\n{Colors.BOLD}{'='*80}{Colors.ENDC}")
        print(f"{Colors.BOLD}TEST SUMMARY{Colors.ENDC}")
        print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")
        print(f"\n{Colors.GREEN}Passed: {self.passed}{Colors.ENDC}")
        print(f"{Colors.RED}Failed: {self.failed}{Colors.ENDC}")
        print(f"{Colors.YELLOW}Warnings: {self.warnings}{Colors.ENDC}")
        print(f"Total: {self.passed + self.failed + self.warnings}")

        if self.failed > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}FAILED TESTS:{Colors.ENDC}")
            for test in self.tests:
                if test["status"] == "FAIL":
                    print(f"  - {test['name']}")
                    if test['details']:
                        print(f"    {test['details']}")

def print_section(title: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.ENDC}\n")

def print_test(name: str, passed: bool, details: str = ""):
    status_color = Colors.GREEN if passed else Colors.RED
    status = "✓" if passed else "✗"
    print(f"{status_color}{status} {name}{Colors.ENDC}")
    if details:
        print(f"  {details}")

def test_health_check(results: TestResults) -> bool:
    """Test 1: Health Check Endpoint"""
    print_section("1. Backend Server Status")

    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        data = response.json()

        passed = response.status_code == 200
        print_test("Health check endpoint responds", passed)
        results.add_test("Health check endpoint", passed, f"Status: {response.status_code}")

        if passed:
            print(f"  Status: {data.get('status')}")
            print(f"  Service: {data.get('service')}")
            print(f"  Database: {data.get('database')}")
            print(f"  Version: {data.get('version')}")

            db_connected = data.get('database') == 'connected'
            print_test("Database connectivity", db_connected)
            results.add_test("Database connectivity", db_connected)

            return True
        return False
    except requests.exceptions.RequestException as e:
        print_test("Health check endpoint responds", False, str(e))
        results.add_test("Health check endpoint", False, str(e))
        return False

def test_cors_configuration(results: TestResults):
    """Test 2: CORS Configuration"""
    print_section("2. CORS Configuration")

    # Test preflight request
    try:
        response = requests.options(
            f"{API_V1}/auth/register",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"
            }
        )

        cors_origin = response.headers.get('Access-Control-Allow-Origin')
        cors_credentials = response.headers.get('Access-Control-Allow-Credentials')
        cors_methods = response.headers.get('Access-Control-Allow-Methods')

        print(f"  CORS Origin: {cors_origin}")
        print(f"  CORS Credentials: {cors_credentials}")
        print(f"  CORS Methods: {cors_methods}")

        passed = cors_origin is not None
        print_test("CORS headers present", passed)
        results.add_test("CORS headers present", passed)

        credentials_ok = cors_credentials == 'true'
        print_test("CORS credentials allowed", credentials_ok)
        results.add_test("CORS credentials allowed", credentials_ok)

        origin_ok = "http://localhost:3000" in str(cors_origin)
        print_test("Frontend origin allowed", origin_ok)
        results.add_test("Frontend origin allowed", origin_ok)

    except Exception as e:
        print_test("CORS configuration", False, str(e))
        results.add_test("CORS configuration", False, str(e))

def test_register_endpoint(results: TestResults) -> tuple[bool, Dict[str, Any]]:
    """Test 3: User Registration"""
    print_section("3. User Registration (POST /api/v1/auth/register)")

    print(f"Test user email: {TEST_USER['email']}")

    try:
        response = requests.post(
            f"{API_V1}/auth/register",
            json=TEST_USER,
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 201:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")

            # Check response structure - registration returns user data only, not tokens
            has_id = 'id' in data
            has_email = 'email' in data
            has_role = 'role' in data

            print_test("Registration successful (201)", True)
            print_test("User ID present", has_id)
            print_test("User email present", has_email)
            print_test("User role present", has_role)

            results.add_test("User registration", True)
            results.add_test("User ID in response", has_id)
            results.add_test("User email in response", has_email)
            results.add_test("User role in response", has_role)

            print(f"\n  User ID: {data.get('id')}")
            print(f"  Email: {data.get('email')}")
            print(f"  Full Name: {data.get('full_name')}")
            print(f"  Role: {data.get('role')}")
            print(f"  Is Active: {data.get('is_active')}")

            return True, data
        else:
            print(f"Error: {response.text}")
            print_test("Registration successful", False, f"Status: {response.status_code}")
            results.add_test("User registration", False, f"Status: {response.status_code}")
            return False, {}

    except Exception as e:
        print_test("Registration endpoint", False, str(e))
        results.add_test("User registration", False, str(e))
        return False, {}

def test_duplicate_registration(results: TestResults):
    """Test 4: Duplicate Registration"""
    print_section("4. Duplicate Registration Prevention")

    try:
        response = requests.post(
            f"{API_V1}/auth/register",
            json=TEST_USER,
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        # Should return 400 or 409 for duplicate
        passed = response.status_code in [400, 409]
        print_test("Duplicate registration rejected", passed)
        results.add_test("Duplicate registration prevention", passed,
                        f"Status: {response.status_code}")

    except Exception as e:
        print_test("Duplicate registration test", False, str(e))
        results.add_test("Duplicate registration test", False, str(e))

def test_login_endpoint(results: TestResults) -> tuple[bool, Dict[str, Any]]:
    """Test 5: User Login"""
    print_section("5. User Login (POST /api/v1/auth/login)")

    try:
        # Login with JSON data (as expected by UserLogin schema)
        response = requests.post(
            f"{API_V1}/auth/login",
            json={
                "email": TEST_USER['email'],
                "password": TEST_USER['password']
            },
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")

            has_access_token = 'access_token' in data
            has_refresh_token = 'refresh_token' in data
            has_token_type = data.get('token_type') == 'bearer'

            print_test("Login successful (200)", True)
            print_test("Access token present", has_access_token)
            print_test("Refresh token present", has_refresh_token)
            print_test("Token type is bearer", has_token_type)

            results.add_test("User login", True)
            results.add_test("Login access token", has_access_token)
            results.add_test("Login refresh token", has_refresh_token)
            results.add_test("Bearer token type", has_token_type)

            return True, data
        else:
            print(f"Error: {response.text}")
            print_test("Login successful", False, f"Status: {response.status_code}")
            results.add_test("User login", False, f"Status: {response.status_code}")
            return False, {}

    except Exception as e:
        print_test("Login endpoint", False, str(e))
        results.add_test("User login", False, str(e))
        return False, {}

def test_wrong_credentials(results: TestResults):
    """Test 6: Login with Wrong Credentials"""
    print_section("6. Invalid Credentials Handling")

    try:
        response = requests.post(
            f"{API_V1}/auth/login",
            json={
                "email": TEST_USER['email'],
                "password": "WrongPassword123!"
            },
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        # Should return 401 for invalid credentials
        passed = response.status_code == 401
        print_test("Wrong credentials rejected (401)", passed)
        results.add_test("Invalid credentials rejection", passed,
                        f"Status: {response.status_code}")

    except Exception as e:
        print_test("Wrong credentials test", False, str(e))
        results.add_test("Wrong credentials test", False, str(e))

def test_protected_endpoint(results: TestResults, access_token: str):
    """Test 7: Protected Endpoint Access"""
    print_section("7. Protected Endpoint (GET /api/v1/auth/me)")

    try:
        # Test with valid token
        response = requests.get(
            f"{API_V1}/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")

            print_test("Protected endpoint with valid token", True)
            results.add_test("Protected endpoint access", True)

            has_user_data = 'email' in data
            print_test("User data returned", has_user_data)
            results.add_test("User data in /me endpoint", has_user_data)
        else:
            print(f"Error: {response.text}")
            print_test("Protected endpoint access", False, f"Status: {response.status_code}")
            results.add_test("Protected endpoint access", False)

        # Test without token
        response = requests.get(f"{API_V1}/auth/me")
        print(f"\nWithout token - Status Code: {response.status_code}")

        # FastAPI returns 403 for missing credentials (not authenticated)
        # and 401 for invalid credentials (authentication failed)
        unauthorized = response.status_code in [401, 403]
        print_test("Unauthorized access rejected (401/403)", unauthorized)
        results.add_test("Unauthorized access rejection", unauthorized)

        # Test with invalid token
        response = requests.get(
            f"{API_V1}/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        print(f"Invalid token - Status Code: {response.status_code}")

        invalid_rejected = response.status_code == 401
        print_test("Invalid token rejected (401)", invalid_rejected)
        results.add_test("Invalid token rejection", invalid_rejected)

    except Exception as e:
        print_test("Protected endpoint test", False, str(e))
        results.add_test("Protected endpoint test", False, str(e))

def test_refresh_token(results: TestResults, refresh_token: str) -> tuple[bool, str]:
    """Test 8: Refresh Token Flow"""
    print_section("8. Token Refresh (POST /api/v1/auth/refresh)")

    try:
        response = requests.post(
            f"{API_V1}/auth/refresh",
            json={"refresh_token": refresh_token},
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")

            has_new_access = 'access_token' in data
            has_new_refresh = 'refresh_token' in data

            print_test("Token refresh successful", True)
            print_test("New access token received", has_new_access)
            print_test("New refresh token received", has_new_refresh)

            results.add_test("Token refresh", True)
            results.add_test("New access token", has_new_access)
            results.add_test("New refresh token", has_new_refresh)

            return True, data.get('access_token', '')
        else:
            print(f"Error: {response.text}")
            print_test("Token refresh", False, f"Status: {response.status_code}")
            results.add_test("Token refresh", False, f"Status: {response.status_code}")
            return False, ''

    except Exception as e:
        print_test("Token refresh test", False, str(e))
        results.add_test("Token refresh test", False, str(e))
        return False, ''

def test_password_reset_request(results: TestResults):
    """Test 9: Password Reset Request"""
    print_section("9. Password Reset Request (POST /api/v1/auth/password-reset/request)")

    try:
        response = requests.post(
            f"{API_V1}/auth/password-reset/request",
            json={"email": TEST_USER['email']},
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        # Should return 200 even if email doesn't exist (security)
        passed = response.status_code == 200
        print_test("Password reset request accepted", passed)
        results.add_test("Password reset request", passed,
                        f"Status: {response.status_code}")

    except Exception as e:
        print_test("Password reset request", False, str(e))
        results.add_test("Password reset request", False, str(e))

def test_validation_errors(results: TestResults):
    """Test 10: Input Validation"""
    print_section("10. Input Validation & Error Handling")

    # Test invalid email
    try:
        response = requests.post(
            f"{API_V1}/auth/register",
            json={
                "email": "invalid-email",
                "password": "Password123!",
                "full_name": "Test"
            }
        )

        print(f"Invalid email - Status Code: {response.status_code}")
        validation_works = response.status_code == 422
        print_test("Invalid email rejected (422)", validation_works)
        results.add_test("Email validation", validation_works)

    except Exception as e:
        print_test("Email validation test", False, str(e))
        results.add_test("Email validation test", False, str(e))

    # Test weak password
    try:
        response = requests.post(
            f"{API_V1}/auth/register",
            json={
                "email": f"test2_{int(time.time())}@example.com",
                "password": "123",
                "full_name": "Test"
            }
        )

        print(f"Weak password - Status Code: {response.status_code}")
        weak_pwd_rejected = response.status_code == 422
        print_test("Weak password rejected (422)", weak_pwd_rejected)
        results.add_test("Password strength validation", weak_pwd_rejected)

    except Exception as e:
        print_test("Password validation test", False, str(e))
        results.add_test("Password validation test", False, str(e))

    # Test missing fields
    try:
        response = requests.post(
            f"{API_V1}/auth/register",
            json={"email": "test@example.com"}
        )

        print(f"Missing fields - Status Code: {response.status_code}")
        missing_rejected = response.status_code == 422
        print_test("Missing required fields rejected (422)", missing_rejected)
        results.add_test("Required fields validation", missing_rejected)

    except Exception as e:
        print_test("Required fields test", False, str(e))
        results.add_test("Required fields test", False, str(e))

def main():
    """Run all integration tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("="*80)
    print("CRITVUE AUTHENTICATION SYSTEM - INTEGRATION TESTING")
    print("="*80)
    print(f"{Colors.ENDC}")
    print(f"Base URL: {BASE_URL}")
    print(f"API Version: v1")
    print(f"Test Time: {datetime.utcnow().isoformat()}\n")

    results = TestResults()

    # 1. Health Check
    if not test_health_check(results):
        print(f"\n{Colors.RED}Backend is not healthy. Stopping tests.{Colors.ENDC}")
        return

    # 2. CORS Configuration
    test_cors_configuration(results)

    # 3. Registration
    success, register_data = test_register_endpoint(results)
    if not success:
        print(f"\n{Colors.RED}Registration failed. Cannot continue with remaining tests.{Colors.ENDC}")
        results.print_summary()
        return

    access_token = register_data.get('access_token', '')
    refresh_token = register_data.get('refresh_token', '')

    # 4. Duplicate Registration
    test_duplicate_registration(results)

    # 5. Login
    success, login_data = test_login_endpoint(results)
    if success:
        access_token = login_data.get('access_token', access_token)
        refresh_token = login_data.get('refresh_token', refresh_token)

    # 6. Wrong Credentials
    test_wrong_credentials(results)

    # 7. Protected Endpoint
    if access_token:
        test_protected_endpoint(results, access_token)

    # 8. Refresh Token
    if refresh_token:
        success, new_token = test_refresh_token(results, refresh_token)
        if success and new_token:
            access_token = new_token

    # 9. Password Reset
    test_password_reset_request(results)

    # 10. Validation
    test_validation_errors(results)

    # Print summary
    results.print_summary()

    # Final recommendations
    print(f"\n{Colors.BOLD}{Colors.BLUE}RECOMMENDATIONS:{Colors.ENDC}")
    if results.failed == 0:
        print(f"{Colors.GREEN}✓ All tests passed! Backend is ready for frontend integration.{Colors.ENDC}")
    else:
        print(f"{Colors.RED}✗ {results.failed} test(s) failed. Please review and fix issues before integration.{Colors.ENDC}")

    if results.warnings > 0:
        print(f"{Colors.YELLOW}⚠ {results.warnings} warning(s) detected. Review recommended but not critical.{Colors.ENDC}")

if __name__ == "__main__":
    main()
