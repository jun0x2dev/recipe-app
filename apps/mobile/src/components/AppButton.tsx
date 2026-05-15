import { Pressable, StyleSheet, Text } from 'react-native';

import { AppTheme } from '../theme/useAppTheme';

/**
 * - 앱 전역에서 재사용하는 기본 버튼 props다.
 * - primary와 secondary variant만 허용해 버튼 시각 정책을 단순하게 유지한다.
 * - theme는 라이트/다크 모드 색상 적용을 위해 호출자가 전달한다.
 */
type AppButtonProps = {
  label: string;
  theme: AppTheme;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onPress: () => void;
};

/**
 * - 앱 공통 Pressable 버튼 컴포넌트다.
 * - variant에 따라 배경색과 글자색을 결정한다.
 * - pressed 상태에서는 opacity만 조정해 레이아웃 흔들림을 막는다.
 */
export function AppButton({
  label,
  theme,
  variant = 'primary',
  disabled = false,
  onPress,
}: AppButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : theme.surfaceMuted,
          opacity: disabled ? 0.5 : pressed ? 0.78 : 1,
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
