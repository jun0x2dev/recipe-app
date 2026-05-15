import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '../src/features/auth/AuthContext';
import { useAppTheme } from '../src/theme/useAppTheme';

/**
 * - Expo Router의 최상위 레이아웃이다.
 * - 앱 전역 Stack 화면과 공통 헤더 스타일을 설정한다.
 * - 라이트/다크 테마에 맞춰 StatusBar와 헤더 색상을 동기화한다.
 */
export default function RootLayout() {
  const theme = useAppTheme();

  return (
    <AuthProvider>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { color: theme.text, fontSize: 17, fontWeight: '700' },
        }}
      >
        <Stack.Screen name="index" options={{ title: '내 레시피' }} />
        <Stack.Screen name="login" options={{ title: '로그인' }} />
        <Stack.Screen name="recipes/[id]" options={{ title: '레시피 상세' }} />
        <Stack.Screen
          name="recipes/new"
          options={{ presentation: 'modal', title: '레시피 작성' }}
        />
      </Stack>
    </AuthProvider>
  );
}
