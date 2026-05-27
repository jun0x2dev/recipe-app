import { useFocusEffect, router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '../../../components/Screen';
import { useAuth } from '../../auth/AuthContext';
import { useAppTheme } from '../../../theme/useAppTheme';
import { RecipeCard } from '../../recipes/components/RecipeCard';
import { fetchPublicRecipes } from '../../recipes/services/recipeApi';
import { Recipe, RecipeCategory } from '../../recipes/types/recipe';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * - 공개 레시피를 둘러보는 화면이다.
 * - 백엔드 공개 레시피 API에서 페이징 조회한다.
 */
export function ExploreRecipeScreen() {
  const theme = useAppTheme();
  const { tokenResponse } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRecipes = useCallback(
    async (pageNumber: number, searchKeyword: string, append: boolean) => {
      if (!tokenResponse?.accessToken) return;

      try {
        const result = await fetchPublicRecipes(tokenResponse.accessToken, {
          keyword: searchKeyword || undefined,
          page: pageNumber,
          size: PAGE_SIZE,
        });

        setRecipes((prev) => (append ? [...prev, ...result.content] : result.content));
        setHasMore(!result.last);
        setPage(pageNumber);
      } catch {
        // 조회 실패 시 기존 데이터 유지
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [tokenResponse?.accessToken],
  );

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadRecipes(0, keyword, false);
    }, [loadRecipes, keyword]),
  );

  const handleSearch = (text: string) => {
    setKeyword(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setIsLoading(true);
      loadRecipes(0, text, false);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRecipes(0, keyword, false);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    loadRecipes(page + 1, keyword, true);
  };

  const featured = recipes[0];
  const restRecipes = recipes.slice(1);

  const ListHeader = (
    <>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>오늘의 공개 레시피</Text>
        <Text style={[styles.title, { color: theme.text }]}>둘러보기</Text>
      </View>

      <TextInput
        placeholder="공개 레시피 검색"
        placeholderTextColor={theme.textMuted}
        value={keyword}
        onChangeText={handleSearch}
        style={[styles.searchInput, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
      />

      {featured ? (
        <PressableFeatured
          title={featured.title}
          description={featured.description}
          cookingTimeMinutes={featured.cookingTimeMinutes}
          category={featured.category}
          themeText={theme.text}
          themeMuted={theme.textMuted}
          themeSurface={theme.surfaceMuted}
          onPress={() => router.push(`/recipes/${featured.id}`)}
        />
      ) : null}

      {restRecipes.length > 0 ? (
        <Text style={[styles.sectionTitle, { color: theme.text }]}>최근 올라온 레시피</Text>
      ) : null}
    </>
  );

  return (
    <Screen theme={theme} scroll={false}>
      {isLoading && recipes.length === 0 ? (
        <>
          {ListHeader}
          <ActivityIndicator style={styles.loader} color={theme.textMuted} />
        </>
      ) : (
        <FlatList
          data={restRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              theme={theme}
              onPress={() => router.push(`/recipes/${item.id}`)}
            />
          )}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            !featured ? (
              <Text style={[styles.empty, { color: theme.textMuted }]}>
                아직 공개된 레시피가 없습니다.
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

type PressableFeaturedProps = {
  title: string;
  description: string;
  cookingTimeMinutes: number;
  category: RecipeCategory | null;
  themeText: string;
  themeMuted: string;
  themeSurface: string;
  onPress: () => void;
};

function PressableFeatured({
  title,
  description,
  cookingTimeMinutes,
  category,
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
      <View style={[styles.featuredImage, category ? { backgroundColor: category.color } : undefined]}>
        <Text style={category ? styles.featuredEmoji : [styles.featuredInitial, { color: themeMuted }]}>
          {category?.emoji ?? title.slice(0, 1)}
        </Text>
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
    marginBottom: 16,
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
    marginBottom: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  featured: {
    borderRadius: 22,
    gap: 8,
    marginBottom: 16,
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
  featuredEmoji: {
    fontSize: 36,
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
    marginBottom: 12,
  },
  list: {
    gap: 12,
    padding: 24,
    paddingBottom: 36,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    fontSize: 15,
    marginTop: 40,
    textAlign: 'center',
  },
});
