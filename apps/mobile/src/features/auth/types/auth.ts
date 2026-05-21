/**
 * - 백엔드 인증 API의 공통 응답 래퍼다.
 * - success가 false이면 error 메시지를 사용자에게 표시할 수 있다.
 * - data가 null인 성공 응답은 현재 인증 흐름에서는 사용하지 않는다.
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};

/**
 * - 백엔드 표준 에러 응답이다.
 * - code는 개발자 분기 처리에 쓰고 message는 화면 표시 후보로 사용한다.
 */
export type ApiError = {
  code: string;
  message: string;
};

/**
 * - 앱 자체 인증 토큰 응답이다.
 * - accessToken은 API 호출 인증에 사용한다.
 * - refreshToken은 추후 안전 저장소 도입 후 갱신 흐름에 연결한다.
 */
export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

/**
 * - 소셜 로그인 제공자 식별자다.
 * - 로그인 성공 시 함께 저장해 메뉴/로그인 화면에서 표시한다.
 */
export type LoginProvider = 'naver' | 'google' | 'email';

/**
 * - AuthContext가 보관하는 최소 인증 상태다.
 * - MVP 단계에서는 메모리에만 저장하고 앱 재시작 시 다시 로그인하도록 둔다.
 * - loginProvider는 어떤 소셜 계정으로 로그인했는지 기록한다.
 */
export type AuthState = {
  tokenResponse: TokenResponse | null;
  loginProvider: LoginProvider | null;
};
