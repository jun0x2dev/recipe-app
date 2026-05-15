import { authConfig } from './authConfig';
import { ApiResponse, TokenResponse } from '../types/auth';

/**
 * - 네이버 access token을 백엔드 인증 토큰으로 교환한다.
 * - 백엔드는 네이버 프로필을 검증한 뒤 앱 자체 JWT를 발급한다.
 * - 네이버 access token은 서버에 저장되지 않는다는 전제를 유지한다.
 */
export async function loginWithNaverAccessToken(accessToken: string): Promise<TokenResponse> {
  const response = await fetch(`${authConfig.apiBaseUrl}/api/v1/auth/oauth/naver`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken }),
  });

  const body = (await response.json()) as ApiResponse<TokenResponse>;

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? '네이버 로그인 처리 중 오류가 발생했습니다.');
  }

  return body.data;
}

/**
 * - Google id token을 백엔드 인증 토큰으로 교환한다.
 * - 백엔드는 Google token audience와 subject를 검증한 뒤 앱 자체 JWT를 발급한다.
 * - Google Client Secret은 모바일에서 사용하지 않는다.
 */
export async function loginWithGoogleIdToken(idToken: string): Promise<TokenResponse> {
  const response = await fetch(`${authConfig.apiBaseUrl}/api/v1/auth/oauth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  const body = (await response.json()) as ApiResponse<TokenResponse>;

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? 'Google 로그인 처리 중 오류가 발생했습니다.');
  }

  return body.data;
}
