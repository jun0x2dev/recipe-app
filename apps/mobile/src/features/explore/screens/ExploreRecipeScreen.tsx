import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '../../../components/Screen';
import { useAppTheme } from '../../../theme/useAppTheme';
import { RecipeCard } from '../../recipes/components/RecipeCard';
import { mockRecipes } from '../../recipes/data/mockRecipes';

/**
 * - 다른 사용자의 공개 레시피를 둘러보는 화면이다.
 * - MVP 단계에서는 mock 데이터 중 공개 레시피만 사용한다.
 * - 추후 공개 레시피 API, 정렬, 검색, 저장 기능을 이 화면에 연결한다.
 */
export function ExploreRecipeScreen() {
  const theme = useAppTheme();
  const [keyword, setKeyword] = useState('');

  /**
   * - 공개 레시피 중 검색어에 맞는 항목만 계산한다.
   * - 제목, 설명, 재료를 대상으로 대소문자 구분 없이 필터링한다.
   * - 실제 API 연결 후에도 화면 입력 상태는 같은 방식으로 유지한다.
   */
  const recipes = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const publicRecipes = mockRecipes.filter((recipe) => recipe.visibility === 'public');

    if (!normalizedKeyword) {
      return publicRecipes;
    }

    return publicRecipes.filter((recipe) =>
      [recipe.title, recipe.description, ...recipe.ingredients].some((text) =>
        text.toLowerCase().includes(normalizedKeyword),
      ),
    );
  }, [keyword]);

  return (
    <Screen theme={theme}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>오늘의 공개 레시피</Text>
        <Text style={[styles.title, { color: theme.text }]}>둘러보기</Text>
      </View>

      <TextInput
        placeholder="공개 레시피 검색"
        placeholderTextColor={theme.textMuted}
        value={keyword}
        onChangeText={setKeyword}
        style={[styles.searchInput, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
      />

      {recipes[0] ? (
        <PressableFeatured
          title={recipes[0].title}
          description={recipes[0].description}
          cookingTimeMinutes={recipes[0].cookingTimeMinutes}
          themeText={theme.text}
          themeMuted={theme.textMuted}
          themeSurface={theme.surfaceMuted}
          onPress={() => router.push(`/recipes/${recipes[0].id}`)}
        />
      ) : null}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>최근 올라온 레시피</Text>
      <View style={styles.list}>
        {recipes.slice(1).map((recipe) => (
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

/**
 * - 둘러보기 화면 상단에 노출하는 대표 공개 레시피 카드 props다.
 * - 일반 목록 카드보다 큰 영역으로 오늘의 추천처럼 보이게 한다.
 * - 실제 추천 API가 붙기 전까지 첫 번째 공개 mock 레시피를 표시한다.
 */
type PressableFeaturedProps = {
  title: string;
  description: string;
  cookingTimeMinutes: number;
  themeText: string;
  themeMuted: string;
  themeSurface: string;
  onPress: () => void;
};

/**
 * - 공개 레시피 피드의 대표 카드다.
 * - 이미지를 붙이기 전까지 중립색 썸네일 영역과 큰 제목으로 시각 계층을 만든다.
 * - 탭 진입 직후 목록 복제처럼 보이지 않게 화면 리듬을 바꾼다.
 */
function PressableFeatured({
  title,
  description,
  cookingTimeMinutes,
  themeText,
  themeMuted,
  themeSurface,
  onPress,
}: PressableFeaturedProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.featured,
        { backgroundColor: themeSurface, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <View style={styles.featuredImage}>
        <Text style={[styles.featuredInitial, { color: themeMuted }]}>{title.slice(0, 1)}</Text>
      </View>
      <Text style={[styles.featuredMeta, { color: themeMuted }]}>{cookingTimeMinutes}분 레시피</Text>
      <Text style={[styles.featuredTitle, { color: themeText }]}>{title}</Text>
      <Text numberOfLines={2} style={[styles.featuredDescription, { color: themeMuted }]}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  searchInput: {
    borderRadius: 14,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  featured: {
    borderRadius: 22,
    gap: 8,
    padding: 20,
  },
  featuredImage: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 149, 161, 0.12)',
    borderRadius: 18,
    height: 86,
    justifyContent: 'center',
    marginBottom: 6,
    width: 86,
  },
  featuredInitial: {
    fontSize: 30,
    fontWeight: '900',
  },
  featuredMeta: {
    fontSize: 13,
    fontWeight: '800',
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  featuredDescription: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  list: {
    gap: 12,
  },
});
