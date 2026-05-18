import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { AuthState, TokenResponse } from './types/auth';

/**
 * - 앱 전체에서 인증 상태를 공유하기 위한 Context 값이다.
 * - MVP에서는 토큰을 메모리에만 보관한다.
 * - 추후 expo-secure-store 도입 시 이 계층에서 영속 저장을 담당한다.
 */
type AuthContextValue = AuthState & {
  userId: string | null;
  signIn: (tokenResponse: TokenResponse) => void;
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
 * - 인증 상태 Provider다.
 * - 로그인 성공 시 백엔드에서 받은 토큰 쌍을 저장한다.
 * - 로그아웃은 우선 클라이언트 상태만 비우고 서버 logout API는 다음 단계에서 연결한다.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      tokenResponse,
      userId: tokenResponse ? extractUserIdFromToken(tokenResponse.accessToken) : null,
      signIn: setTokenResponse,
      signOut: () => setTokenResponse(null),
    }),
    [tokenResponse],
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
