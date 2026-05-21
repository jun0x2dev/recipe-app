import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text } from 'react-native';

import { Screen } from '../../../components/Screen';
import { useAuth } from '../../auth/AuthContext';
import { useAppTheme } from '../../../theme/useAppTheme';
import { RecipeCard } from '../../recipes/components/RecipeCard';
import { fetchLikedRecipes } from '../../recipes/services/recipeApi';
import { Recipe } from '../../recipes/types/recipe';

const PAGE_SIZE = 20;

/**
 * - 사용자가 좋아요한 레시피 목록을 보여주는 화면이다.
 * - 메뉴 > 좋아요한 레시피에서 진입한다.
 * - 백엔드 API에서 페이징 조회하고 pull-to-refresh, 무한 스크롤을 지원한다.
 */
export function LikedRecipesScreen() {
  const theme = useAppTheme();
  const { tokenResponse } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadRecipes = useCallback(
    async (pageNumber: number, append: boolean) => {
      if (!tokenResponse?.accessToken) return;

      try {
        const result = await fetchLikedRecipes(tokenResponse.accessToken, {
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
      loadRecipes(0, false);
    }, [loadRecipes]),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRecipes(0, false);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    loadRecipes(page + 1, true);
  };

  return (
    <Screen theme={theme} scroll={false}>
      {isLoading && recipes.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={theme.textMuted} />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              theme={theme}
              onPress={() => router.push(`/recipes/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.textMuted }]}>
              아직 좋아요한 레시피가 없습니다.
            </Text>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 20,
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
