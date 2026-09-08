import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

import { AppTheme, useAppTheme } from '../../../theme/useAppTheme';
import { useAuth } from '../../auth/AuthContext';
import { fetchRecipe } from '../services/recipeApi';
import { Recipe } from '../types/recipe';

const ddongCharacterLottie = require('../../../assets/DDongCharacter.json');

type RecipeCookingScreenProps = {
  recipeId?: string;
};

type CookingStage = 'onboarding1' | 'onboarding2' | 'ingredients' | 'step';

/**
 * - Rec_005 요리모드 플로우 화면이다.
 * - 음성 인식은 추후 기능으로 남기고, 현재는 하단 버튼으로 다음 단계만 진행한다.
 * - 레시피 재료/조리 단계 데이터는 상세 API를 다시 조회해 최신 값을 사용한다.
 */
export function RecipeCookingScreen({ recipeId }: RecipeCookingScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { tokenResponse } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stage, setStage] = useState<CookingStage>('onboarding1');
  const [stepIndex, setStepIndex] = useState(0);

  /**
   * - 요리모드 진입 시 레시피 상세를 조회한다.
   * - 상세 화면에서 들어오더라도 독립 라우트이므로 직접 데이터를 확보한다.
   */
  useEffect(() => {
    if (!recipeId || !tokenResponse?.accessToken) {
      setIsLoading(false);
      return;
    }

    fetchRecipe(tokenResponse.accessToken, recipeId)
      .then(setRecipe)
      .catch(() => setRecipe(null))
      .finally(() => setIsLoading(false));
  }, [recipeId, tokenResponse?.accessToken]);

  const currentStep = recipe?.steps[stepIndex] ?? '';
  const isLastStep = recipe ? stepIndex >= Math.max(recipe.steps.length - 1, 0) : false;
  const guide = getCookingGuide(stage, stepIndex, isLastStep);
  const title = getStageTitle(stage, currentStep);
  const buttonLabel = stage === 'step' && isLastStep ? '요리모드 종료' : '다음';

  /**
   * - 하단 CTA로 다음 요리모드 상태로 이동한다.
   * - 마지막 조리 단계에서는 상세 화면으로 돌아가 요리모드를 종료한다.
   */
  const handleNext = () => {
    if (stage === 'onboarding1') {
      setStage('onboarding2');
      return;
    }
    if (stage === 'onboarding2') {
      setStage('ingredients');
      return;
    }
    if (stage === 'ingredients') {
      setStage('step');
      setStepIndex(0);
      return;
    }
    if (stage === 'step' && !isLastStep) {
      setStepIndex((currentIndex) => currentIndex + 1);
      return;
    }
    router.back();
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
        <CookingHeader recipeTitle="요리모드" styles={styles} onClose={() => router.back()} />
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>레시피를 찾을 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <CookingHeader recipeTitle={recipe.title} styles={styles} onClose={() => router.back()} />
      <View style={styles.screenBody}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            stage === 'ingredients' ? styles.ingredientsContent : null,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainBlock}>
            <DdongCookingGuide speechText={guide} styles={styles} />
            <StageTitle highlightNext={stage === 'onboarding2'} styles={styles} title={title} />
          </View>

          {stage === 'ingredients' ? <IngredientChecklist ingredients={recipe.ingredients} styles={styles} /> : null}
        </ScrollView>

        {stage === 'step' && isLastStep ? (
          <View style={styles.exitHint}>
            <Text style={styles.exitHintText}>종료! 말하거나 눌러줘</Text>
            <View style={styles.exitHintTail} />
          </View>
        ) : null}
      </View>

      <View style={styles.bottomArea}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.78 : 1 }]}
          onPress={handleNext}
        >
          <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/**
 * - 요리모드 공통 헤더다.
 * - 좌측 X는 요리모드를 종료하고 상세 화면으로 돌아간다.
 */
function CookingHeader({
  onClose,
  recipeTitle,
  styles,
}: {
  onClose: () => void;
  recipeTitle: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" hitSlop={12} style={styles.headerIconButton} onPress={onClose}>
        <Ionicons name="close" size={24} color={styles.iconColor.color} />
      </Pressable>
      <Text numberOfLines={1} style={styles.headerTitle}>
        {recipeTitle}
      </Text>
      <View style={styles.headerIconButton} />
    </View>
  );
}

/**
 * - 요리모드 상단의 작은 동글이와 말풍선 영역이다.
 * - Rec_005 화면군은 큰 로티가 아니라 작은 캐릭터와 좌측 꼬리 말풍선을 사용한다.
 */
function DdongCookingGuide({
  speechText,
  styles,
}: {
  speechText: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.guideArea}>
      <LottieView
        autoPlay
        loop
        resizeMode="contain"
        source={ddongCharacterLottie}
        style={styles.guideLottie}
      />
      <View style={styles.guideBubble}>
        <Text style={styles.guideBubbleText}>{speechText}</Text>
        <View style={styles.guideBubbleTail} />
      </View>
    </View>
  );
}

/**
 * - 온보딩/재료/단계 화면의 주 문구다.
 * - 두 번째 온보딩에서는 "다음!"만 강조색으로 표시한다.
 */
