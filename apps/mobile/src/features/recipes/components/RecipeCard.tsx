import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTheme } from '../../../theme/useAppTheme';
import { Recipe } from '../types/recipe';
import { VisibilityBadge } from './VisibilityBadge';

type RecipeCardProps = {
  recipe: Recipe;
  theme: AppTheme;
  onPress: () => void;
};

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
