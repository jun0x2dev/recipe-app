import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categoryThumbnails } from '../../../assets/categories';
import { useAuth } from '../../auth/AuthContext';
import { fetchMyRecipes } from '../services/recipeApi';
import { Recipe } from '../types/recipe';

/**
 * - 필터 탭 종류다.
 * - 전체: 내 레시피 전체 조회
 * - 공유중: 공개 상태인 레시피만 조회
 */
type FilterTab = 'all' | 'shared';

/**
 * - 정렬 기준이다.
 * - 현재 최신순만 지원하며 추후 인기순 등 확장 가능하다.
 */
type SortOrder = 'latest';

/**
 * - 추천 검색어 목록이다.
 * - TODO: 추후 백엔드 API(또는 DB 테이블)에서 동적으로 가져오도록 변경한다.
 *   현재는 프론트엔드에 하드코딩된 값을 사용한다.
 */
const RECOMMENDED_KEYWORDS = ['볶음밥', '제육', '파스타', '김치찌개', '샐러드', '토스트'];

/** 빈 상태 일러스트 (피그마 Hom_002_000 Img_Empty) */
const emptyMyRecipeImage = require('../../../assets/home/empty-my-recipe.png');

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * - 피그마 Hom_002 시리즈 디자인 기준 내 레시피(홈) 화면이다.
 * - 검색 상태에 따라 다른 콘텐츠를 렌더링한다:
 *   - 빈 상태(Hom_002_000): 레시피가 하나도 없을 때 일러스트 + "기록하기" 버튼
 *   - 기본(Hom_002_001): "내 레시피" 타이틀 + 필터 칩(전체/공유중) + 정렬 + 레시피 리스트
 *   - 포커스(Hom_002_002_Focus): "추천 검색어" + 키워드 칩
 *   - 검색 결과(Hom_002_002_Filled): 검색 결과 리스트
 *   - 스크롤(Hom_002_001_Scroll): 기본 상태와 동일 구조, 리스트가 스크롤됨
 * - 둘러보기 화면과의 주요 차이:
 *   - 검색 placeholder: "요리명을 검색해주세요"
 *   - 필터: "전체" / "공유중" (둘러보기는 "전체" / "좋아요")
 *   - 배지: "비공개" (회색) (둘러보기는 "내 레시피" 노란색)
 *   - 하단 "기록하기" 플로팅 버튼이 항상 표시됨
 *   - 빈 상태에서는 검색바가 숨겨짐
 */
