#!/bin/bash
#
# Authentication Integration Tests Runner
#
# This script provides convenient commands to run authentication tests
# with various options and configurations.
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory (tests/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Backend root directory
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

# Activate virtual environment if it exists
if [ -d "venv/bin" ]; then
    source venv/bin/activate
else
    echo -e "${YELLOW}Warning: Virtual environment not found. Using system Python.${NC}"
fi

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

# Function to print header
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to show usage
show_usage() {
    cat << EOF
${GREEN}Authentication Integration Tests Runner${NC}

${YELLOW}Usage:${NC}
    $0 [command] [options]

${YELLOW}Commands:${NC}
    all                 Run all authentication tests (default)
    registration        Run user registration tests only
    login               Run user login tests only
    tokens              Run token management tests only
    protected           Run protected endpoint tests only
    password-reset      Run password reset tests only
    security            Run security feature tests only
    edge-cases          Run edge case tests only
    performance         Run performance tests only
    integration         Run integration scenario tests only

    coverage            Run all tests with coverage report
    fast                Run tests without coverage (faster)
    verbose             Run tests with verbose output
    debug               Run tests with debug output (very verbose)

    collect             List all available tests without running
    count               Count total number of tests

    help                Show this help message

${YELLOW}Options:${NC}
    -v, --verbose       Verbose output
    -x, --stop          Stop on first failure
    -s, --stdout        Show print statements
    --parallel          Run tests in parallel (requires pytest-xdist)
    --failed            Run only previously failed tests
    --pdb               Drop into debugger on failure

${YELLOW}Examples:${NC}
    $0                          # Run all tests
    $0 all                      # Run all tests
    $0 login -v                 # Run login tests verbosely
    $0 security --verbose       # Run security tests verbosely
    $0 coverage                 # Run with coverage report
    $0 fast -x                  # Run fast, stop on first failure
    $0 all --parallel           # Run all tests in parallel

${YELLOW}Quick Commands:${NC}
    $0 count                    # Count total tests: 56 tests
    $0 collect                  # List all test names

EOF
}

# Check if pytest is installed
check_pytest() {
    if ! python -m pytest --version &> /dev/null; then
        print_error "pytest is not installed!"
        echo "Please install with: pip install -r requirements.txt"
        exit 1
    fi
}

# Parse additional arguments
parse_args() {
    PYTEST_ARGS=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                PYTEST_ARGS="$PYTEST_ARGS -vv"
                shift
                ;;
            -x|--stop)
                PYTEST_ARGS="$PYTEST_ARGS -x"
                shift
                ;;
            -s|--stdout)
                PYTEST_ARGS="$PYTEST_ARGS -s"
                shift
                ;;
            --parallel)
                PYTEST_ARGS="$PYTEST_ARGS -n 4"
                shift
                ;;
            --failed)
                PYTEST_ARGS="$PYTEST_ARGS --lf"
                shift
                ;;
            --pdb)
                PYTEST_ARGS="$PYTEST_ARGS --pdb"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    echo "$PYTEST_ARGS"
}

# Main command dispatcher
COMMAND=${1:-all}
shift || true
EXTRA_ARGS=$(parse_args "$@")

check_pytest

case $COMMAND in
    all)
        print_header "Running All Authentication Tests (56 tests)"
        python -m pytest tests/integration/test_auth_integration.py -v $EXTRA_ARGS
        ;;

    registration)
        print_header "Running User Registration Tests (9 tests)"
        python -m pytest tests/integration/test_auth_integration.py::TestUserRegistration -v $EXTRA_ARGS
        ;;

    login)
        print_header "Running User Login Tests (6 tests)"
        python -m pytest tests/integration/test_auth_integration.py::TestUserLogin -v $EXTRA_ARGS
        ;;

    tokens)
        print_header "Running Token Management Tests (7 tests)"
        python -m pytest tests/integration/test_auth_integration.py::TestTokenManagement -v $EXTRA_ARGS
        ;;

    protected)
        print_header "Running Protected Endpoint Tests (6 tests)"
        python -m pytest tests/integration/test_auth_integration.py::TestProtectedEndpoints -v $EXTRA_ARGS
        ;;

    password-reset)
        print_header "Running Password Reset Tests (7 tests)"
        python -m pytest tests/integration/test_auth_integration.py::TestPasswordReset -v $EXTRA_ARGS
        ;;

    security)
        print_header "Running Security Feature Tests (9 tests)"
        python -m pytest tests/integration/test_auth_integration.py::TestSecurityFeatures -v $EXTRA_ARGS
        ;;

    edge-cases)
        print_header "Running Edge Case Tests (7 tests)"
        python -m pytest tests/integration/test_auth_integration.py::TestEdgeCases -v $EXTRA_ARGS
        ;;

    performance)
        print_header "Running Performance Tests (2 tests)"
        python -m pytest tests/integration/test_auth_integration.py::TestPerformance -v $EXTRA_ARGS
        ;;

    integration)
        print_header "Running Integration Scenario Tests (3 tests)"
        python -m pytest tests/integration/test_auth_integration.py::TestIntegrationScenarios -v $EXTRA_ARGS
        ;;

    coverage)
        print_header "Running All Tests with Coverage Report"
        python -m pytest tests/integration/test_auth_integration.py \
            --cov=app/api/auth \
            --cov=app/core/security \
            --cov=app/api/deps \
            --cov=app/services/redis_service \
            --cov-report=html \
            --cov-report=term-missing \
            -v $EXTRA_ARGS
        print_success "Coverage report generated at: htmlcov/index.html"
        ;;

    fast)
        print_header "Running All Tests (Fast Mode - No Coverage)"
        python -m pytest tests/integration/test_auth_integration.py -v --no-cov $EXTRA_ARGS
        ;;

    verbose)
        print_header "Running All Tests (Verbose Output)"
        python -m pytest tests/integration/test_auth_integration.py -vv -s $EXTRA_ARGS
        ;;

    debug)
        print_header "Running All Tests (Debug Mode)"
        python -m pytest tests/integration/test_auth_integration.py -vv -s -l $EXTRA_ARGS
        ;;

    collect)
        print_header "Collecting All Tests"
        python -m pytest tests/integration/test_auth_integration.py --collect-only -q
        ;;

    count)
        print_header "Counting Tests"
        TEST_COUNT=$(python -m pytest tests/integration/test_auth_integration.py --collect-only -q | grep "test_" | wc -l)
        print_success "Total authentication tests: $TEST_COUNT"
        echo ""
        echo "Breakdown:"
        echo "  - Registration:      9 tests"
        echo "  - Login:             6 tests"
        echo "  - Token Management:  7 tests"
        echo "  - Protected Endpoints: 6 tests"
        echo "  - Password Reset:    7 tests"
        echo "  - Security Features: 9 tests"
        echo "  - Edge Cases:        7 tests"
        echo "  - Performance:       2 tests"
        echo "  - Integration:       3 tests"
        echo "  ────────────────────────────"
        echo "  Total:              56 tests"
        ;;

    help|--help|-h)
        show_usage
        ;;

    *)
        print_error "Unknown command: $COMMAND"
        echo ""
        show_usage
        exit 1
        ;;
esac

# Exit with pytest's exit code
exit $?
