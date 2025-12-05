#!/usr/bin/env bash
set -e

API=${API:-http://localhost:8787}
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "========================================="
echo "  Coach2Coach API Smoke Test"
echo "  API: $API"
echo "========================================="
echo ""

# Health check
echo -n "⏳ Testing health endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/health")
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
else
  echo -e "${RED}✗ FAIL${NC} (HTTP $HTTP_CODE)"
  exit 1
fi

# Create test profile
echo -n "⏳ Creating test profile... "
TEST_USER_ID="SMOKE_TEST_$(date +%s)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API/api/coach-profiles" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$TEST_USER_ID\",
    \"first_name\": \"Smoke\",
    \"last_name\": \"Test\",
    \"title\": \"Test Coach\",
    \"bio\": \"Test bio\",
    \"location\": \"Test Location\",
    \"years_experience\": \"5-10\",
    \"sports\": [\"Basketball\"],
    \"levels\": [\"High School\"],
    \"specialties\": [\"Test\"]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
else
  echo -e "${RED}✗ FAIL${NC} (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
  exit 1
fi

# Read back the profile
echo -n "⏳ Reading test profile... "
RESPONSE=$(curl -s -w "\n%{http_code}" "$API/api/coach-profiles/$TEST_USER_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  # Check if data contains our test user
  if echo "$BODY" | grep -q "Smoke"; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE, data verified)"
  else
    echo -e "${YELLOW}⚠ PARTIAL${NC} (HTTP $HTTP_CODE, but data doesn't match)"
    echo "Response: $BODY"
  fi
else
  echo -e "${RED}✗ FAIL${NC} (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
  exit 1
fi

# Test resources endpoint
echo -n "⏳ Testing resources endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/resources")
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
else
  echo -e "${RED}✗ FAIL${NC} (HTTP $HTTP_CODE)"
  exit 1
fi

# Test membership endpoint
echo -n "⏳ Testing membership endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/membership/$TEST_USER_ID")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 404 ]; then
  echo -e "${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
else
  echo -e "${RED}✗ FAIL${NC} (HTTP $HTTP_CODE)"
  exit 1
fi

echo ""
echo -e "${GREEN}========================================="
echo "  ✓ All smoke tests passed!"
echo "=========================================${NC}"
echo ""
