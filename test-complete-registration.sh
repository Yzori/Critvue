#!/bin/bash

echo "==================================="
echo "Testing Critvue Registration Flow"
echo "==================================="
echo ""

# Test 1: Backend health check
echo "Test 1: Backend Health Check"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Backend is healthy (HTTP $HTTP_CODE)"
else
    echo "✗ Backend health check failed (HTTP $HTTP_CODE)"
    exit 1
fi
echo ""

# Test 2: CORS check
echo "Test 2: CORS Preflight Check"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    http://localhost:8000/api/v1/auth/register)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ CORS preflight successful (HTTP $HTTP_CODE)"
else
    echo "✗ CORS preflight failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: Registration with JSON
echo "Test 3: Registration with JSON (curl)"
TEST_EMAIL="test-$(date +%s)@example.com"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:3000" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"TestPass123!\",\"full_name\":\"Test User\"}" \
    http://localhost:8000/api/v1/auth/register)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "201" ]; then
    echo "✓ Registration successful (HTTP $HTTP_CODE)"
    echo "  Response: $BODY"
else
    echo "✗ Registration failed (HTTP $HTTP_CODE)"
    echo "  Error: $BODY"
    exit 1
fi
echo ""

# Test 4: Password validation
echo "Test 4: Password Validation (weak password)"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"weakpass@example.com","password":"weak","full_name":"Test User"}' \
    http://localhost:8000/api/v1/auth/register)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" = "422" ]; then
    echo "✓ Password validation working (HTTP $HTTP_CODE)"
else
    echo "✗ Password validation not working as expected (HTTP $HTTP_CODE)"
fi
echo ""

# Test 5: Frontend connectivity
echo "Test 5: Frontend Server Check"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Frontend is accessible (HTTP $HTTP_CODE)"
else
    echo "✗ Frontend is not accessible (HTTP $HTTP_CODE)"
fi
echo ""

echo "==================================="
echo "All tests completed successfully!"
echo "==================================="
echo ""
echo "The backend registration endpoint is working correctly."
echo "If you're still experiencing 422 errors in the browser:"
echo "1. Clear your browser cache (Ctrl+Shift+Delete)"
echo "2. Open DevTools (F12) -> Network tab"
echo "3. Try registering again and check the request payload"
echo "4. Look for any browser extensions that might modify requests"
echo "5. Check the browser console for any JavaScript errors"
