import { useColorScheme } from 'react-native';

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

export function useAppTheme() {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
