import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://admin-yaver.test';

/**
 * Laravel Sanctum 로그인을 위한 API Route
 * 클라이언트의 쿠키를 Laravel API로 전달
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 클라이언트의 쿠키 가져오기
    const cookieHeader = request.headers.get('cookie') || '';

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

    // 새로운 쿠키들을 업데이트
    for (const cookie of setCookieHeaders) {
      updatedCookieHeader += (updatedCookieHeader ? '; ' : '') + cookie.split(';')[0];
      const match = cookie.match(/XSRF-TOKEN=([^;]+)/);
      if (match) {
        xsrfToken = decodeURIComponent(match[1]);
      }
    }

    // 로그인 요청
    // Laravel AuthController의 login 메서드 사용 (/api/login)
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

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      return NextResponse.json(
        { message: loginData.message || '로그인에 실패했습니다.' },
        { status: loginResponse.status }
      );
    }

    // Laravel에서 받은 쿠키를 클라이언트로 전달
    const responseCookies = loginResponse.headers.getSetCookie();
    const response = NextResponse.json(loginData);

    // 쿠키 설정
    for (const cookie of responseCookies) {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      response.cookies.set(name.trim(), value.trim(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return response;
  } catch (error: any) {
    console.error('Laravel 로그인 오류:', error);
    return NextResponse.json(
      { message: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 현재 인증된 사용자 정보 가져오기
 */
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${API_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookieHeader,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ user: null }, { status: 401 });
      }
      return NextResponse.json(
        { message: '사용자 정보를 가져올 수 없습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('사용자 정보 가져오기 오류:', error);
    return NextResponse.json(
      { message: '사용자 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
