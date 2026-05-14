import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { Screen } from '../../../components/Screen';
import { useAppTheme } from '../../../theme/useAppTheme';
import { RecipeCard } from '../components/RecipeCard';
import { mockRecipes } from '../data/mockRecipes';

export function RecipeListScreen() {
  const theme = useAppTheme();
  const [keyword, setKeyword] = useState('');

  const recipes = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return mockRecipes;
    }

    return mockRecipes.filter((recipe) =>
      [recipe.title, recipe.description, ...recipe.ingredients].some((text) =>
        text.toLowerCase().includes(normalizedKeyword),
      ),
    );
  }, [keyword]);

  return (
    <Screen theme={theme}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: theme.textMuted }]}>오늘의 레시피 보관함</Text>
          <Text style={[styles.title, { color: theme.text }]}>내 레시피</Text>
        </View>
        <AppButton label="작성" theme={theme} onPress={() => router.push('/recipes/new')} />
      </View>

      <TextInput
        placeholder="요리명, 재료로 검색"
        placeholderTextColor={theme.textMuted}
        value={keyword}
        onChangeText={setKeyword}
        style={[
          styles.searchInput,
          { backgroundColor: theme.input, borderColor: theme.border, color: theme.text },
        ]}
      />

      <View style={styles.summaryRow}>
        <Text style={[styles.summary, { color: theme.textMuted }]}>총 {recipes.length}개</Text>
        <Text style={[styles.summary, { color: theme.textMuted }]}>
          공개 {recipes.filter((recipe) => recipe.visibility === 'public').length}개
        </Text>
      </View>

      <View style={styles.list}>
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            theme={theme}
            onPress={() => router.push(`/recipes/${recipe.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  searchInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summary: {
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
});
