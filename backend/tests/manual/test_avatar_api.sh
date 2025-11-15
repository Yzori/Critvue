#!/bin/bash
# Avatar Persistence Debug Script
# Tests authentication and profile endpoints

BASE_URL="http://localhost:8000/api/v1"
COOKIE_FILE="/tmp/critvue_cookies.txt"

echo "================================================================================"
echo "AVATAR PERSISTENCE DEBUG TEST"
echo "================================================================================"
echo ""

# Clean up old cookie file
rm -f "$COOKIE_FILE"

# Step 1: Login
echo "1. LOGIN TEST"
echo "--------------------------------------------------------------------------------"
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_FILE" -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "arend@gmail.com", "password": "Test123!"}')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_CODE/d')

echo "Status Code: $HTTP_CODE"
echo ""
echo "Login Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

# Extract avatar_url from login response
LOGIN_AVATAR=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('avatar_url', 'NOT_PRESENT'))" 2>/dev/null)
echo ""
echo "avatar_url in login response: $LOGIN_AVATAR"

echo ""
echo ""

# Step 2: Test /auth/me
echo "2. GET /auth/me TEST"
echo "--------------------------------------------------------------------------------"
AUTH_ME_RESPONSE=$(curl -s -b "$COOKIE_FILE" -w "\nHTTP_CODE:%{http_code}" \
  -X GET "$BASE_URL/auth/me")

HTTP_CODE=$(echo "$AUTH_ME_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$AUTH_ME_RESPONSE" | sed '/HTTP_CODE/d')

echo "Status Code: $HTTP_CODE"
echo ""
echo "/auth/me Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

# Extract avatar_url from /auth/me response
AUTH_ME_AVATAR=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('avatar_url', 'NOT_PRESENT'))" 2>/dev/null)
echo ""
echo "avatar_url in /auth/me: $AUTH_ME_AVATAR"

echo ""
echo ""

# Step 3: Test /profile/me
echo "3. GET /profile/me TEST"
echo "--------------------------------------------------------------------------------"
PROFILE_ME_RESPONSE=$(curl -s -b "$COOKIE_FILE" -w "\nHTTP_CODE:%{http_code}" \
  -X GET "$BASE_URL/profile/me")

HTTP_CODE=$(echo "$PROFILE_ME_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$PROFILE_ME_RESPONSE" | sed '/HTTP_CODE/d')

echo "Status Code: $HTTP_CODE"
echo ""
echo "/profile/me Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

# Extract avatar_url from /profile/me response
PROFILE_ME_AVATAR=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('avatar_url', 'NOT_PRESENT'))" 2>/dev/null)
echo ""
echo "avatar_url in /profile/me: $PROFILE_ME_AVATAR"

echo ""
echo ""

# Step 4: Comparison
echo "4. COMPARISON ANALYSIS"
echo "--------------------------------------------------------------------------------"
echo "Login Response avatar_url:      $LOGIN_AVATAR"
echo "  /auth/me Response avatar_url:    $AUTH_ME_AVATAR"
echo "/profile/me Response avatar_url: $PROFILE_ME_AVATAR"

echo ""
echo "================================================================================"
echo "DIAGNOSIS"
echo "================================================================================"

if [ "$LOGIN_AVATAR" = "$AUTH_ME_AVATAR" ] && [ "$AUTH_ME_AVATAR" = "$PROFILE_ME_AVATAR" ]; then
    if [ "$PROFILE_ME_AVATAR" != "NOT_PRESENT" ] && [ "$PROFILE_ME_AVATAR" != "null" ] && [ -n "$PROFILE_ME_AVATAR" ]; then
        echo "✅ All endpoints return the same avatar_url"
        echo "   Avatar URL: $PROFILE_ME_AVATAR"
    else
        echo "❌ All endpoints return NULL/missing avatar_url"
        echo "   Issue: Database doesn't have avatar_url saved OR field not in response"
    fi
else
    echo "⚠️  MISMATCH DETECTED!"
    if [ "$LOGIN_AVATAR" != "$AUTH_ME_AVATAR" ]; then
        echo "   - Login vs /auth/me differ"
    fi
    if [ "$AUTH_ME_AVATAR" != "$PROFILE_ME_AVATAR" ]; then
        echo "   - /auth/me vs /profile/me differ"
    fi
fi

echo ""
echo "================================================================================"
echo "COOKIES SAVED TO: $COOKIE_FILE"
echo "================================================================================"
cat "$COOKIE_FILE"

echo ""
echo ""
echo "================================================================================"
echo "NEXT STEPS"
echo "================================================================================"
echo "1. Check database with:"
echo "   SELECT id, email, avatar_url FROM users WHERE email = 'arend@gmail.com';"
echo ""
echo "2. Check User model definition"
echo "3. Check UserResponse schema definition"
echo "4. Check ProfileResponse schema definition"
echo ""
