#!/bin/bash
# Profile & Portfolio API Test Commands
# Ready-to-use curl commands for testing all endpoints

BASE_URL="http://localhost:8000/api/v1"
COOKIE_FILE="test_cookies.txt"

echo "========================================"
echo "Profile & Portfolio API Test Commands"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test credentials
TEST_EMAIL="curl_tester@example.com"
TEST_PASSWORD="TestPassword123!"

echo -e "${BLUE}1. REGISTER USER${NC}"
echo "curl -X POST $BASE_URL/auth/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"email\": \"$TEST_EMAIL\","
echo "    \"password\": \"$TEST_PASSWORD\","
echo "    \"full_name\": \"Curl Tester\""
echo "  }'"
echo ""

echo -e "${BLUE}2. LOGIN (Save cookies)${NC}"
echo "curl -X POST $BASE_URL/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -c $COOKIE_FILE \\"
echo "  -d '{"
echo "    \"email\": \"$TEST_EMAIL\","
echo "    \"password\": \"$TEST_PASSWORD\""
echo "  }'"
echo ""

echo -e "${GREEN}=== PROFILE ENDPOINTS ===${NC}"
echo ""

echo -e "${BLUE}3. GET OWN PROFILE${NC}"
echo "curl -X GET $BASE_URL/profile/me \\"
echo "  -b $COOKIE_FILE"
echo ""

echo -e "${BLUE}4. UPDATE PROFILE${NC}"
echo "curl -X PUT $BASE_URL/profile/me \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -b $COOKIE_FILE \\"
echo "  -d '{"
echo "    \"title\": \"Full Stack Developer\","
echo "    \"bio\": \"Passionate about building great software.\","
echo "    \"specialty_tags\": [\"React\", \"Node.js\", \"Python\"]"
echo "  }'"
echo ""

echo -e "${BLUE}5. GET PUBLIC PROFILE (user_id=1)${NC}"
echo "curl -X GET $BASE_URL/profile/1"
echo ""

echo -e "${BLUE}6. GET PROFILE STATS${NC}"
echo "curl -X GET $BASE_URL/profile/1/stats"
echo ""

echo -e "${BLUE}7. REFRESH STATS${NC}"
echo "curl -X POST $BASE_URL/profile/me/stats/refresh \\"
echo "  -b $COOKIE_FILE"
echo ""

echo -e "${BLUE}8. GET BADGES${NC}"
echo "curl -X GET $BASE_URL/profile/1/badges"
echo ""

echo -e "${BLUE}9. UPLOAD AVATAR${NC}"
echo "curl -X POST $BASE_URL/profile/me/avatar \\"
echo "  -b $COOKIE_FILE \\"
echo "  -F 'file=@/path/to/avatar.jpg'"
echo ""

echo -e "${GREEN}=== PORTFOLIO ENDPOINTS ===${NC}"
echo ""

echo -e "${BLUE}10. CREATE PORTFOLIO ITEM${NC}"
echo "curl -X POST $BASE_URL/portfolio \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -b $COOKIE_FILE \\"
echo "  -d '{"
echo "    \"title\": \"My Awesome Project\","
echo "    \"description\": \"A comprehensive project showcasing my skills.\","
echo "    \"content_type\": \"code\","
echo "    \"project_url\": \"https://github.com/user/project\","
echo "    \"is_featured\": true"
echo "  }'"
echo ""

echo -e "${BLUE}11. GET PORTFOLIO ITEM (id=1)${NC}"
echo "curl -X GET $BASE_URL/portfolio/1"
echo ""

echo -e "${BLUE}12. GET USER PORTFOLIO${NC}"
echo "curl -X GET '$BASE_URL/portfolio/user/1'"
echo ""

echo -e "${BLUE}13. GET USER PORTFOLIO (filtered by content_type)${NC}"
echo "curl -X GET '$BASE_URL/portfolio/user/1?content_type=code'"
echo ""

echo -e "${BLUE}14. GET USER PORTFOLIO (paginated)${NC}"
echo "curl -X GET '$BASE_URL/portfolio/user/1?page=1&page_size=10'"
echo ""

echo -e "${BLUE}15. GET OWN PORTFOLIO ITEMS${NC}"
echo "curl -X GET $BASE_URL/portfolio/me/items \\"
echo "  -b $COOKIE_FILE"
echo ""

echo -e "${BLUE}16. UPDATE PORTFOLIO ITEM (id=1)${NC}"
echo "curl -X PUT $BASE_URL/portfolio/1 \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -b $COOKIE_FILE \\"
echo "  -d '{"
echo "    \"description\": \"Updated description with more details.\","
echo "    \"rating\": 4.5"
echo "  }'"
echo ""

echo -e "${BLUE}17. GET FEATURED PORTFOLIO ITEMS${NC}"
echo "curl -X GET $BASE_URL/portfolio/featured/all"
echo ""

echo -e "${BLUE}18. UPLOAD PORTFOLIO IMAGE (id=1)${NC}"
echo "curl -X POST $BASE_URL/portfolio/1/image \\"
echo "  -b $COOKIE_FILE \\"
echo "  -F 'file=@/path/to/project-image.jpg'"
echo ""

echo -e "${BLUE}19. DELETE PORTFOLIO ITEM (id=1)${NC}"
echo "curl -X DELETE $BASE_URL/portfolio/1 \\"
echo "  -b $COOKIE_FILE"
echo ""

echo "========================================"
echo "To use these commands:"
echo "1. Make sure the backend is running"
echo "2. Copy and paste the commands above"
echo "3. Cookies are saved to $COOKIE_FILE"
echo "========================================"
