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
        { backgroundColor: theme.surfaceMuted, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <View style={[styles.thumbnail, { backgroundColor: theme.surface }]}>
        <Text style={[styles.thumbnailText, { color: theme.textMuted }]}>
          {recipe.title.slice(0, 1)}
        </Text>
      </View>
      <View style={styles.content}>
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
          {recipe.servings ? (
            <>
              <Text style={[styles.meta, { color: theme.textMuted }]}>{recipe.servings}인분</Text>
              <Text style={[styles.metaDot, { color: theme.textMuted }]}>·</Text>
            </>
          ) : null}
          <Text style={[styles.meta, { color: theme.textMuted }]}>{recipe.cookingTimeMinutes}분</Text>
          <Text style={[styles.metaDot, { color: theme.textMuted }]}>·</Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>조회 {recipe.viewCount}</Text>
          <Text style={[styles.metaDot, { color: theme.textMuted }]}>·</Text>
          <Text style={[styles.meta, { color: recipe.liked ? theme.danger : theme.textMuted }]}>
            {recipe.liked ? '♥' : '♡'} {recipe.likeCount}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
  },
  thumbnail: {
    alignItems: 'center',
    borderRadius: 14,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  thumbnailText: {
    fontSize: 24,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    gap: 7,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  meta: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaDot: {
    fontSize: 12,
    fontWeight: '800',
  },
});
