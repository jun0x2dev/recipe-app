import { useColorScheme } from 'react-native';

/**
 * - 앱 전역에서 사용하는 테마 토큰 타입이다.
 * - 라이트/다크 모드의 배경, 텍스트, 상태 색상을 같은 키로 제공한다.
 * - 화면과 컴포넌트는 직접 색상값보다 이 토큰을 우선 사용한다.
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
 * - 라이트 모드 기본 색상 토큰이다.
 * - 밝은 배경에서 카드, 입력창, 주요 액션이 구분되도록 구성한다.
 * - 추후 디자인 시스템 확정 시 이 값을 기준으로 정리한다.
 */
const lightTheme: AppTheme = {
  mode: 'light',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F7',
  border: '#E2E8F0',
  text: '#111827',
  textMuted: '#64748B',
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  success: '#047857',
  warning: '#B45309',
  danger: '#DC2626',
  input: '#FFFFFF',
};

/**
 * - 다크 모드 기본 색상 토큰이다.
 * - 어두운 배경에서 텍스트 대비와 입력창 구분을 유지한다.
 * - 상태 색상은 라이트 모드보다 밝은 톤을 사용한다.
 */
const darkTheme: AppTheme = {
  mode: 'dark',
  background: '#111827',
  surface: '#1F2937',
  surfaceMuted: '#374151',
  border: '#374151',
  text: '#F9FAFB',
  textMuted: '#CBD5E1',
  primary: '#60A5FA',
  primaryText: '#0F172A',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  input: '#172033',
};

/**
 * - 시스템 컬러 스킴에 맞는 앱 테마를 반환한다.
 * - React Native의 useColorScheme 훅을 기준으로 라이트/다크 토큰을 선택한다.
 * - 모든 화면은 이 훅을 통해 현재 테마를 공유한다.
 */
export function useAppTheme() {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
