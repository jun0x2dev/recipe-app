import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAppTheme } from '../src/theme/useAppTheme';

export default function RootLayout() {
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
        <Stack.Screen name="index" options={{ title: '내 레시피' }} />
        <Stack.Screen name="recipes/[id]" options={{ title: '레시피 상세' }} />
        <Stack.Screen
          name="recipes/new"
          options={{ presentation: 'modal', title: '레시피 작성' }}
        />
      </Stack>
    </>
  );
}
