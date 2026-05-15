import { SettingsScreen } from '../../src/features/settings/screens/SettingsScreen';

/**
 * - 설정 탭 라우트다.
 * - 계정, 화면 모드, 앱 정보를 설정 화면에 위임한다.
 * - 하단 탭의 세 번째 주요 진입점이다.
 */
export default function SettingsRoute() {
  return <SettingsScreen />;
}
