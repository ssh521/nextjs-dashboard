#!/bin/bash

# Laravel API 연결 확인 스크립트

API_URL="${NEXT_PUBLIC_API_URL:-http://admin-yaver.test}"

echo "🔍 Laravel API 연결 확인 중..."
echo "API URL: $API_URL"
echo ""

# 1. CSRF 쿠키 엔드포인트 확인
echo "1️⃣ CSRF 쿠키 엔드포인트 확인:"
CSRF_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -c /tmp/cookies.txt "$API_URL/sanctum/csrf-cookie")
if [ "$CSRF_RESPONSE" = "200" ] || [ "$CSRF_RESPONSE" = "204" ]; then
  echo "✅ CSRF 쿠키 엔드포인트 정상 ($CSRF_RESPONSE)"
else
  echo "❌ CSRF 쿠키 엔드포인트 오류 (HTTP $CSRF_RESPONSE)"
fi
echo ""

# 2. 사용자 정보 엔드포인트 확인 (인증 필요)
echo "2️⃣ 사용자 정보 엔드포인트 확인:"
USER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/cookies.txt "$API_URL/api/user")
if [ "$USER_RESPONSE" = "200" ]; then
  echo "✅ 사용자 정보 엔드포인트 정상 (인증됨)"
elif [ "$USER_RESPONSE" = "401" ]; then
  echo "⚠️  사용자 정보 엔드포인트 정상 (인증 필요 - 예상된 동작)"
else
  echo "❌ 사용자 정보 엔드포인트 오류 (HTTP $USER_RESPONSE)"
fi
echo ""

# 3. 로그인 엔드포인트 확인 (여러 가능성 시도)
echo "3️⃣ 로그인 엔드포인트 확인:"
for endpoint in "/api/login" "/login" "/api/auth/login"; do
  LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL$endpoint" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '{"email":"test@test.com","password":"test"}')
  if [ "$LOGIN_RESPONSE" = "200" ] || [ "$LOGIN_RESPONSE" = "422" ] || [ "$LOGIN_RESPONSE" = "401" ]; then
    echo "✅ $endpoint 엔드포인트 존재 (HTTP $LOGIN_RESPONSE)"
  else
    echo "❌ $endpoint 엔드포인트 없음 또는 오류 (HTTP $LOGIN_RESPONSE)"
  fi
done
echo ""

# 4. API 라우트 목록 확인 (Laravel의 route:list가 있다면)
echo "4️⃣ Laravel 라우트 확인:"
echo "   (Laravel 프로젝트에서 'php artisan route:list | grep api' 실행 권장)"
echo ""

# 정리
rm -f /tmp/cookies.txt

echo "✅ 확인 완료!"
