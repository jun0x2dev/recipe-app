import { LoginScreen } from '../src/features/auth/screens/LoginScreen';

/**
 * - 로그인 화면 라우트다.
 * - 실제 화면 구현은 auth feature의 LoginScreen에 위임한다.
 * - 인증 제공자가 늘어나도 라우트 파일은 얇게 유지한다.
 */
export default function LoginRoute() {
  return <LoginScreen />;
}
