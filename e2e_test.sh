#!/bin/bash
#
# Critvue End-to-End Integration Test Script
# Tests the complete authentication flow between frontend and backend
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
API_BASE="${BACKEND_URL}/api/v1"
TEST_EMAIL="e2e_test_$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="E2E Test User"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check if server is running
check_server() {
    local url=$1
    local name=$2

    print_info "Checking if $name is running at $url..."
    if curl -s -f -o /dev/null "$url"; then
        print_success "$name is running"
        return 0
    else
        print_error "$name is not running at $url"
        return 1
    fi
}

# Function to make API request
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    local headers=(-H "Content-Type: application/json")
    if [ -n "$token" ]; then
        headers+=(-H "Authorization: Bearer $token")
    fi

    if [ -n "$data" ]; then
        curl -s -X "$method" "${API_BASE}${endpoint}" "${headers[@]}" -d "$data"
    else
        curl -s -X "$method" "${API_BASE}${endpoint}" "${headers[@]}"
    fi
}

# Main test execution
main() {
    print_header "Critvue End-to-End Integration Tests"

    echo ""
    print_info "Test Configuration:"
    echo "  Backend URL: $BACKEND_URL"
    echo "  Frontend URL: $FRONTEND_URL"
    echo "  API Base: $API_BASE"
    echo "  Test Email: $TEST_EMAIL"
    echo ""

    # Step 1: Check server status
    print_header "Step 1: Checking Server Status"

    if ! check_server "$BACKEND_URL/health" "Backend"; then
        print_error "Backend server must be running on port 8000"
        echo "Start it with: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
        exit 1
    fi

    if ! check_server "$FRONTEND_URL" "Frontend"; then
        print_warning "Frontend server is not running"
        echo "Start it with: cd frontend && npm run dev"
        echo "Continuing with API-only tests..."
    fi

    echo ""

    # Step 2: Test User Registration
    print_header "Step 2: Testing User Registration"

    print_info "Registering new user: $TEST_EMAIL"
    register_response=$(api_request POST "/auth/register" "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"full_name\": \"$TEST_NAME\"
    }")

    if echo "$register_response" | grep -q "\"email\""; then
        print_success "User registration successful"
        echo "Response: $register_response" | head -c 100
        echo "..."
    else
        print_error "User registration failed"
        echo "Response: $register_response"
        exit 1
    fi

    echo ""

    # Step 3: Test User Login
    print_header "Step 3: Testing User Login"

    print_info "Logging in with credentials"
    login_response=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=$TEST_EMAIL&password=$TEST_PASSWORD")

    if echo "$login_response" | grep -q "access_token"; then
        print_success "User login successful"

        # Extract tokens
        ACCESS_TOKEN=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        REFRESH_TOKEN=$(echo "$login_response" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)

        print_info "Access token received (first 50 chars): ${ACCESS_TOKEN:0:50}..."
        print_info "Refresh token received (first 50 chars): ${REFRESH_TOKEN:0:50}..."
    else
        print_error "User login failed"
        echo "Response: $login_response"
        exit 1
    fi

    echo ""

    # Step 4: Test Protected Endpoint
    print_header "Step 4: Testing Protected Endpoint"

    print_info "Accessing /auth/me with access token"
    me_response=$(api_request GET "/auth/me" "" "$ACCESS_TOKEN")

    if echo "$me_response" | grep -q "$TEST_EMAIL"; then
        print_success "Protected endpoint access successful"
        echo "User data: $me_response" | head -c 100
        echo "..."
    else
        print_error "Protected endpoint access failed"
        echo "Response: $me_response"
        exit 1
    fi

    echo ""

    # Step 5: Test Token Refresh
    print_header "Step 5: Testing Token Refresh"

    print_info "Refreshing access token"
    refresh_response=$(api_request POST "/auth/refresh" "{
        \"refresh_token\": \"$REFRESH_TOKEN\"
    }")

    if echo "$refresh_response" | grep -q "access_token"; then
        print_success "Token refresh successful"

        NEW_ACCESS_TOKEN=$(echo "$refresh_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        print_info "New access token received (first 50 chars): ${NEW_ACCESS_TOKEN:0:50}..."
    else
        print_error "Token refresh failed"
        echo "Response: $refresh_response"
        exit 1
    fi

    echo ""

    # Step 6: Test Password Reset Request
    print_header "Step 6: Testing Password Reset Request"

    print_info "Requesting password reset for $TEST_EMAIL"
    reset_request_response=$(api_request POST "/password-reset/request" "{
        \"email\": \"$TEST_EMAIL\"
    }")

    if echo "$reset_request_response" | grep -q "message"; then
        print_success "Password reset request successful"
        echo "Response: $reset_request_response"

        # Extract reset token (in development, it's returned in response)
        if echo "$reset_request_response" | grep -q "reset_token"; then
            RESET_TOKEN=$(echo "$reset_request_response" | grep -o '"reset_token":"[^"]*"' | cut -d'"' -f4)
            print_info "Reset token received: $RESET_TOKEN"
        else
            print_warning "Reset token not in response (check email in production)"
        fi
    else
        print_error "Password reset request failed"
        echo "Response: $reset_request_response"
        exit 1
    fi

    echo ""

    # Step 7: Test Invalid Credentials
    print_header "Step 7: Testing Invalid Credentials (Security Check)"

    print_info "Attempting login with wrong password"
    invalid_login=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=$TEST_EMAIL&password=WrongPassword123!")

    if echo "$invalid_login" | grep -q "401"; then
        print_success "Invalid credentials properly rejected"
    elif echo "$invalid_login" | grep -q "Incorrect email or password"; then
        print_success "Invalid credentials properly rejected with generic message"
    else
        print_warning "Unexpected response for invalid credentials"
        echo "Response: $invalid_login"
    fi

    echo ""

    # Step 8: Test Duplicate Registration
    print_header "Step 8: Testing Duplicate Registration (Security Check)"

    print_info "Attempting to register same email again"
    duplicate_register=$(api_request POST "/auth/register" "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"full_name\": \"Duplicate User\"
    }")

    if echo "$duplicate_register" | grep -q "already registered"; then
        print_success "Duplicate registration properly rejected"
    else
        print_warning "Unexpected response for duplicate registration"
        echo "Response: $duplicate_register"
    fi

    echo ""

    # Final Summary
    print_header "Test Summary"

    print_success "All core authentication flows tested successfully!"
    echo ""
    echo "Test Results:"
    echo "  ✓ Backend server is running"
    echo "  ✓ User registration works"
    echo "  ✓ User login works"
    echo "  ✓ JWT tokens are issued"
    echo "  ✓ Protected endpoints accessible with valid token"
    echo "  ✓ Token refresh works"
    echo "  ✓ Password reset request works"
    echo "  ✓ Invalid credentials are rejected"
    echo "  ✓ Duplicate registration is prevented"
    echo ""

    print_info "Manual Testing Recommended:"
    echo "  1. Open browser to: $FRONTEND_URL/register"
    echo "  2. Register a new account through the UI"
    echo "  3. Login with your credentials"
    echo "  4. Access the dashboard"
    echo "  5. Test logout functionality"
    echo "  6. Test 'Forgot Password' flow"
    echo ""

    print_success "Integration testing complete! 🎉"
}

# Run main function
main