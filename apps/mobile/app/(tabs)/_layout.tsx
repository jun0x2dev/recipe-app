import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '../../src/features/auth/AuthContext';
import { useAppTheme } from '../../src/theme/useAppTheme';

/**
 * - 로그인 후 사용하는 하단 탭 레이아웃이다.
 * - 피그마 TabBar 기준: 홈, 둘러보기, 오메추, 설정 (4개 탭)
 * - 높이 60px, 흰색 배경, #ECF0F4 상단 테두리
 * - 라벨: Pretendard Medium 12px, active #343D46, inactive #BBBBBB
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
        tabBarActiveTintColor: '#343D46',
        tabBarInactiveTintColor: '#BBBBBB',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#ECF0F4',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          headerShown: false,
          title: '둘러보기',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="recommend"
        options={{
          title: '오메추',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
