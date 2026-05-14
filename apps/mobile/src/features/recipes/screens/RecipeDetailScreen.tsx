import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components/Screen';
import { useAppTheme } from '../../../theme/useAppTheme';
import { VisibilityBadge } from '../components/VisibilityBadge';
import { mockRecipes } from '../data/mockRecipes';

type RecipeDetailScreenProps = {
  recipeId?: string;
};

export function RecipeDetailScreen({ recipeId }: RecipeDetailScreenProps) {
  const theme = useAppTheme();
  const recipe = mockRecipes.find((item) => item.id === recipeId);

  if (!recipe) {
    return (
      <Screen theme={theme}>
        <Text style={[styles.title, { color: theme.text }]}>레시피를 찾을 수 없습니다</Text>
      </Screen>
    );
  }

  return (
    <Screen theme={theme}>
      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.heroHeader}>
          <Text style={[styles.title, { color: theme.text }]}>{recipe.title}</Text>
          <VisibilityBadge visibility={recipe.visibility} theme={theme} />
        </View>
        <Text style={[styles.description, { color: theme.textMuted }]}>{recipe.description}</Text>
        <View style={styles.statRow}>
          <Text style={[styles.stat, { color: theme.textMuted }]}>{recipe.cookingTimeMinutes}분</Text>
          <Text style={[styles.stat, { color: theme.textMuted }]}>조회 {recipe.viewCount}</Text>
          <Text style={[styles.stat, { color: theme.textMuted }]}>좋아요 {recipe.likeCount}</Text>
          <Text style={[styles.stat, { color: theme.textMuted }]}>공유 {recipe.shareCount}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>재료</Text>
        {recipe.ingredients.map((ingredient) => (
          <Text key={ingredient} style={[styles.listItem, { color: theme.textMuted }]}>
            - {ingredient}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>조리 방법</Text>
        {recipe.steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <Text style={[styles.stepNumber, { color: theme.primary }]}>{index + 1}</Text>
            <Text style={[styles.stepText, { color: theme.textMuted }]}>{step}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 16,
  },
  stat: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  listItem: {
    fontSize: 15,
    lineHeight: 23,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '800',
    width: 22,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
  },
});
