#!/bin/bash

BASE_URL="http://localhost:3000/api"
EMAIL="testuser_$(date +%s)@example.com"
PASSWORD="password123"
DATE="2025-12-01"

echo "1. Registering User..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test User\", \"username\": \"testuser_$(date +%s)\", \"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
echo "Response: $REGISTER_RESPONSE"

echo -e "\n2. Logging In..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
echo "Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed, cannot proceed with authenticated requests."
  exit 1
fi
echo "Got Token: $TOKEN"

echo -e "\n3. Fetching Lunch (No Token)..."
curl -s "$BASE_URL/lunch?date=$DATE" | head -c 200
echo "..."

echo -e "\n4. Fetching Lunch (With Token)..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/lunch?date=$DATE" | head -c 200
echo "..."

echo -e "\n5. Fetching Dinner (With Token)..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dinner?date=$DATE" | head -c 200
echo "..."

echo -e "\n6. Fetching Monthly Lunch (With Token)..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/lunch/month?year=2025&month=12" | head -c 200
echo "..."

echo -e "\n7. Fetching Monthly Dinner (With Token)..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dinner/month?year=2025&month=12" | head -c 200
echo "..."

echo -e "\n8. Adding Favorite (Dish ID: 1)..."
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"dish_id": 1}' "$BASE_URL/favorites"
echo "..."

echo -e "\n9. Getting Favorites..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/favorites"
echo "..."

echo -e "\n10. Fetching Menu to check is_favorite=true..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/lunch?date=$DATE" | grep '"is_favorite":true'
echo "..."

echo -e "\n11. Deleting Favorite (Dish ID: 1)..."
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$BASE_URL/favorites/1"
echo "..."

echo -e "\n13. Posting Comment (Meal ID: 1)..."
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"meal_id": 1, "comment_text": "Harika yemek!"}' "$BASE_URL/comments"
echo "..."

echo -e "\n14. Getting Comments (Meal ID: 1)..."
curl -s "$BASE_URL/comments/1"
echo "..."

echo -e "\n15. Rating Meal (Meal ID: 1, Score: 5)..."
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"meal_id": 1, "score": 5}' "$BASE_URL/rate"
echo "..."

echo -e "\n15a. Getting Comments AGAIN (Should include user_rating now)..."
curl -s "$BASE_URL/comments/1"
echo "..."

echo -e "\n16. Checking Menu for Updated Rating (Meal ID: 1)..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/lunch?date=$DATE" | grep '"avg_rating"'
echo "..."

echo -e "\n17. Posting Complaint..."
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title": "Yemek Soğuktu", "description": "Bugünkü yemek maalesef soğuk geldi.", "meal_id": 1}' "$BASE_URL/complaints"
echo "..."

echo -e "\n18. Getting User Complaints..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/complaints"
echo "..."

echo -e "\n19. Changing Password..."
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"currentPassword\": \"$PASSWORD\", \"newPassword\": \"newpassword123\"}" "$BASE_URL/change-password"
echo "..."

echo -e "\n20. Logging in with NEW Password..."
curl -s -X POST "$BASE_URL/login" -H "Content-Type: application/json" -d "{\"email\": \"$EMAIL\", \"password\": \"newpassword123\"}"
echo "..."