function StageTitle({
  highlightNext,
  styles,
  title,
}: {
  highlightNext: boolean;
  styles: ReturnType<typeof createStyles>;
  title: string;
}) {
  if (!highlightNext) {
    return <Text style={styles.stageTitle}>{title}</Text>;
  }

  return (
    <Text style={styles.stageTitle}>
      <Text style={styles.stageTitleAccent}>다음!</Text>
      {' 이라고 외치면\n다음 단계로 넘어가요. 외쳐볼까요?'}
    </Text>
  );
}

/**
 * - 조리 전 재료 확인 리스트다.
 * - Figma의 큰 회색 패널과 20px 재료 텍스트를 따른다.
 */
function IngredientChecklist({
  ingredients,
  styles,
}: {
  ingredients: string[];
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.ingredientPanel}>
      {ingredients.map((ingredient, index) => (
        <Text key={`${ingredient}-${index}`} style={styles.ingredientText}>
          {'\u2022  '}
          {ingredient}
        </Text>
      ))}
    </View>
  );
}

function getCookingGuide(stage: CookingStage, stepIndex: number, isLastStep: boolean): string {
  if (stage === 'onboarding1') return '요리모드!';
  if (stage === 'onboarding2') return '다음! 이렇게 외쳐봐';
  if (stage === 'ingredients') return '다음! 이렇게 외쳐봐';
  if (stepIndex === 0) return '요리 시작~';
  if (isLastStep) return '우왕 맛있겠다~';
  return '언제든 ‘다음!’ 말해줘';
}

function getStageTitle(stage: CookingStage, currentStep: string): string {
  if (stage === 'onboarding1') return '손이 더러워도 걱정마세요.';
  if (stage === 'onboarding2') return '';
  if (stage === 'ingredients') return '필요한 재료를 체크해볼게요.';
  return currentStep || '조리 단계를 확인해주세요.';
}

function createStyles(theme: AppTheme) {
  const isDark = theme.mode === 'dark';
  const colors = {
    background: theme.surface,
    text: isDark ? theme.text : '#343D46',
    textMuted: isDark ? theme.textMuted : '#646D74',
    surfaceMuted: isDark ? theme.surfaceMuted : '#ECF0F4',
    button: isDark ? '#F7F8FA' : '#343D46',
    buttonText: isDark ? '#11141B' : '#FFFFFF',
    primaryAccent: '#9DA600',
    bubbleText: '#897E5B',
    exitBubble: '#EBEF93',
    exitBubbleText: '#656565',
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
    emptyText: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 33,
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
    headerTitle: {
      color: colors.text,
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 25,
      textAlign: 'center',
    },
    screenBody: {
      flex: 1,
      position: 'relative',
    },
    content: {
      flexGrow: 1,
      padding: 20,
    },
    ingredientsContent: {
      gap: 40,
    },
    mainBlock: {
      gap: 12,
      width: '100%',
    },
    guideArea: {
      height: 76,
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
    },
    guideLottie: {
      height: 108,
      left: -30,
      position: 'absolute',
      top: -27,
      width: 113,
    },
    guideBubble: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      justifyContent: 'center',
      left: 66,
      minHeight: 36,
      paddingHorizontal: 14,
      paddingVertical: 7,
      position: 'absolute',
      shadowColor: '#D2CB91',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.7,
      shadowRadius: 5,
      top: 13,
    },
    guideBubbleText: {
      color: colors.bubbleText,
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 22,
    },
    guideBubbleTail: {
      borderBottomColor: 'transparent',
      borderBottomWidth: 7,
      borderRightColor: colors.background,
      borderRightWidth: 8,
      borderTopColor: 'transparent',
      borderTopWidth: 7,
      height: 0,
      left: -6,
      position: 'absolute',
      top: 12,
      width: 0,
    },
    stageTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 33,
    },
    stageTitleAccent: {
      color: colors.primaryAccent,
    },
    ingredientPanel: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 20,
      gap: 8,
      padding: 20,
      width: '100%',
    },
    ingredientText: {
      color: colors.textMuted,
      fontSize: 20,
      fontWeight: '500',
      lineHeight: 28,
    },
    bottomArea: {
      backgroundColor: colors.background,
      padding: 20,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 20,
      height: 60,
      justifyContent: 'center',
      padding: 10,
    },
    primaryButtonText: {
      color: colors.buttonText,
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 25,
      textAlign: 'center',
    },
    exitHint: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: colors.exitBubble,
      borderRadius: 10,
      bottom: 12,
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: 14,
      paddingVertical: 7,
      position: 'absolute',
    },
    exitHintText: {
      color: colors.exitBubbleText,
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
    },
    exitHintTail: {
      borderLeftColor: 'transparent',
      borderLeftWidth: 7,
      borderRightColor: 'transparent',
      borderRightWidth: 7,
      borderTopColor: colors.exitBubble,
      borderTopWidth: 8,
      bottom: -7,
      height: 0,
      position: 'absolute',
      width: 0,
    },
    iconColor: {
      color: colors.text,
    },
  });
}
