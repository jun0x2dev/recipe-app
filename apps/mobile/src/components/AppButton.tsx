import { Pressable, StyleSheet, Text } from 'react-native';

import { AppTheme } from '../theme/useAppTheme';

type AppButtonProps = {
  label: string;
  theme: AppTheme;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
};

export function AppButton({ label, theme, variant = 'primary', onPress }: AppButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : theme.surfaceMuted,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: isPrimary ? theme.primaryText : theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
});
