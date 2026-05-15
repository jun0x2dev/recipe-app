import { StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../../../theme/useAppTheme';
import { RecipeVisibility } from '../types/recipe';

/**
 * - 공개/비공개 배지 props다.
 * - visibility에 따라 라벨과 색상을 결정한다.
 * - theme는 라이트/다크 모드별 색상 토큰을 제공한다.
 */
type VisibilityBadgeProps = {
  visibility: RecipeVisibility;
  theme: AppTheme;
};

/**
 * - 레시피 공개 상태를 작은 배지로 표시한다.
 * - 공개는 success 색상, 비공개는 warning 색상으로 구분한다.
 * - 색상만이 아니라 텍스트도 함께 표시해 접근성을 보완한다.
 */
export function VisibilityBadge({ visibility, theme }: VisibilityBadgeProps) {
  const isPublic = visibility === 'public';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isPublic ? `${theme.success}20` : `${theme.warning}20` },
      ]}
    >
      <Text style={[styles.text, { color: isPublic ? theme.success : theme.warning }]}>
        {isPublic ? '공개' : '비공개'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
