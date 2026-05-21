import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components/Screen';
import { useAuth } from '../../auth/AuthContext';
import { useAppTheme } from '../../../theme/useAppTheme';
import { VisibilityBadge } from '../components/VisibilityBadge';
import { deleteRecipe, fetchRecipe, toggleLike } from '../services/recipeApi';
import { Recipe } from '../types/recipe';

type RecipeDetailScreenProps = {
  recipeId?: string;
};

/**
 * - 레시피 상세를 API에서 조회해 보여주는 화면이다.
 * - 본인 레시피인 경우 수정/삭제 버튼을 표시한다.
 */
export function RecipeDetailScreen({ recipeId }: RecipeDetailScreenProps) {
  const theme = useAppTheme();
  const { tokenResponse, userId } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!recipeId || !tokenResponse?.accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      fetchRecipe(tokenResponse.accessToken, recipeId)
        .then(setRecipe)
        .catch(() => setRecipe(null))
        .finally(() => setIsLoading(false));
    }, [recipeId, tokenResponse?.accessToken]),
  );

  const isOwner = recipe != null && userId != null && recipe.userId === userId;
  const [isLiking, setIsLiking] = useState(false);

  /**
   * - 좋아요 버튼을 눌렀을 때 토글 API를 호출한다.
   * - 성공하면 liked 상태와 likeCount를 로컬에서 즉시 갱신한다.
   */
  const handleToggleLike = async () => {
    if (!tokenResponse?.accessToken || !recipeId || !recipe || isLiking) return;

    setIsLiking(true);
    try {
      const { liked } = await toggleLike(tokenResponse.accessToken, recipeId);
      setRecipe({
        ...recipe,
        liked,
        likeCount: liked ? recipe.likeCount + 1 : recipe.likeCount - 1,
      });
    } catch {
      // 실패 시 상태를 변경하지 않는다.
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = () => {
    if (!tokenResponse?.accessToken || !recipeId) return;

    Alert.alert('레시피 삭제', '이 레시피를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsDeleting(true);
            await deleteRecipe(tokenResponse.accessToken, recipeId);
            Alert.alert('삭제 완료', '레시피가 삭제되었습니다.');
            router.back();
          } catch (error) {
            Alert.alert(
              '삭제 실패',
              error instanceof Error ? error.message : '레시피 삭제 중 오류가 발생했습니다.',
            );
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <Screen theme={theme}>
        <ActivityIndicator style={styles.loader} color={theme.textMuted} />
      </Screen>
    );
  }

  if (!recipe) {
    return (
      <Screen theme={theme}>
        <Text style={[styles.title, { color: theme.text }]}>레시피를 찾을 수 없습니다</Text>
      </Screen>
    );
  }

  return (
    <Screen theme={theme}>
      <View style={[styles.hero, { backgroundColor: theme.surfaceMuted }]}>
        <View style={styles.heroHeader}>
          <Text style={[styles.title, { color: theme.text }]}>{recipe.title}</Text>
          <VisibilityBadge visibility={recipe.visibility} theme={theme} />
        </View>
        <Text style={[styles.description, { color: theme.textMuted }]}>{recipe.description}</Text>
        <View style={styles.statRow}>
          {recipe.servings ? (
            <Text style={[styles.stat, { color: theme.textMuted }]}>{recipe.servings}인분</Text>
          ) : null}
          <Text style={[styles.stat, { color: theme.textMuted }]}>{recipe.cookingTimeMinutes}분</Text>
          <Text style={[styles.stat, { color: theme.textMuted }]}>조회 {recipe.viewCount}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recipe.liked ? '좋아요 취소' : '좋아요'}
            disabled={isLiking}
            onPress={handleToggleLike}
            style={({ pressed }) => [styles.likeButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.stat, { color: recipe.liked ? theme.danger : theme.textMuted }]}>
              {recipe.liked ? '♥' : '♡'} {recipe.likeCount}
            </Text>
          </Pressable>
          <Text style={[styles.stat, { color: theme.textMuted }]}>공유 {recipe.shareCount}</Text>
        </View>
      </View>

      {recipe.ingredients.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>재료</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <Text key={`${ingredient}-${index}`} style={[styles.listItem, { color: theme.textMuted }]}>
              {ingredient}
            </Text>
          ))}
        </View>
      ) : null}

      {recipe.steps.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>조리 방법</Text>
          {recipe.steps.map((step, index) => (
            <View key={`${step}-${index}`} style={styles.stepRow}>
              <Text style={[styles.stepNumber, { color: theme.text }]}>{index + 1}</Text>
              <Text style={[styles.stepText, { color: theme.textMuted }]}>{step}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {isOwner ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/recipes/${recipeId}/edit`)}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surfaceMuted, opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <Text style={[styles.actionButtonText, { color: theme.text }]}>수정</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isDeleting}
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.surfaceMuted, opacity: isDeleting ? 0.5 : pressed ? 0.78 : 1 },
            ]}
          >
            <Text style={[styles.actionButtonText, { color: theme.danger }]}>
              {isDeleting ? '삭제 중...' : '삭제'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    padding: 20,
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
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
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
    width: 24,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  loader: {
    marginTop: 40,
  },
});
