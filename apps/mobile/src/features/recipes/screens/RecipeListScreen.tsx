import { useFocusEffect, router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../auth/AuthContext';
import { useAppTheme } from '../../../theme/useAppTheme';
import { RecipeCard } from '../components/RecipeCard';
import { fetchMyRecipes } from '../services/recipeApi';
import { Recipe } from '../types/recipe';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * - 사용자의 레시피 목록을 보여주는 화면이다.
 * - 백엔드 API에서 페이징 조회하고 검색, pull-to-refresh, 무한 스크롤을 지원한다.
 */
export function RecipeListScreen() {
  const theme = useAppTheme();
  const { tokenResponse } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRecipes = useCallback(
    async (pageNumber: number, searchKeyword: string, append: boolean) => {
      if (!tokenResponse?.accessToken) return;

      try {
        const result = await fetchMyRecipes(tokenResponse.accessToken, {
          keyword: searchKeyword || undefined,
          page: pageNumber,
          size: PAGE_SIZE,
        });

        setRecipes((prev) => (append ? [...prev, ...result.content] : result.content));
        setTotalCount(result.totalElements);
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

  const publicCount = recipes.filter((recipe) => recipe.visibility === 'public').length;

  return (
    <Screen theme={theme} scroll={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: theme.textMuted }]}>내가 기록한 요리</Text>
          <Text style={[styles.title, { color: theme.text }]}>내 레시피</Text>
        </View>
        <AppButton label="작성" theme={theme} onPress={() => router.push('/recipes/new')} />
      </View>

      <TextInput
        placeholder="요리명으로 검색"
        placeholderTextColor={theme.textMuted}
        value={keyword}
        onChangeText={handleSearch}
        style={[styles.searchInput, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
      />

      <View style={[styles.summaryBox, { backgroundColor: theme.surfaceMuted }]}>
        <Text style={[styles.summaryNumber, { color: theme.text }]}>{totalCount}</Text>
        <Text style={[styles.summary, { color: theme.textMuted }]}>
          저장된 레시피, 공개 {publicCount}개
        </Text>
      </View>

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
              레시피가 없습니다. 첫 레시피를 작성해보세요!
            </Text>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
  },
  searchInput: {
    borderRadius: 14,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  summaryBox: {
    borderRadius: 16,
    gap: 2,
    marginBottom: 16,
    padding: 18,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  summary: {
    fontSize: 13,
    fontWeight: '700',
  },
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
