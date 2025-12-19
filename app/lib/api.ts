/**
 * Laravel Sanctum API 호출 유틸리티
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://admin-yaver.test';

/**
 * CSRF 쿠키를 가져오는 함수 (Sanctum SPA 인증에 필요)
 */
export async function getCsrfCookie(): Promise<void> {
  try {
    await fetch(`${API_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });
  } catch (error) {
    console.error('CSRF 쿠키 가져오기 실패:', error);
    throw new Error('CSRF 쿠키를 가져올 수 없습니다.');
  }
}

/**
 * 로그인 API 호출
 */
export async function login(email: string, password: string): Promise<{ user: any }> {
  // 먼저 CSRF 쿠키 가져오기
  await getCsrfCookie();

  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '로그인에 실패했습니다.' }));
    throw new Error(error.message || '로그인에 실패했습니다.');
  }

  return await response.json();
}

/**
 * 현재 인증된 사용자 정보 가져오기
 */
export async function getAuthenticatedUser(): Promise<any> {
  const response = await fetch(`${API_URL}/api/user`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null; // 인증되지 않음
    }
    throw new Error('사용자 정보를 가져올 수 없습니다.');
  }

  return await response.json();
}

/**
 * 로그아웃 API 호출
 */
export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('로그아웃에 실패했습니다.');
  }
}
