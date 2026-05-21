import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { AuthState, LoginProvider, TokenResponse } from './types/auth';

/**
 * - 마지막 로그인 제공자를 영속 저장하는 키다.
 * - 로그아웃 후에도 로그인 화면에서 "최근 로그인 방법"을 표시하기 위해 사용한다.
 */
const LAST_PROVIDER_KEY = 'lastLoginProvider';

/**
 * - 앱 전체에서 인증 상태를 공유하기 위한 Context 값이다.
 * - MVP에서는 토큰을 메모리에만 보관한다.
 * - 추후 expo-secure-store 도입 시 이 계층에서 영속 저장을 담당한다.
 */
type AuthContextValue = AuthState & {
  userId: string | null;
  email: string | null;
  lastLoginProvider: LoginProvider | null;
  signIn: (tokenResponse: TokenResponse, provider: LoginProvider) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * - JWT payload에서 userId claim을 추출한다.
 * - base64url 디코딩으로 외부 라이브러리 없이 처리한다.
 */
function extractUserIdFromToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(decoded);
    return claims.userId != null ? String(claims.userId) : null;
  } catch {
    return null;
  }
}

/**
 * - JWT subject에서 이메일을 추출한다.
 * - 백엔드에서 subject를 email 또는 userId 문자열로 설정한다.
 * - @가 포함되어 있으면 이메일로 판단한다.
 */
function extractEmailFromToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(decoded);
    const subject = claims.sub as string | undefined;
    return subject && subject.includes('@') ? subject : null;
  } catch {
    return null;
  }
}

/**
 * - 인증 상태 Provider다.
 * - 로그인 성공 시 백엔드에서 받은 토큰 쌍과 로그인 방법을 저장한다.
 * - 로그아웃은 우선 클라이언트 상태만 비우고 서버 logout API는 다음 단계에서 연결한다.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null);
  const [loginProvider, setLoginProvider] = useState<LoginProvider | null>(null);
  const [lastLoginProvider, setLastLoginProvider] = useState<LoginProvider | null>(null);

  /**
   * - 앱 시작 시 SecureStore에서 마지막 로그인 제공자를 복원한다.
   * - 로그아웃 후에도 로그인 화면에서 "최근 로그인 방법"을 보여주기 위함이다.
   */
  useEffect(() => {
    SecureStore.getItemAsync(LAST_PROVIDER_KEY).then((stored) => {
      if (stored === 'naver' || stored === 'google' || stored === 'email') {
        setLastLoginProvider(stored);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      tokenResponse,
      loginProvider,
      lastLoginProvider,
      userId: tokenResponse ? extractUserIdFromToken(tokenResponse.accessToken) : null,
      email: tokenResponse ? extractEmailFromToken(tokenResponse.accessToken) : null,
      signIn: (tokens: TokenResponse, provider: LoginProvider) => {
        setTokenResponse(tokens);
        setLoginProvider(provider);
        setLastLoginProvider(provider);
        SecureStore.setItemAsync(LAST_PROVIDER_KEY, provider);
      },
      signOut: () => {
        setTokenResponse(null);
        setLoginProvider(null);
      },
    }),
    [tokenResponse, loginProvider, lastLoginProvider],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * - 인증 상태를 읽는 공통 hook이다.
 * - Provider 밖에서 호출되면 구조 오류를 빠르게 드러낸다.
 * - 화면은 이 hook으로 로그인 여부와 토큰을 확인한다.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }

  return context;
}
