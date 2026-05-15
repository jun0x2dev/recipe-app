import { Platform } from 'react-native';

import { authConfig } from './authConfig';

/**
 * - Google 로그인 실패를 화면에서 표시하기 위한 도메인 오류다.
 * - 브라우저 OAuth 설정 누락과 사용 불가 플랫폼을 명확히 구분한다.
 * - 네이티브 iOS 흐름은 추후 iOS Client ID 추가 후 별도 확장한다.
 */
export class GoogleLoginError extends Error {}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

/**
 * - 브라우저에서 Google OAuth 로그인 화면으로 이동한다.
 * - response_type에 id_token을 요청해 백엔드 검증용 OpenID Connect token을 받는다.
 * - redirect URI는 현재 로그인 화면 URL이므로 Google Console에 등록되어 있어야 한다.
 */
export function redirectToGoogleLogin() {
  if (Platform.OS !== 'web') {
    throw new GoogleLoginError('Google 웹 로그인은 브라우저 확인용입니다.');
  }

  if (!authConfig.googleWebClientId) {
    throw new GoogleLoginError('Google Web Client ID 설정이 없습니다.');
  }

  const redirectUri = window.location.origin + window.location.pathname;
  const nonce = crypto.randomUUID();
  sessionStorage.setItem('google_oauth_nonce', nonce);

  const params = new URLSearchParams({
    client_id: authConfig.googleWebClientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    prompt: 'select_account',
  });

  window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * - Google OAuth redirect 후 URL hash에서 id_token을 추출한다.
 * - id_token을 읽은 뒤 hash를 제거해 새로고침 중복 처리를 막는다.
 * - Google이 error를 반환한 경우 사용자에게 표시할 오류로 변환한다.
 */
export function consumeGoogleRedirectIdToken(): string | null {
  if (Platform.OS !== 'web' || !window.location.hash) {
    return null;
  }

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const error = params.get('error');

  window.history.replaceState(null, document.title, window.location.pathname);

  if (error) {
    throw new GoogleLoginError(`Google 로그인 오류: ${error}`);
  }

  return params.get('id_token');
}
