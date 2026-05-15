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
 * - 상태 의미는 텍스트로 전달하고 강한 색상 사용은 피한다.
 * - 공개/비공개는 레시피 카드의 보조 정보로만 작게 표시한다.
 */
export function VisibilityBadge({ visibility, theme }: VisibilityBadgeProps) {
  const isPublic = visibility === 'public';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: theme.surfaceMuted },
      ]}
    >
      <Text style={[styles.text, { color: theme.textMuted }]}>
        {isPublic ? '공개' : '비공개'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
