import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../../../theme/useAppTheme';
import { Recipe } from '../types/recipe';
import { VisibilityBadge } from './VisibilityBadge';

/**
 * - 레시피 목록 카드 props다.
 * - recipe는 표시할 도메인 데이터, theme는 색상 토큰, onPress는 상세 이동을 담당한다.
 * - 카드 내부에서는 데이터 변경 없이 표시만 수행한다.
 */
type RecipeCardProps = {
  recipe: Recipe;
  theme: AppTheme;
  onPress: () => void;
};

/**
 * - 레시피 목록에서 하나의 레시피를 요약 표시하는 카드다.
 * - 제목, 설명, 공개 상태, 조회/좋아요 같은 메타 정보를 한 번에 보여준다.
 * - Pressable로 감싸 상세 화면 이동 같은 상위 액션을 연결한다.
 */
export function RecipeCard({ recipe, theme, onPress }: RecipeCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={styles.header}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {recipe.title}
        </Text>
        <VisibilityBadge visibility={recipe.visibility} theme={theme} />
      </View>
      <Text numberOfLines={2} style={[styles.description, { color: theme.textMuted }]}>
        {recipe.description}
      </Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: theme.textMuted }]}>{recipe.cookingTimeMinutes}분</Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>조회 {recipe.viewCount}</Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>좋아요 {recipe.likeCount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
});