export function RecipeListScreen() {
  const insets = useSafeAreaInsets();
  const { tokenResponse } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [_sortOrder, _setSortOrder] = useState<SortOrder>('latest');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  /** 최초 로딩 완료 여부 — 빈 상태와 로딩 중을 구분하기 위해 사용한다. */
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  /**
   * - 내 레시피 API를 호출한다.
   * - 'shared' 필터는 클라이언트에서 visibility === 'public'으로 필터링한다.
   *   TODO: 추후 백엔드에 visibility 쿼리 파라미터를 추가하면 서버 필터링으로 전환한다.
   */
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
        setHasMore(!result.last);
        setPage(pageNumber);
      } catch {
        // 조회 실패 시 기존 데이터 유지
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setHasInitialLoaded(true);
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

  /**
   * - 검색어 입력 시 디바운스 후 재조회한다.
   */
  const handleSearch = (text: string) => {
    setKeyword(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!text.trim()) {
      setHasSearched(false);
      setIsLoading(true);
      loadRecipes(0, '', false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      setHasSearched(true);
      setIsLoading(true);
      loadRecipes(0, text, false);
    }, SEARCH_DEBOUNCE_MS);
  };

  /**
   * - 추천 검색어 칩 클릭 시 해당 키워드로 즉시 검색한다.
   */
  const handleRecommendedKeyword = (text: string) => {
    setKeyword(text);
    setHasSearched(true);
    setIsSearchFocused(false);
    setIsLoading(true);
    searchInputRef.current?.blur();
    loadRecipes(0, text, false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRecipes(0, keyword, false);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    loadRecipes(page + 1, keyword, true);
  };

  /**
   * - 필터 탭 전환 시 해당 필터 상태를 반영한다.
   * - 'shared' 필터는 클라이언트에서 공개 레시피만 걸러 보여준다.
   */
  const handleFilterChange = (filter: FilterTab) => {
    if (filter === activeFilter) return;
    setActiveFilter(filter);
  };

  /** 리스트 아이템 사이 구분선 — 피그마 Divider: #F7F8FA, 1px */
  const renderDivider = () => <View style={styles.divider} />;

  /**
   * - 필터가 적용된 레시피 목록을 반환한다.
   * - 'shared': visibility가 public인 것만 표시
   * - 'all': 전체 표시
   */
  const filteredRecipes = activeFilter === 'shared'
    ? recipes.filter((r) => r.visibility === 'public')
    : recipes;

  /**
   * - 현재 검색 상태를 판별한다.
   * - empty_initial: 레시피가 하나도 없는 최초 빈 상태 (검색바 없음)
   * - focused: 검색 입력에 포커스 + 키워드 없음 → 추천 검색어 표시
   * - searching: 키워드가 있고 로딩 중 → 로딩 표시
   * - empty: 검색 완료 + 결과 없음 → 빈 상태 화면
   * - results: 검색 완료 + 결과 있음 → 결과 리스트
   * - browse: 기본 브라우즈 모드 → 필터 + 리스트
   */
  const getSearchState = () => {
    const hasKeyword = keyword.trim().length > 0;

    // 최초 로딩이 끝났고, 검색어 없이 레시피가 0개면 빈 상태
    if (hasInitialLoaded && !hasKeyword && recipes.length === 0 && !isSearchFocused) {
      return 'empty_initial';
    }

    if (isSearchFocused && !hasKeyword) return 'focused';
    if (hasKeyword && (isLoading || !hasSearched)) return 'searching';
    if (hasKeyword && !isLoading && recipes.length === 0) return 'empty';
    if (hasKeyword && recipes.length > 0) return 'results';
    return 'browse';
  };

  const searchState = getSearchState();

  /**
   * - 빈 상태 여부를 판단하여 검색 헤더 표시 여부를 결정한다.
   * - 피그마: 빈 상태(Hom_002_000)에서는 검색바가 없다.
   */
  const showSearchHeader = searchState !== 'empty_initial';

  /**
   * - 기본 브라우즈 모드의 FlatList 헤더다.
   * - 피그마 Hom_002_001: "내 레시피" 타이틀 + 필터 칩(전체/공유중) + 정렬 버튼(최신순)
   */
  const BrowseListHeader = (
    <View style={styles.top}>
      <Text style={styles.sectionTitle}>내 레시피</Text>
      <View style={styles.filterRow}>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => handleFilterChange('all')}
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipSelected]}
          >
            <Text
              style={[
                styles.filterChipLabel,
                activeFilter === 'all' && styles.filterChipLabelSelected,
              ]}
            >
              전체
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleFilterChange('shared')}
            style={[styles.filterChip, activeFilter === 'shared' && styles.filterChipSelected]}
          >
            <Text
              style={[
                styles.filterChipLabel,
                activeFilter === 'shared' && styles.filterChipLabelSelected,
              ]}
            >
              공유중
            </Text>
          </Pressable>
        </View>
        <View style={styles.sortButton}>
          <Ionicons name="swap-vertical-outline" size={16} color="#9CA1A6" />
          <Text style={styles.sortLabel}>최신순</Text>
        </View>
      </View>
    </View>
  );

  /**
   * - 콘텐츠 영역을 검색 상태에 따라 분기 렌더링한다.
   */
  const renderContent = () => {
    switch (searchState) {
      /**
       * - 피그마 Hom_002_000_Main_empty
       * - 레시피가 하나도 없을 때의 빈 상태다.
       * - 검색바 없이 타이틀 + 일러스트 + "기록하기" 버튼
       */
      case 'empty_initial':
        return (
          <View style={styles.emptyInitialContainer}>
            <Text style={styles.sectionTitle}>내 레시피</Text>
            <View style={styles.emptyInitialContent}>
              <View style={styles.emptyInitialInfo}>
                <Image source={emptyMyRecipeImage} style={styles.emptyImage} />
                <Text style={styles.emptyText}>아직 내 레시피가 없어요</Text>
              </View>
              <Pressable
                onPress={() => router.push('/recipes/new')}
                style={({ pressed }) => [
                  styles.recordButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.recordButtonLabel}>기록하기</Text>
              </Pressable>
            </View>
          </View>
        );

      /**
       * - 피그마 Hom_002_002_Search_Focus
       * - 검색 포커스 상태에서 추천 검색어를 표시한다.
       */
      case 'focused':
        return (
          <Pressable style={styles.recommendContainer} onPress={() => Keyboard.dismiss()}>
            <Text style={styles.recommendTitle}>추천 검색어</Text>
            <View style={styles.recommendChipRow}>
              {RECOMMENDED_KEYWORDS.map((kw) => (
                <Pressable
                  key={kw}
                  onPress={() => handleRecommendedKeyword(kw)}
                  style={({ pressed }) => [
                    styles.recommendChip,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={styles.recommendChipLabel}>{kw}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        );

      /**
       * - 검색어 입력 중 로딩 상태를 표시한다.
       */
      case 'searching':
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#8B95A1" />
          </View>
        );

      /**
       * - 검색 결과가 없을 때 빈 상태를 표시한다.
       */
      case 'empty':
        return (
          <View style={styles.emptySearchContainer}>
            <View style={styles.emptySearchContent}>
              <Image source={emptyMyRecipeImage} style={styles.emptyImage} />
              <Text style={styles.emptyText}>아직 내 레시피가 없어요</Text>
            </View>
          </View>
        );

      /**
       * - 피그마 Hom_002_002_Search_Filled
       * - 검색 결과가 있을 때 리스트를 표시한다.
       * - 검색 모드에서는 필터 칩과 비공개 배지를 표시하지 않는다.
       */
      case 'results':
        return (
          <View style={styles.contentFlex}>
            <FlatList
              data={recipes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecipeListItem
                  recipe={item}
                  showBadge={false}
                  onPress={() => router.push(`/recipes/${item.id}`)}
                />
              )}
              ItemSeparatorComponent={renderDivider}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
            />
            <FloatingRecordButton />
          </View>
        );

      /**
       * - 피그마 Hom_002_001_Main / Hom_002_001_Main_Scroll
       * - 기본 브라우즈 모드: 타이틀 + 필터 + 전체 리스트 + 플로팅 기록하기 버튼
       */
      case 'browse':
      default:
        if (isLoading && recipes.length === 0) {
          return (
            <View style={styles.browseContainer}>
              {BrowseListHeader}
              <ActivityIndicator style={styles.loader} color="#8B95A1" />
            </View>
          );
        }

        return (
          <View style={styles.contentFlex}>
            <FlatList
              data={filteredRecipes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecipeListItem
                  recipe={item}
                  showBadge={true}
                  onPress={() => router.push(`/recipes/${item.id}`)}
                />
              )}
              ListHeaderComponent={BrowseListHeader}
              ItemSeparatorComponent={renderDivider}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                <Text style={styles.emptyListText}>
                  {activeFilter === 'shared'
                    ? '아직 공유중인 레시피가 없습니다.'
                    : '아직 레시피가 없습니다.'}
                </Text>
              }
            />
            <FloatingRecordButton />
          </View>
        );
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* 검색 헤더 — 빈 상태에서는 숨김 (피그마 Hom_002_000) */}
      {showSearchHeader ? (
        <View style={styles.searchHeader}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#8B95A1" />
            <TextInput
              ref={searchInputRef}
              placeholder="요리명을 검색해주세요"
              placeholderTextColor="#8B95A1"
              value={keyword}
              onChangeText={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {/* 검색어가 있을 때 클리어 버튼 */}
            {keyword.trim() ? (
              <Pressable
                onPress={() => {
                  setKeyword('');
                  setHasSearched(false);
                  setIsLoading(true);
                  loadRecipes(0, '', false);
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color="#8B95A1" />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* 검색 상태별 콘텐츠 */}
      {renderContent()}
    </View>
  );
}

// ── 플로팅 기록하기 버튼 ──

/**
 * - 피그마 Hom_002_001: 하단 우측 고정 "기록하기" 버튼이다.
 * - #343D46 배경, 16px radius, 124x52, Plus 아이콘 + "기록하기" 라벨
 * - 하단 탭바 위에 16px 여백을 두고 우측 정렬한다.
 */
function FloatingRecordButton() {
  return (
    <View style={styles.floatingButtonArea}>
      <Pressable
        onPress={() => router.push('/recipes/new')}
        style={({ pressed }) => [
          styles.recordButton,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.recordButtonLabel}>기록하기</Text>
      </Pressable>
    </View>
  );
}

// ── 리스트 아이템 ──

type RecipeListItemProps = {
  recipe: Recipe;
  /** 비공개 배지 표시 여부 — 검색 결과에서는 false */
  showBadge: boolean;
  onPress: () => void;
};

/**
 * - 피그마 List/Recipe 컴포넌트를 구현한다.
 * - 왼쪽: 32x32 카테고리 썸네일 이미지 (thumbnailUrl로 로컬 에셋 매핑)
 * - thumbnailUrl이 없으면 썸네일 영역을 빈 상태로 표시한다.
 * - 중앙: 제목, 설명(1줄), 메타정보(소요시간 · 좋아요)
 * - 우측: 비공개 레시피면 "비공개" 배지 표시 (showBadge가 true일 때만)
 *   - 피그마: #E4E9EE 배경, #CED6DC 테두리, #838A90 텍스트
 */
function RecipeListItem({ recipe, showBadge, onPress }: RecipeListItemProps) {
  const thumbnailKey = recipe.category?.thumbnailUrl;
  const thumbnailSource = thumbnailKey ? categoryThumbnails[thumbnailKey] : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.listItem, { opacity: pressed ? 0.7 : 1 }]}
    >
      {/* 카테고리 썸네일 (32x32) */}
      <View style={styles.thumbnail}>
        {thumbnailSource ? (
          <Image source={thumbnailSource} style={styles.thumbnailImage} />
        ) : null}
      </View>

      {/* 제목 + 설명 + 메타 */}
      <View style={styles.itemContent}>
        <Text numberOfLines={1} style={styles.itemTitle}>
          {recipe.title}
        </Text>
        <Text numberOfLines={1} style={styles.itemDescription}>
          {recipe.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{recipe.cookingTimeMinutes}</Text>
          <Text style={styles.metaText}>분</Text>
          <View style={styles.metaDot} />
          <Ionicons
            name={recipe.liked ? 'heart' : 'heart-outline'}
            size={12}
            color={recipe.liked ? '#C81313' : '#9EA6AC'}
          />
          <Text
            style={[
              styles.metaText,
              recipe.liked && { color: '#C81313', fontWeight: '500' },
            ]}
          >
            {recipe.likeCount}
          </Text>
        </View>
      </View>

      {/* 비공개 배지 — 피그마: #E4E9EE bg, #CED6DC border, #838A90 text */}
      {showBadge && recipe.visibility === 'private' ? (
        <View style={styles.privateBadge}>
          <Text style={styles.privateBadgeText}>비공개</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ── 스타일 ──

const styles = StyleSheet.create({
  /**
   * - 전체 화면 루트 컨테이너다.
   * - 흰색 배경, 전체 영역을 채운다.
   */
  root: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },

  // ── 검색 헤더 ──

  /**
   * - 검색 헤더 영역이다.
   * - 피그마: padding 6px 16px, 56px 높이
   */
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },

  /**
   * - 검색 입력 컨테이너다.
   * - 피그마: #ECF0F4 배경, 12px radius, 8px 12px padding, 44px 높이
   */
  searchInputContainer: {
    alignItems: 'center',
    backgroundColor: '#ECF0F4',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
  },

  /**
   * - 검색 텍스트 입력이다.
   * - 피그마: Pretendard Medium 16px, #343D46
   */
  searchInput: {
    color: '#343D46',
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },

  // ── 빈 상태 (Hom_002_000) ──

  /**
   * - 최초 빈 상태 컨테이너다.
   * - 피그마: column, 20px gap, 20px padding, fill
   */
  emptyInitialContainer: {
    flex: 1,
    gap: 20,
    padding: 20,
  },

  /**
   * - 빈 상태 콘텐츠 영역이다.
   * - 피그마: column, center, 28px gap, 100px 상단 패딩
   */
  emptyInitialContent: {
    alignItems: 'center',
    flex: 1,
    gap: 28,
    paddingHorizontal: 40,
    paddingTop: 100,
  },

  /**
   * - 빈 상태 정보 (일러스트 + 텍스트) 영역이다.
   * - 피그마: column, center, 8px gap
   */
  emptyInitialInfo: {
    alignItems: 'center',
    gap: 8,
  },

  /**
   * - 빈 상태 일러스트 이미지다.
   * - 피그마: 72x72
   */
  emptyImage: {
    height: 72,
    width: 72,
  },

  /**
   * - 빈 상태 안내 텍스트다.
   * - 피그마: Pretendard SemiBold 18px, #838A90, center
   */
  emptyText: {
    color: '#838A90',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    textAlign: 'center',
  },

  // ── 검색 결과 없음 ──

  /**
   * - 검색 결과 없음 컨테이너다.
   */
  emptySearchContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
  },

  emptySearchContent: {
    alignItems: 'center',
    gap: 8,
  },

  // ── 추천 검색어 (Hom_002_002_Focus) ──

  /**
   * - 추천 검색어 컨테이너다.
   * - 피그마: column, 20px gap, 20px padding
   */
  recommendContainer: {
    flex: 1,
    gap: 20,
    padding: 20,
  },

  /**
   * - "추천 검색어" 타이틀이다.
   * - 피그마: Pretendard SemiBold 16px, #343D46
   */
  recommendTitle: {
    color: '#343D46',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },

  /**
   * - 추천 검색어 칩 행이다.
   * - 피그마: row wrap, 8px gap
   */
  recommendChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  /**
   * - 추천 검색어 칩이다.
   * - 피그마: #ECF0F4 배경, 99px radius (pill), 8px 10px padding
   */
  recommendChip: {
    backgroundColor: '#ECF0F4',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  /**
   * - 추천 검색어 칩 라벨이다.
   * - 피그마: Pretendard Medium 14px, #646D74
   */
  recommendChipLabel: {
    color: '#646D74',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // ── 로딩/센터 ──

  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  // ── 브라우즈 모드 (Hom_002_001) ──

  browseContainer: {
    flex: 1,
    padding: 20,
  },

  /**
   * - flex: 1 래퍼 — FlatList + 플로팅 버튼을 함께 표시하기 위한 컨테이너다.
   */
  contentFlex: {
    flex: 1,
  },

  /**
   * - 타이틀 + 필터 영역이다.
   * - 피그마: column, 12px gap
   */
  top: {
    gap: 12,
    marginBottom: 12,
  },

  /**
   * - "내 레시피" 타이틀이다.
   * - 피그마: Pretendard SemiBold 22px, #343D46
   */
  sectionTitle: {
    color: '#343D46',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 31,
  },

  /**
   * - 필터 칩 + 정렬 버튼 행이다.
   * - 피그마: row, center, 12px gap
   */
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },

  /**
   * - 필터 칩 행이다.
   * - 피그마: row, 4px gap, fill
   */
  chipRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },

  /**
   * - 필터 칩이다.
   * - 피그마: 34px 높이, 12px horizontal padding, 8px radius
   */
  filterChip: {
    alignItems: 'center',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  /**
   * - 선택된 필터 칩이다.
   * - 피그마: #ECF0F4 배경
   */
  filterChipSelected: {
    backgroundColor: '#ECF0F4',
  },

  /**
   * - 필터 칩 라벨 텍스트다.
   * - 피그마: Pretendard Medium 14px, 기본 #646D74
   */
  filterChipLabel: {
    color: '#646D74',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  /**
   * - 선택된 필터 칩 라벨이다.
   * - 피그마: #555E66
   */
  filterChipLabelSelected: {
    color: '#555E66',
  },

  /**
   * - 정렬 버튼이다.
   * - 피그마: row, center, 2px gap
   */
  sortButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },

  /**
   * - 정렬 라벨이다.
   * - 피그마: Pretendard Medium 14px, #9CA1A6
   */
  sortLabel: {
    color: '#9CA1A6',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // ── 리스트 공통 ──

  /**
   * - FlatList 콘텐츠 영역이다.
   * - 피그마: 20px padding, 하단에 플로팅 버튼 공간(80px) 확보
   */
  listContent: {
    padding: 20,
    paddingBottom: 80,
  },

  /**
   * - 리스트 아이템 행이다.
   * - 피그마: row, 12px gap, 12px vertical padding
   */
  listItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },

  /**
   * - 카테고리 썸네일이다.
   * - 피그마: 32x32
   */
  thumbnail: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },

  /**
   * - 썸네일 이미지다.
   * - 32x32 영역에 맞춰 표시한다.
   */
  thumbnailImage: {
    height: 32,
    width: 32,
  },

  /**
   * - 아이템 텍스트 콘텐츠 영역이다.
   * - 피그마: column, fill, 4px gap
   */
  itemContent: {
    flex: 1,
    gap: 4,
  },

  /**
   * - 레시피 제목이다.
   * - 피그마: Pretendard SemiBold 18px, #343D46
   */
  itemTitle: {
    color: '#343D46',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
  },

  /**
   * - 레시피 설명이다.
   * - 피그마: Pretendard Medium 14px, #838A90
   */
  itemDescription: {
    color: '#838A90',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  /**
   * - 메타 정보 행 (소요시간, 좋아요)이다.
   * - 피그마: row, center, 4px gap
   */
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },

  /**
   * - 메타 텍스트 (시간, 좋아요 수)다.
   * - 피그마: Pretendard Regular 12px/16px, #9EA6AC
   */
  metaText: {
    color: '#9EA6AC',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },

  /**
   * - 메타 구분 점이다.
   * - 피그마: 2x2 타원, #9EA6AC
   */
  metaDot: {
    backgroundColor: '#9EA6AC',
    borderRadius: 1,
    height: 2,
    width: 2,
  },

  /**
   * - 리스트 아이템 사이 구분선이다.
   * - 피그마: #F7F8FA, 1px
   */
  divider: {
    backgroundColor: '#F7F8FA',
    height: 1,
  },

  /**
   * - "비공개" 배지다.
   * - 피그마: #E4E9EE 배경, #CED6DC 테두리, 6px radius, 2px 6px padding
   */
  privateBadge: {
    backgroundColor: '#E4E9EE',
    borderColor: '#CED6DC',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  /**
   * - "비공개" 배지 텍스트다.
   * - 피그마: Pretendard Medium 13px/16px, #838A90
   */
  privateBadgeText: {
    color: '#838A90',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
  },

  // ── 플로팅 버튼 ──

  /**
   * - 하단 플로팅 버튼 영역이다.
   * - 피그마: right-aligned, 16px padding
   */
  floatingButtonArea: {
    alignItems: 'flex-end',
    bottom: 0,
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0,
  },

  /**
   * - "기록하기" 버튼이다.
   * - 피그마: #343D46 배경, 16px radius, 124x52, row center, 2px gap
   */
  recordButton: {
    alignItems: 'center',
    backgroundColor: '#343D46',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 2,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingLeft: 16,
  },

  /**
   * - "기록하기" 버튼 라벨이다.
   * - 피그마: Pretendard Medium 16px, #FFFFFF
   */
  recordButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },

  loader: {
    marginTop: 40,
  },

  emptyListText: {
    color: '#8B95A1',
    fontSize: 15,
    marginTop: 40,
    textAlign: 'center',
  },
});
