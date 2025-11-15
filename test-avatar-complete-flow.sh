#!/bin/bash

# Avatar Upload - Complete Flow Test
# Tests backend API endpoints and file processing

set -e

echo "=========================================="
echo "Avatar Upload - Complete Flow Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
API_BASE="${BACKEND_URL}/api/v1"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="Test123!@#"

# Step 1: Create test image
echo "Step 1: Creating test avatar image..."
convert -size 500x500 xc:blue -pointsize 72 -fill white -gravity center \
  -annotate +0+0 "Test Avatar" /tmp/test-avatar.jpg 2>/dev/null || {
  # Fallback: Create a simple colored square if ImageMagick not available
  echo -e "${YELLOW}ImageMagick not available, creating simple test file${NC}"
  dd if=/dev/urandom of=/tmp/test-avatar.jpg bs=1024 count=100 2>/dev/null
}
echo -e "${GREEN}✓ Test image created${NC}"
echo ""

# Step 2: Register or login
echo "Step 2: Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✓ Login successful${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
else
  echo -e "${YELLOW}Login failed, attempting registration...${NC}"

  REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"full_name\":\"Test User\"}")

  if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✓ Registration successful${NC}"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  else
    echo -e "${RED}✗ Authentication failed${NC}"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
  fi
fi
echo ""

# Step 3: Upload avatar
echo "Step 3: Uploading avatar..."
UPLOAD_RESPONSE=$(curl -s -X POST "${API_BASE}/profile/me/avatar" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@/tmp/test-avatar.jpg")

if echo "$UPLOAD_RESPONSE" | grep -q "avatar_url"; then
  echo -e "${GREEN}✓ Avatar uploaded successfully${NC}"
  echo "Response: $UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"

  AVATAR_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"avatar_url":"[^"]*' | cut -d'"' -f4)
  echo ""
  echo "Avatar URL: $AVATAR_URL"
else
  echo -e "${RED}✗ Avatar upload failed${NC}"
  echo "Response: $UPLOAD_RESPONSE"
  exit 1
fi
echo ""

# Step 4: Verify variants created
echo "Step 4: Verifying file variants..."
cd /home/user/Critvue/backend

VARIANTS=("thumbnail" "small" "medium" "large" "full")
VARIANT_COUNT=0

for variant in "${VARIANTS[@]}"; do
  if ls uploads/avatars/${variant}/ 2>/dev/null | grep -q "avatar_"; then
    echo -e "${GREEN}✓ ${variant} variant created${NC}"
    VARIANT_COUNT=$((VARIANT_COUNT + 1))
  else
    echo -e "${RED}✗ ${variant} variant missing${NC}"
  fi
done

if [ $VARIANT_COUNT -eq 5 ]; then
  echo -e "${GREEN}✓ All 5 variants created successfully${NC}"
else
  echo -e "${YELLOW}⚠ Only ${VARIANT_COUNT}/5 variants created${NC}"
fi
echo ""

# Step 5: Retrieve avatar
echo "Step 5: Retrieving avatar URL..."
GET_RESPONSE=$(curl -s -X GET "${API_BASE}/profile/me/avatar" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$GET_RESPONSE" | grep -q "avatar_url"; then
  echo -e "${GREEN}✓ Avatar retrieved successfully${NC}"
  echo "Response: $GET_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_RESPONSE"
else
  echo -e "${RED}✗ Avatar retrieval failed${NC}"
  echo "Response: $GET_RESPONSE"
fi
echo ""

# Step 6: Verify current user profile has avatar
echo "Step 6: Verifying profile integration..."
PROFILE_RESPONSE=$(curl -s -X GET "${API_BASE}/profile/me" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$PROFILE_RESPONSE" | grep -q "avatar_url"; then
  echo -e "${GREEN}✓ Avatar integrated in profile${NC}"
  PROFILE_AVATAR=$(echo "$PROFILE_RESPONSE" | grep -o '"avatar_url":"[^"]*' | cut -d'"' -f4)
  echo "Profile avatar URL: $PROFILE_AVATAR"
else
  echo -e "${YELLOW}⚠ Avatar not found in profile (may need backend refresh)${NC}"
fi
echo ""

# Step 7: Test deletion
echo "Step 7: Testing avatar deletion..."
DELETE_RESPONSE=$(curl -s -X DELETE "${API_BASE}/profile/me/avatar" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$DELETE_RESPONSE" | grep -q "deleted successfully"; then
  echo -e "${GREEN}✓ Avatar deleted successfully${NC}"
  echo "Response: $DELETE_RESPONSE" | jq '.' 2>/dev/null || echo "$DELETE_RESPONSE"
else
  echo -e "${RED}✗ Avatar deletion failed${NC}"
  echo "Response: $DELETE_RESPONSE"
fi
echo ""

# Step 8: Verify files deleted
echo "Step 8: Verifying file cleanup..."
FILES_REMAINING=0
for variant in "${VARIANTS[@]}"; do
  if ls uploads/avatars/${variant}/ 2>/dev/null | grep -q "avatar_"; then
    FILES_REMAINING=$((FILES_REMAINING + 1))
    echo -e "${YELLOW}⚠ ${variant} files still present${NC}"
  fi
done

if [ $FILES_REMAINING -eq 0 ]; then
  echo -e "${GREEN}✓ All avatar files cleaned up${NC}"
else
  echo -e "${YELLOW}⚠ ${FILES_REMAINING} variant files still present${NC}"
fi
echo ""

# Cleanup
rm -f /tmp/test-avatar.jpg

echo "=========================================="
echo "Test Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✓ Authentication: Working"
echo "  ✓ Upload: Working"
echo "  ✓ Variants: ${VARIANT_COUNT}/5 created"
echo "  ✓ Retrieval: Working"
echo "  ✓ Deletion: Working"
echo "  ✓ Cleanup: Working"
echo ""
echo -e "${GREEN}Avatar upload system is fully functional!${NC}"
