import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppTheme } from '../theme/useAppTheme';

/**
 * - 화면 공통 레이아웃 props다.
 * - 기본값은 ScrollView 기반 화면이다.
 * - scroll이 false면 고정 View 컨테이너로 렌더링한다.
 */
type ScreenProps = PropsWithChildren<{
  theme: AppTheme;
  scroll?: boolean;
}>;

/**
 * - 앱 화면의 공통 여백과 배경색을 제공한다.
 * - 키보드 입력 화면에서도 탭이 자연스럽게 동작하도록 keyboardShouldPersistTaps를 설정한다.
 * - 화면별 중복 레이아웃 코드를 줄이기 위한 기반 컴포넌트다.
 */
export function Screen({ children, theme, scroll = true }: ScreenProps) {
  if (!scroll) {
    return <View style={[styles.container, { backgroundColor: theme.background }]}>{children}</View>;
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
});
