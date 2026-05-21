import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '../../src/features/auth/AuthContext';
import { useAppTheme } from '../../src/theme/useAppTheme';

/**
 * - 로그인 후 사용하는 하단 탭 레이아웃이다.
 * - 내 레시피, 둘러보기, 설정을 앱의 주요 진입점으로 둔다.
 * - 인증 상태가 없으면 로그인 화면으로 돌려보낸다.
 */
export default function TabsLayout() {
  const theme = useAppTheme();
  const { tokenResponse } = useAuth();

  if (!tokenResponse) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text, fontSize: 17, fontWeight: '700' },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: 58,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '내 레시피',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" color={color} size={size + 3} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '둘러보기',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" color={color} size={size + 3} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: '메뉴',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" color={color} size={size + 4} />
          ),
        }}
      />
    </Tabs>
  );
}
