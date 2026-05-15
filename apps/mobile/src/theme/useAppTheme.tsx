import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

/**
 * - 사용자가 선택할 수 있는 화면 모드 값이다.
 * - system은 기기 설정을 따르고 light/dark는 앱 내부에서 강제 적용한다.
 * - 추후 SecureStore 또는 AsyncStorage에 저장해 앱 재실행 후에도 유지한다.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * - 앱 전역에서 사용하는 테마 토큰 타입이다.
 * - 토스 느낌의 절제된 UI를 위해 기본 색상군을 중립색 중심으로 유지한다.
 * - 상태 색상은 오류와 경고처럼 의미가 필요한 곳에만 사용한다.
 */
export type AppTheme = {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  success: string;
  warning: string;
  danger: string;
  input: string;
};

/**
 * - 화면 모드 Context에서 제공하는 값이다.
 * - preference는 사용자가 고른 설정값이고 theme는 실제 적용된 색상 토큰이다.
 * - resolvedMode는 system 설정을 반영한 최종 라이트/다크 모드다.
 */
type ThemeContextValue = {
  preference: ThemePreference;
  resolvedMode: 'light' | 'dark';
  theme: AppTheme;
  setPreference: (preference: ThemePreference) => void;
};

/**
 * - 라이트 모드 색상 토큰이다.
 * - 토스식 흰 배경과 쿨그레이 표면을 기준으로 화면을 구성한다.
 * - primary는 토스 계열 파란색으로 두되 사용 빈도는 주요 액션으로 제한한다.
 */
const lightTheme: AppTheme = {
  mode: 'light',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F8FA',
  border: '#E5E8EB',
  text: '#191F28',
  textMuted: '#8B95A1',
  primary: '#3182F6',
  primaryText: '#FFFFFF',
  success: '#00A661',
  warning: '#F59F00',
  danger: '#F04452',
  input: '#F7F8FA',
};

/**
 * - 다크 모드 색상 토큰이다.
 * - 완전한 검정에 가까운 배경과 살짝 밝은 표면으로 계층을 만든다.
 * - 어두운 회색을 많이 겹치지 않고 텍스트 대비를 높여 답답함을 줄인다.
 */
const darkTheme: AppTheme = {
  mode: 'dark',
  background: '#0B0D12',
  surface: '#11141B',
  surfaceMuted: '#191D26',
  border: '#252A35',
  text: '#F7F8FA',
  textMuted: '#8B95A1',
  primary: '#4593FC',
  primaryText: '#FFFFFF',
  success: '#2AC769',
  warning: '#FFB020',
  danger: '#FF5C6C',
  input: '#191D26',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * - 앱 전체의 화면 모드와 테마 토큰을 제공한다.
 * - 기본값은 system이라 사용자의 기기 설정을 따른다.
 * - 설정 화면에서 preference를 바꾸면 즉시 전체 앱에 반영된다.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  const resolvedMode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedMode,
      theme,
      setPreference,
    }),
    [preference, resolvedMode, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * - 현재 적용 중인 앱 테마를 반환한다.
 * - 화면과 컴포넌트는 직접 색상값보다 이 hook의 토큰을 우선 사용한다.
 * - ThemeProvider 밖에서 호출되면 구조 오류를 빠르게 드러낸다.
 */
export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme은 ThemeProvider 내부에서만 사용할 수 있습니다.');
  }

  return context.theme;
}

/**
 * - 설정 화면에서 화면 모드 선택 상태를 읽고 변경하는 hook이다.
 * - 라이트/다크/시스템 설정 UI는 이 hook으로 전역 테마를 갱신한다.
 * - 저장소 연동은 추후 이 hook 내부나 Provider 초기화 단계에서 처리한다.
 */
export function useThemePreference() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemePreference는 ThemeProvider 내부에서만 사용할 수 있습니다.');
  }

  return context;
}
