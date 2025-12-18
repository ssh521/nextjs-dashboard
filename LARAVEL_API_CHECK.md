# Laravel API 확인 방법

## 1. 빠른 확인 (터미널)

```bash
# CSRF 쿠키 엔드포인트 확인
curl -k -I https://admin-yaver.test/sanctum/csrf-cookie

# 사용자 정보 엔드포인트 확인 (인증 필요)
curl -k https://admin-yaver.test/api/user

# 로그인 엔드포인트 확인
curl -k -X POST https://admin-yaver.test/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

## 2. 스크립트 사용

```bash
./check-laravel-api.sh
```

## 3. 브라우저에서 확인

1. **CSRF 쿠키 엔드포인트**: 
   - `https://admin-yaver.test/sanctum/csrf-cookie`
   - 응답: 204 No Content (정상)

2. **사용자 정보 엔드포인트**:
   - `https://admin-yaver.test/api/user`
   - 인증되지 않으면 로그인 페이지로 리다이렉트 (정상)

3. **로그인 엔드포인트**:
   - Laravel 프로젝트에서 `php artisan route:list | grep login` 실행하여 확인
   - 일반적으로 `/api/login` 또는 `/login`

## 4. Laravel 프로젝트에서 라우트 확인

Laravel 프로젝트 디렉토리에서:

```bash
# 모든 API 라우트 확인
php artisan route:list | grep api

# 로그인 관련 라우트만 확인
php artisan route:list | grep -i login

# Sanctum 관련 라우트 확인
php artisan route:list | grep sanctum
```

## 5. 현재 설정된 엔드포인트

현재 코드에서 사용 중인 엔드포인트:
- CSRF 쿠키: `/sanctum/csrf-cookie` ✅
- 로그인: `/api/users` (사용자가 변경함)
- 사용자 정보: `/api/user` ✅
- 로그아웃: `/api/logout` (확인 필요)

## 주의사항

⚠️ **HTTPS 리다이렉트**: Laravel API가 HTTP에서 HTTPS로 리다이렉트하고 있습니다.
- `.env` 파일의 `NEXT_PUBLIC_API_URL`을 `https://admin-yaver.test`로 변경하는 것을 권장합니다.
- 또는 Next.js에서 HTTPS를 허용하도록 설정해야 합니다.

## 문제 해결

### API가 응답하지 않는 경우:
1. Laravel 서버가 실행 중인지 확인: `php artisan serve` 또는 웹 서버 확인
2. `.env` 파일의 `APP_URL` 확인
3. 방화벽/포트 확인

### CORS 오류가 발생하는 경우:
1. Laravel의 `config/cors.php` 확인
2. `config/sanctum.php`의 `stateful` 도메인에 Next.js 도메인 추가
3. `.env`의 `SANCTUM_STATEFUL_DOMAINS` 확인
