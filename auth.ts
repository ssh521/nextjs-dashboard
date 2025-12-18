import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from './app/lib/definitions';
import { headers } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://admin-yaver.test';

/**
 * Laravel Sanctum API를 통한 로그인
 * Next.js API Route를 통해 쿠키 처리
 */
async function loginWithLaravel(email: string, password: string): Promise<User | null> {
  try {
    const headersList = await headers();
    const cookieHeader = headersList.get('cookie') || '';
    
    // CSRF 쿠키 요청
    const csrfResponse = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      },
    });

    // CSRF 쿠키에서 XSRF-TOKEN 추출
    const setCookieHeaders = csrfResponse.headers.getSetCookie();
    let xsrfToken = '';
    let updatedCookieHeader = cookieHeader;

    for (const cookie of setCookieHeaders) {
      updatedCookieHeader += (updatedCookieHeader ? '; ' : '') + cookie.split(';')[0];
      const match = cookie.match(/XSRF-TOKEN=([^;]+)/);
      if (match) {
        xsrfToken = decodeURIComponent(match[1]);
      }
    }

    // Laravel API에 직접 로그인 요청
    const loginResponse = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
        'Cookie': updatedCookieHeader,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}));
      console.error('Laravel 로그인 실패:', {
        status: loginResponse.status,
        statusText: loginResponse.statusText,
        error: errorData,
      });
      return null;
    }

    const data = await loginResponse.json();
    console.log('Laravel 로그인 응답:', JSON.stringify(data, null, 2));
    
    // Laravel API 응답에서 사용자 정보 추출
    // 응답 형식: { "data": { "user": {...}, "token": "..." } }
    const userData = data.data?.user || data.user || data;
    
    if (!userData || !userData.id) {
      console.error('사용자 정보를 찾을 수 없습니다:', data);
      return null;
    }

    return {
      id: String(userData.id || ''),
      name: userData.name || '',
      email: userData.email || email,
      password: '', // 비밀번호는 저장하지 않음
    } as User;
  } catch (error) {
    console.error('Laravel 로그인 실패:', error);
    return null;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({
    async authorize(credentials) {
      const parseCredentials = z
        .object({ email: z.string().email(), password: z.string().min(6) })
        .safeParse(credentials);
      
      if (parseCredentials.success) {
        const { email, password } = parseCredentials.data;
        // Laravel Sanctum API를 통한 로그인
        const user = await loginWithLaravel(email, password);
        return user;
      }
      return null;
    },
  })],
});