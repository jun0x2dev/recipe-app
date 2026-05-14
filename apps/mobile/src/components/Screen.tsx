import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppTheme } from '../theme/useAppTheme';

type ScreenProps = PropsWithChildren<{
  theme: AppTheme;
  scroll?: boolean;
}>;

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
