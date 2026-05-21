import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '../src/features/auth/AuthContext';
import { ThemeProvider, useAppTheme } from '../src/theme/useAppTheme';

/**
 * - Expo Router의 최상위 레이아웃이다.
 * - 앱 전역 Stack 화면과 공통 헤더 스타일을 설정한다.
 * - 라이트/다크 테마에 맞춰 StatusBar와 헤더 색상을 동기화한다.
 */
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * - ThemeProvider 내부에서 Stack 네비게이션 스타일을 구성한다.
 * - 로그인, 탭, 상세, 작성 화면은 같은 테마 토큰을 공유한다.
 * - 하단 탭은 별도 그룹 layout에서 관리한다.
 */
function RootStack() {
  const theme = useAppTheme();

  return (
    <>
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: '로그인' }} />
        <Stack.Screen name="recipes/[id]" options={{ title: '레시피 상세' }} />
        <Stack.Screen
          name="recipes/new"
          options={{ presentation: 'modal', title: '레시피 작성' }}
        />
        <Stack.Screen name="menu/liked-recipes" options={{ title: '좋아요한 레시피' }} />
        <Stack.Screen name="menu/settings" options={{ title: '설정' }} />
      </Stack>
    </>
  );
}
