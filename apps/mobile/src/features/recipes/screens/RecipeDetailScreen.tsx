import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import {
  recipeDetailDeleteIconSvg,
  recipeDetailEditIconSvg,
  recipeDetailShareIconSvg,
} from '../../../assets/recipe-detail';
import { AppTheme, useAppTheme } from '../../../theme/useAppTheme';
import { useAuth } from '../../auth/AuthContext';
import { deleteRecipe, fetchRecipe, toggleLike } from '../services/recipeApi';
import { Recipe } from '../types/recipe';

type RecipeDetailScreenProps = {
  recipeId?: string;
};

/**
 * - Figma Rec_004 상세 화면을 기준으로 레시피 상세를 표시한다.
 * - 상단 헤더, 재료 패널, 조리 단계, 하단 고정 CTA를 한 화면 구조로 관리한다.
 * - 더보기 버튼은 공유/수정/삭제 바텀시트를 열고, 삭제는 별도 확인 모달을 거친다.
 */
export function RecipeDetailScreen({ recipeId }: RecipeDetailScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { tokenResponse, userId } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  /**
   * - 상세 화면 진입/복귀 시 최신 레시피를 다시 조회한다.
   * - 수정 화면에서 돌아왔을 때 변경된 제목/재료/단계를 즉시 반영한다.
   */
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
        likeCount: Math.max(0, liked ? recipe.likeCount + 1 : recipe.likeCount - 1),
      });
    } catch {
      // 좋아요 실패는 화면 상태를 유지한다.
    } finally {
      setIsLiking(false);
    }
  };

  /**
   * - 네이티브 공유 시트를 연다.
   * - 딥링크 정책이 확정되기 전까지는 레시피 제목/설명 텍스트 공유만 제공한다.
   */
  const handleShare = async () => {
    if (!recipe) return;
    setIsActionSheetVisible(false);
    try {
      await Share.share({
        message: [recipe.title, recipe.description].filter(Boolean).join('\n'),
        title: recipe.title,
      });
    } catch {
      Alert.alert('공유 실패', '레시피를 공유할 수 없습니다.');
    }
  };

  /**
   * - 바텀시트에서 수정 화면으로 이동한다.
   */
  const handleEdit = () => {
    if (!recipeId) return;
    setIsActionSheetVisible(false);
    router.push(`/recipes/${recipeId}/edit`);
  };

  /**
   * - 바텀시트에서 삭제 확인 모달을 연다.
   */
  const openDeleteModal = () => {
    setIsActionSheetVisible(false);
    setIsDeleteModalVisible(true);
  };

  /**
   * - 삭제 확인 모달에서 실제 삭제 API를 호출한다.
   */
  const handleDelete = async () => {
    if (!tokenResponse?.accessToken || !recipeId || isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteRecipe(tokenResponse.accessToken, recipeId);
      setIsDeleteModalVisible(false);
      router.back();
    } catch (error) {
      Alert.alert(
        '삭제 실패',
        error instanceof Error ? error.message : '레시피 삭제 중 오류가 발생했습니다.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DetailHeader styles={styles} onBackPress={() => router.back()} onMorePress={() => undefined} />
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>레시피를 찾을 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <DetailHeader
        styles={styles}
        onBackPress={() => router.back()}
        onMorePress={() => setIsActionSheetVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text numberOfLines={2} style={styles.title}>
                {recipe.title}
              </Text>
              <VisibilityPill visibility={recipe.visibility} styles={styles} />
            </View>
            {recipe.description ? <Text style={styles.description}>{recipe.description}</Text> : null}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{recipe.cookingTimeMinutes}분</Text>
            <View style={styles.dot} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={recipe.liked ? '좋아요 취소' : '좋아요'}
              disabled={isLiking}
              style={styles.likeButton}
              onPress={handleToggleLike}
            >
              <Ionicons
                name={recipe.liked ? 'heart' : 'heart-outline'}
                size={16}
                color={recipe.liked ? styles.likeActiveColor.color : styles.metaText.color}
              />
              <Text style={[styles.likeText, recipe.liked ? styles.likeTextActive : null]}>
                {recipe.likeCount}
              </Text>
            </Pressable>
          </View>
        </View>

        {recipe.ingredients.length > 0 ? (
          <View style={styles.ingredientPanel}>
            {recipe.ingredients.map((ingredient, index) => (
              <Text key={`${ingredient}-${index}`} style={styles.ingredientText}>
                {'\u2022  '}
                {ingredient}
              </Text>
            ))}
          </View>
        ) : null}

        {recipe.steps.length > 0 ? (
          <View style={styles.methodSection}>
            <Text style={styles.methodTitle}>조리방법</Text>
            <View style={styles.stepList}>
              {recipe.steps.map((step, index) => (
                <View key={`${step}-${index}`} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomArea}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.startButton, { opacity: pressed ? 0.78 : 1 }]}
          onPress={() => router.push(`/recipes/${recipe.id}/cook`)}
        >
          <Text style={styles.startButtonText}>요리 시작</Text>
        </Pressable>
      </View>

      <ActionSheet
        isOwner={isOwner}
        isVisible={isActionSheetVisible}
        styles={styles}
        onClose={() => setIsActionSheetVisible(false)}
        onDelete={openDeleteModal}
        onEdit={handleEdit}
        onShare={handleShare}
      />

      <DeleteConfirmModal
        isDeleting={isDeleting}
        isVisible={isDeleteModalVisible}
        styles={styles}
        onCancel={() => setIsDeleteModalVisible(false)}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

/**
 * - Figma Rec_004 헤더다.
 * - 왼쪽은 이전 화면, 오른쪽은 더보기 바텀시트 진입점이다.
 */
function DetailHeader({
  onBackPress,
  onMorePress,
  styles,
}: {
  onBackPress: () => void;
  onMorePress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" hitSlop={12} style={styles.headerIconButton} onPress={onBackPress}>
        <Ionicons name="chevron-back" size={26} color={styles.iconColor.color} />
      </Pressable>
      <View style={styles.headerSpacer} />
      <Pressable accessibilityRole="button" hitSlop={12} style={styles.headerIconButton} onPress={onMorePress}>
        <Ionicons name="ellipsis-horizontal" size={24} color={styles.iconMutedColor.color} />
      </Pressable>
    </View>
  );
}

/**
 * - 공개/비공개 상태 배지다.
 */
function VisibilityPill({
  styles,
  visibility,
}: {
  styles: ReturnType<typeof createStyles>;
  visibility: Recipe['visibility'];
}) {
  return (
    <View style={styles.visibilityPill}>
      <Text style={styles.visibilityPillText}>{visibility === 'public' ? '공개' : '비공개'}</Text>
    </View>
  );
}

/**
 * - 더보기 버튼에서 표시하는 하단 액션 시트다.
 * - 본인 레시피가 아니면 공유만 노출해 수정/삭제 권한 혼동을 막는다.
 */
function ActionSheet({
  isOwner,
  isVisible,
  onClose,
  onDelete,
  onEdit,
  onShare,
  styles,
}: {
  isOwner: boolean;
  isVisible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onShare: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.actionSheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <SheetAction iconSvg={recipeDetailShareIconSvg} label="공유하기" styles={styles} onPress={onShare} />
          {isOwner ? (
            <>
              <SheetAction iconSvg={recipeDetailEditIconSvg} label="수정" styles={styles} onPress={onEdit} />
              <SheetAction iconSvg={recipeDetailDeleteIconSvg} label="삭제" styles={styles} onPress={onDelete} />
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * - 바텀시트의 단일 액션 행이다.
 */
function SheetAction({
  iconSvg,
  label,
  onPress,
  styles,
}: {
  iconSvg: string;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.sheetAction, { opacity: pressed ? 0.72 : 1 }]}
      onPress={onPress}
    >
      <SvgXml xml={iconSvg} width={24} height={24} />
      <Text style={styles.sheetActionText}>{label}</Text>
    </Pressable>
  );
}

/**
 * - 삭제 전 확인 모달이다.
 * - Figma Rec_004_001_Modal의 문구와 2버튼 구조를 따른다.
 */
function DeleteConfirmModal({
  isDeleting,
  isVisible,
  onCancel,
  onDelete,
  styles,
}: {
  isDeleting: boolean;
  isVisible: boolean;
  onCancel: () => void;
  onDelete: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onCancel}>
      <View style={styles.overlayCentered}>
        <View style={styles.deleteModal}>
          <View style={styles.deleteModalTitleBlock}>
            <Text style={styles.deleteModalTitle}>레시피를 삭제할까요?</Text>
            <Text style={styles.deleteModalDescription}>삭제한 레시피는 복구할 수 없어요</Text>
          </View>
          <View style={styles.deleteModalActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isDeleting}
              style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.78 : 1 }]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.deleteButton,
                { opacity: isDeleting ? 0.5 : pressed ? 0.78 : 1 },
              ]}
              onPress={onDelete}
            >
              <Text style={styles.deleteButtonText}>{isDeleting ? '삭제 중...' : '삭제'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  const isDark = theme.mode === 'dark';
  const colors = {
    background: theme.surface,
    text: isDark ? theme.text : '#343D46',
    textMuted: '#838A90',
    textSubtle: '#9EA6AC',
    surfaceMuted: isDark ? theme.surfaceMuted : '#ECF0F4',
    chip: isDark ? '#202632' : '#E4E9EE',
    chipBorder: isDark ? theme.border : '#CED6DC',
    button: isDark ? '#F7F8FA' : '#343D46',
    buttonText: isDark ? '#11141B' : '#FFFFFF',
    overlay: 'rgba(41, 48, 56, 0.28)',
    danger: theme.danger,
  };

  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    centerState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 31,
      textAlign: 'center',
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      gap: 12,
      height: 56,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    headerIconButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    headerSpacer: {
      flex: 1,
    },
    content: {
      gap: 40,
      padding: 20,
      paddingBottom: 24,
    },
    topSection: {
      gap: 16,
    },
    titleBlock: {
      gap: 4,
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    title: {
      color: colors.text,
      flexShrink: 1,
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 31,
    },
    visibilityPill: {
      alignItems: 'center',
      backgroundColor: colors.chip,
      borderColor: colors.chipBorder,
      borderRadius: 6,
      borderWidth: 1,
      justifyContent: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    visibilityPillText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 16,
    },
    description: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
    },
    metaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    timeText: {
      color: colors.textSubtle,
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 16,
    },
    dot: {
      backgroundColor: colors.textSubtle,
      borderRadius: 1,
      height: 2,
      width: 2,
    },
    likeButton: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 1,
    },
    likeText: {
      color: colors.textSubtle,
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 16,
    },
    likeTextActive: {
      color: '#C81313',
    },
    ingredientPanel: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 20,
      gap: 4,
      padding: 20,
      width: '100%',
    },
    ingredientText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    methodSection: {
      gap: 20,
    },
    methodTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 25,
    },
    stepList: {
      gap: 12,
    },
    stepRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 8,
    },
    stepBadge: {
      alignItems: 'center',
      backgroundColor: colors.chip,
      borderColor: colors.chipBorder,
      borderRadius: 5,
      borderWidth: 1,
      height: 20,
      justifyContent: 'center',
      marginTop: 2,
      width: 20,
    },
    stepBadgeText: {
      color: '#8B95A1',
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      textAlign: 'center',
    },
    stepText: {
      color: colors.textMuted,
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
    },
    bottomArea: {
      backgroundColor: colors.background,
      padding: 20,
    },
    startButton: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 20,
      height: 60,
      justifyContent: 'center',
      padding: 10,
    },
    startButtonText: {
      color: colors.buttonText,
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 25,
      textAlign: 'center',
    },
    overlay: {
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'flex-end',
      paddingBottom: 12,
      paddingHorizontal: 12,
    },
    overlayCentered: {
      alignItems: 'center',
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    actionSheet: {
      backgroundColor: colors.background,
      borderRadius: 20,
      overflow: 'hidden',
      paddingBottom: 12,
      width: '100%',
    },
    sheetHandle: {
      alignSelf: 'center',
      backgroundColor: '#DADCDE',
      borderRadius: 99,
      height: 4,
      marginBottom: 4,
      marginTop: 8,
      width: 52,
    },
    sheetAction: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      minHeight: 48,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    sheetActionText: {
      color: colors.text,
      flex: 1,
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 25,
    },
    deleteModal: {
      backgroundColor: colors.background,
      borderRadius: 20,
      gap: 23,
      padding: 20,
      width: '100%',
    },
    deleteModalTitleBlock: {
      gap: 8,
    },
    deleteModalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    deleteModalDescription: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
    },
    deleteModalActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 16,
    },
    cancelButton: {
      alignItems: 'center',
      backgroundColor: colors.chip,
      borderRadius: 16,
      flex: 1,
      height: 52,
      justifyContent: 'center',
      minWidth: 100,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    cancelButtonText: {
      color: '#646D74',
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
      textAlign: 'center',
    },
    deleteButton: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 16,
      flex: 1,
      height: 52,
      justifyContent: 'center',
      minWidth: 100,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    deleteButtonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
      textAlign: 'center',
    },
    iconColor: {
      color: colors.text,
    },
    iconMutedColor: {
      color: colors.textMuted,
    },
    metaText: {
      color: colors.textSubtle,
    },
    likeActiveColor: {
      color: '#C81313',
    },
  });
}
