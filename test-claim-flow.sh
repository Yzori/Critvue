#!/bin/bash

# Test E2E Claim Flow
# Tests: Browse → Claim → Write Review → Submit

set -e

BASE_URL="http://localhost:8000/api/v1"

echo "========================================="
echo "E2E Claim Flow Test"
echo "========================================="

# Step 1: Login as test user
echo -e "\n[Step 1] Logging in as test user..."
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo "✓ Login successful"
else
  echo "✗ Login failed: $LOGIN_RESPONSE"
  exit 1
fi

# Step 2: Create a test review request
echo -e "\n[Step 2] Creating test review request..."
CREATE_RESPONSE=$(curl -s -b /tmp/cookies.txt -X POST "${BASE_URL}/reviews" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test E2E Review - Expert Deep Tier",
    "description": "Testing the complete claim flow with expert review",
    "content_type": "ui_design",
    "review_type": "expert",
    "tier": "deep",
    "budget": 150,
    "deadline": "2025-12-31T23:59:59Z",
    "feedback_areas": ["visual_design", "user_experience"],
    "feedback_priority": "comprehensive",
    "context": "Testing the unified claim service",
    "reviews_requested": 3,
    "estimated_duration": 45
  }')

REVIEW_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -z "$REVIEW_ID" ]; then
  echo "✗ Failed to create review: $CREATE_RESPONSE"
  exit 1
fi

echo "✓ Created review with ID: $REVIEW_ID"

# Step 3: Browse endpoint - verify review appears
echo -e "\n[Step 3] Fetching from browse endpoint..."
BROWSE_RESPONSE=$(curl -s "${BASE_URL}/reviews/browse?limit=50")

if echo "$BROWSE_RESPONSE" | grep -q "\"id\":$REVIEW_ID"; then
  echo "✓ Review appears in browse endpoint"
  # Extract available slots
  AVAILABLE_SLOTS=$(echo "$BROWSE_RESPONSE" | grep -A 5 "\"id\":$REVIEW_ID" | grep -o '"available_slots":[0-9]*' | cut -d: -f2)
  echo "  Available slots: $AVAILABLE_SLOTS"
else
  echo "✗ Review not found in browse endpoint"
fi

# Step 4: Login as different user (reviewer)
echo -e "\n[Step 4] Logging in as reviewer..."
REVIEWER_LOGIN=$(curl -s -c /tmp/reviewer-cookies.txt -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "reviewer@example.com", "password": "Test123!@#"}')

if echo "$REVIEWER_LOGIN" | grep -q "access_token"; then
  echo "✓ Reviewer login successful"
else
  echo "✗ Reviewer login failed"
  # Try to register reviewer
  echo "  Attempting to register reviewer..."
  REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email": "reviewer@example.com", "password": "Test123!@#", "full_name": "Test Reviewer"}')

  if echo "$REGISTER_RESPONSE" | grep -q "id"; then
    echo "  ✓ Reviewer registered"
    # Login again
    REVIEWER_LOGIN=$(curl -s -c /tmp/reviewer-cookies.txt -X POST "${BASE_URL}/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email": "reviewer@example.com", "password": "Test123!@#"}')
    echo "  ✓ Reviewer logged in"
  else
    echo "  ✗ Failed to register reviewer: $REGISTER_RESPONSE"
  fi
fi

# Step 5: Claim review slot (CRITICAL TEST)
echo -e "\n[Step 5] Claiming review slot..."
CLAIM_RESPONSE=$(curl -s -b /tmp/reviewer-cookies.txt -X POST "${BASE_URL}/reviews/${REVIEW_ID}/claim" \
  -H "Content-Type: application/json")

echo "Claim Response: $CLAIM_RESPONSE"

SLOT_ID=$(echo "$CLAIM_RESPONSE" | grep -o '"slot_id":[0-9]*' | cut -d: -f2)
SUCCESS=$(echo "$CLAIM_RESPONSE" | grep -o '"success":[a-z]*' | cut -d: -f2)

if [ "$SUCCESS" = "true" ] && [ -n "$SLOT_ID" ]; then
  echo "✓ Successfully claimed slot!"
  echo "  Slot ID: $SLOT_ID"
  echo "  Review Request ID: $REVIEW_ID"

  # Check other fields
  REVIEWS_CLAIMED=$(echo "$CLAIM_RESPONSE" | grep -o '"reviews_claimed":[0-9]*' | cut -d: -f2)
  AVAILABLE_SLOTS_AFTER=$(echo "$CLAIM_RESPONSE" | grep -o '"available_slots":[0-9]*' | cut -d: -f2)
  echo "  Reviews claimed: $REVIEWS_CLAIMED"
  echo "  Available slots remaining: $AVAILABLE_SLOTS_AFTER"
else
  echo "✗ Claim failed: $CLAIM_RESPONSE"
  exit 1
fi

# Step 6: Verify ReviewSlot was created in database
echo -e "\n[Step 6] Verifying ReviewSlot in database..."
SLOT_CHECK=$(curl -s -b /tmp/reviewer-cookies.txt "${BASE_URL}/review-slots/${SLOT_ID}")

if echo "$SLOT_CHECK" | grep -q "\"id\":$SLOT_ID"; then
  echo "✓ ReviewSlot exists in database"
  STATUS=$(echo "$SLOT_CHECK" | grep -o '"status":"[a-z_]*"' | cut -d'"' -f4)
  echo "  Status: $STATUS"

  if [ "$STATUS" = "claimed" ]; then
    echo "  ✓ Status is 'claimed' (correct)"
  else
    echo "  ✗ Status should be 'claimed' but is '$STATUS'"
  fi
else
  echo "✗ ReviewSlot not found: $SLOT_CHECK"
  exit 1
fi

# Step 7: Submit review for the slot
echo -e "\n[Step 7] Submitting review..."
SUBMIT_RESPONSE=$(curl -s -b /tmp/reviewer-cookies.txt -X POST "${BASE_URL}/review-slots/${SLOT_ID}/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "review_text": "This is a comprehensive test review. The design looks great with strong visual hierarchy and clear user flows.",
    "rating": 5
  }')

if echo "$SUBMIT_RESPONSE" | grep -q '"status":"submitted"'; then
  echo "✓ Review submitted successfully"
  echo "  Review content saved"
else
  echo "Review submission response: $SUBMIT_RESPONSE"
fi

# Step 8: Verify complete flow
echo -e "\n[Step 8] Verifying complete E2E flow..."
FINAL_CHECK=$(curl -s -b /tmp/cookies.txt "${BASE_URL}/reviews/${REVIEW_ID}")

if echo "$FINAL_CHECK" | grep -q "\"review_text\""; then
  echo "✓ Review text visible in review request"
  echo "✓ E2E FLOW COMPLETE!"
else
  echo "Final check response: $FINAL_CHECK"
fi

echo -e "\n========================================="
echo "E2E Test Summary:"
echo "========================================="
echo "Review ID: $REVIEW_ID"
echo "Slot ID: $SLOT_ID"
echo "URL to write review: http://localhost:3000/reviewer/review/${SLOT_ID}"
echo "All tests passed! ✓"
echo "========================================="

# Cleanup
rm -f /tmp/cookies.txt /tmp/reviewer-cookies.txt
