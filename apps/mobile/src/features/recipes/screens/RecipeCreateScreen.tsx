import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import {
  recipeAiIconSvg,
  recipeCheckIconSvg,
  recipeLinkIconSvg,
  recipeWriteIconSvg,
  recipeYoutubeIconSvg,
  recipeYoutubeLogoSvg,
} from '../../../assets/recipe-create';
import { DdongLottie } from '../../../components/DdongLottie';
import { useAuth } from '../../auth/AuthContext';
import { AppTheme, useAppTheme } from '../../../theme/useAppTheme';
import { extractRecipeDraftFromYoutube, generateRecipeDraftFromQuery } from '../services/aiRecipeApi';
import { createRecipe, fetchRecipe, updateRecipe } from '../services/recipeApi';
import {
  CreateRecipeRequest,
  RecipeDraft,
  RecipeDraftIngredient,
  RecipeDraftStep,
} from '../types/recipe';

/**
 * - Figma 레시피 작성 플로우에서 사용하는 기본 draft다.
 * - 조리시간은 칩 선택값과 API 전송값을 같은 문자열로 관리한다.
 * - 재료/단계는 사용자가 바로 입력을 시작할 수 있도록 한 줄씩 둔다.
 */
const initialDraft: RecipeDraft = {
  title: '',
  description: '',
  servings: '',
  cookingTimeMinutes: '',
  visibility: 'public',
  ingredients: [{ name: '', amount: '' }],
  steps: [{ description: '' }],
};

/**
 * - 음식명 기반 자동 작성과 유튜브 링크 기반 자동 작성을 구분한다.
 * - Figma의 Rec_001, Rec_002 화면군과 1:1로 대응한다.
 */
type AiDraftMode = 'query' | 'youtube';

/**
 * - 작성 화면의 라우팅 가능한 내부 단계다.
 * - method: 작성 방식 선택
 * - auto: 유튜브/음식명 입력
 * - manual*: 직접 작성 단계
 * - review/success: 검토와 완료 상태
 */
type CreateStep = 'method' | 'auto' | 'manual1' | 'manual2' | 'manual3' | 'review' | 'success';

/**
 * - Lottie JSON 안의 내장 이미지 에셋만 읽기 위한 최소 타입이다.
 * - Lottie 렌더러가 설치되지 않은 환경에서도 캐릭터 이미지를 fallback으로 보여준다.
 */
/**
 * - 레시피 작성/수정 화면 props다.
 * - recipeId가 있으면 기존 레시피를 불러와 검토 화면에서 시작한다.
 */
type RecipeCreateScreenProps = {
  recipeId?: string;
};

const cookingTimeOptions = ['5', '15', '30', '60'];

export function RecipeCreateScreen({ recipeId }: RecipeCreateScreenProps) {
  const isEditMode = !!recipeId;
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { tokenResponse } = useAuth();
  const [draft, setDraft] = useState<RecipeDraft>(initialDraft);
  const [step, setStep] = useState<CreateStep>(isEditMode ? 'review' : 'method');
  const [aiDraftMode, setAiDraftMode] = useState<AiDraftMode>('youtube');
  const [aiDraftInput, setAiDraftInput] = useState('');
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(isEditMode);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const aiDraftAbortControllerRef = useRef<AbortController | null>(null);

  /**
   * - 수정 모드 진입 시 기존 레시피를 draft 형태로 변환한다.
   * - Figma의 04_레시피 수정 > 검토 화면처럼 먼저 전체 내용을 보여준다.
   */
  useEffect(() => {
    if (!isEditMode || !tokenResponse?.accessToken || !recipeId) return;

    fetchRecipe(tokenResponse.accessToken, recipeId)
      .then((recipe) => {
        setDraft({
          title: recipe.title,
          description: recipe.description,
          servings: recipe.servings ? String(recipe.servings) : '',
          cookingTimeMinutes: recipe.cookingTimeMinutes ? String(recipe.cookingTimeMinutes) : '',
          visibility: recipe.visibility,
          ingredients:
            recipe.ingredients.length > 0
              ? recipe.ingredients.map(splitIngredientText)
              : [{ name: '', amount: '' }],
          steps:
            recipe.steps.length > 0
              ? recipe.steps.map((description) => ({ description }))
              : [{ description: '' }],
        });
        setStep('review');
      })
      .catch(() => {
        Alert.alert('불러오기 실패', '레시피 정보를 불러올 수 없습니다.');
        router.back();
      })
      .finally(() => setIsLoadingRecipe(false));
  }, [isEditMode, tokenResponse?.accessToken, recipeId]);

  /**
   * - 화면 이탈 시 진행 중인 AI 초안 요청을 중단한다.
   * - 응답이 뒤늦게 도착해도 이미 떠난 화면의 state를 갱신하지 않게 한다.
   */
  useEffect(() => {
    return () => aiDraftAbortControllerRef.current?.abort();
  }, []);

  /**
   * - draft 일부 필드만 갱신한다.
   * - 단계 전환 중에도 입력 상태를 보존하기 위해 기존 객체와 병합한다.
   */
  const updateDraft = (nextDraft: Partial<RecipeDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...nextDraft }));
  };

  /**
   * - 재료 입력 행을 갱신한다.
   * - Figma의 재료명/계량 2개 입력칸을 같은 row state로 묶는다.
   */
  const updateIngredient = (index: number, nextIngredient: Partial<RecipeDraftIngredient>) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ingredients: currentDraft.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...nextIngredient } : ingredient,
      ),
    }));
  };

  /**
   * - 현재 재료 입력값을 칩으로 확정하고 다음 입력 행을 연다.
   * - 마지막 행이 비어 있으면 불필요한 빈 칩을 만들지 않는다.
   */
  const addIngredient = () => {
    const lastIngredient = draft.ingredients[draft.ingredients.length - 1];
    if (!lastIngredient.name.trim() && !lastIngredient.amount.trim()) return;
    setDraft((currentDraft) => ({
      ...currentDraft,
      ingredients: [...currentDraft.ingredients, { name: '', amount: '' }],
    }));
  };

  /**
   * - 특정 재료 칩/입력 행을 삭제한다.
   * - 모든 행이 삭제되어도 새 입력 행 하나는 유지한다.
   */
  const removeIngredient = (index: number) => {
    setDraft((currentDraft) => {
      const nextIngredients = currentDraft.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index);
      return { ...currentDraft, ingredients: nextIngredients.length > 0 ? nextIngredients : [{ name: '', amount: '' }] };
    });
  };

  /**
   * - 조리 단계 입력 행을 갱신한다.
   */
  const updateStep = (index: number, nextStep: Partial<RecipeDraftStep>) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      steps: currentDraft.steps.map((recipeStep, stepIndex) =>
        stepIndex === index ? { ...recipeStep, ...nextStep } : recipeStep,
      ),
    }));
  };

  /**
   * - 현재 조리 단계 입력값을 번호 칩으로 확정하고 다음 입력 행을 연다.
   */
  const addStep = () => {
    const lastStep = draft.steps[draft.steps.length - 1];
    if (!lastStep.description.trim()) return;
    setDraft((currentDraft) => ({
      ...currentDraft,
      steps: [...currentDraft.steps, { description: '' }],
    }));
  };

  /**
   * - 특정 조리 단계 칩/입력 행을 삭제한다.
   */
  const removeStep = (index: number) => {
    setDraft((currentDraft) => {
      const nextSteps = currentDraft.steps.filter((_, stepIndex) => stepIndex !== index);
      return { ...currentDraft, steps: nextSteps.length > 0 ? nextSteps : [{ description: '' }] };
    });
  };

  /**
   * - 음식명/유튜브 링크 자동 작성 요청을 실행한다.
   * - 완료 후 바로 검토 화면으로 보내 사용자가 저장 전 내용을 확인하게 한다.
   */
  const requestAiDraft = async () => {
    const trimmedInput = aiDraftInput.trim();
    if (!trimmedInput) {
      Alert.alert(aiDraftMode === 'query' ? '요리 이름을 입력해주세요' : '유튜브 링크를 입력해주세요');
      return;
    }
    if (!tokenResponse?.accessToken) {
      Alert.alert('로그인이 필요합니다', 'AI 초안 생성을 위해 먼저 로그인해주세요.');
      return;
    }

    try {
      const abortController = new AbortController();
      aiDraftAbortControllerRef.current = abortController;
      setIsExtracting(true);
      const aiDraft =
        aiDraftMode === 'query'
          ? await generateRecipeDraftFromQuery(tokenResponse.accessToken, trimmedInput, abortController.signal)
          : await extractRecipeDraftFromYoutube(tokenResponse.accessToken, trimmedInput, abortController.signal);

      if (abortController.signal.aborted) return;

      setDraft((currentDraft) => ({
        ...currentDraft,
        ...aiDraft,
        visibility: currentDraft.visibility,
      }));
      setAiDraftInput('');
      setStep('review');
    } catch (error) {
      if (isAbortError(error)) return;
      Alert.alert(
        'AI 요청 실패',
        error instanceof Error ? error.message : 'AI 레시피 추출 중 오류가 발생했습니다.',
      );
    } finally {
      aiDraftAbortControllerRef.current = null;
      setIsExtracting(false);
    }
  };

  /**
   * - 로딩 화면의 뒤로가기를 취소 동작으로 처리한다.
   * - fetch를 abort하고 사용자가 입력하던 자동 작성 화면으로 되돌린다.
   */
  const cancelAiDraftRequest = () => {
    aiDraftAbortControllerRef.current?.abort();
    aiDraftAbortControllerRef.current = null;
    setIsExtracting(false);
    setStep('auto');
  };

  /**
   * - 검토 화면에서 백엔드 생성/수정 API를 호출한다.
   * - 생성 완료 시 Figma 완료 화면을 보여주고, 수정 완료 시 이전 화면으로 돌아간다.
   */
  const saveDraft = async () => {
    if (!draft.title.trim()) {
      Alert.alert('요리 이름을 입력해주세요');
      setStep('manual1');
      return;
    }
    if (!tokenResponse?.accessToken) {
      Alert.alert('로그인이 필요합니다', '레시피를 저장하려면 먼저 로그인해주세요.');
      return;
    }

    try {
      setIsSaving(true);
      const request = toCreateRecipeRequest(normalizeDraft(draft));
      if (isEditMode && recipeId) {
        await updateRecipe(tokenResponse.accessToken, recipeId, request);
        Alert.alert('수정 완료', '레시피가 수정되었습니다.');
        router.back();
      } else {
        await createRecipe(tokenResponse.accessToken, request);
        setStep('success');
      }
    } catch (error) {
      Alert.alert(
        isEditMode ? '수정 실패' : '저장 실패',
        error instanceof Error ? error.message : '레시피 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedDraft = normalizeDraft(draft);
  const activeIngredientIndex = Math.max(draft.ingredients.length - 1, 0);
  const activeStepIndex = Math.max(draft.steps.length - 1, 0);
  const hasTitleError = titleTouched && draft.title.trim().length > 20;
  const canGoStep2 = !!draft.title.trim() && !hasTitleError;
  const canGoStep3 = normalizedDraft.ingredients.length > 0;
  const canReview = normalizedDraft.steps.length > 0;

  if (isLoadingRecipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      </SafeAreaView>
    );
  }

  if (isExtracting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <RecipeHeader styles={styles} onBackPress={cancelAiDraftRequest} />
        <View style={styles.loadingScreen}>
          <Text style={styles.loadingTitle}>멋진 요리네요!{'\n'}동글이가 레시피를 작성하고 있어요.</Text>
          <View style={styles.loadingImageArea}>
            <LoadingCharacter styles={styles} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
      >
        {step !== 'success' ? (
          <RecipeHeader
            styles={styles}
            progressStep={toProgressStep(step)}
            onBackPress={() => handleBack(step, isEditMode, setStep)}
          />
        ) : null}

        {step === 'method' ? (
          <MethodStep
            styles={styles}
            setAiDraftMode={setAiDraftMode}
            setStep={(nextStep) => {
              setDraft(initialDraft);
              setAiDraftInput('');
              setTitleTouched(false);
              setStep(nextStep);
            }}
          />
        ) : null}

        {step === 'auto' ? (
          <AutoInputStep
            aiDraftInput={aiDraftInput}
            aiDraftMode={aiDraftMode}
            setAiDraftInput={setAiDraftInput}
            styles={styles}
            onSubmit={requestAiDraft}
          />
        ) : null}

        {step === 'manual1' ? (
          <ManualStepShell
            footer={
              <BottomActions
                disabled={!canGoStep2}
                primaryLabel="다음"
                styles={styles}
                onPrimaryPress={() => {
                  setTitleTouched(true);
                  if (canGoStep2) setStep('manual2');
                }}
              />
            }
            styles={styles}
          >
            <Text style={styles.screenTitle}>요리에 대해서 알려주세요</Text>
            <InputField
              errorText={hasTitleError ? '20자 이내로 작성해 주세요' : undefined}
              isDone={!!draft.title.trim() && !hasTitleError}
              label="요리 이름"
              placeholder="예: 멋쟁이 토마토 파스타"
              styles={styles}
              value={draft.title}
              onBlur={() => setTitleTouched(true)}
              onChangeText={(title) => updateDraft({ title })}
            />
            <InputField
              isDone={!!draft.description.trim()}
              label="설명"
              placeholder="예: 달콤상큼 맛있어요"
              styles={styles}
              value={draft.description}
              onChangeText={(description) => updateDraft({ description })}
            />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>조리시간</Text>
              <View style={styles.timeGrid}>
                {cookingTimeOptions.map((minutes) => (
                  <TimeChip
                    key={minutes}
                    isSelected={draft.cookingTimeMinutes === minutes}
                    label={minutes === '60' ? '1시간 이상' : `${minutes}분`}
                    styles={styles}
                    onPress={() => updateDraft({ cookingTimeMinutes: minutes })}
                  />
                ))}
              </View>
            </View>
          </ManualStepShell>
        ) : null}

        {step === 'manual2' ? (
          <ManualStepShell
            footer={
              <BottomActions
                disabled={!canGoStep3}
                primaryLabel="다음"
                secondaryLabel="이전"
                styles={styles}
                onPrimaryPress={() => {
                  if (canGoStep3) setStep('manual3');
                }}
                onSecondaryPress={() => setStep('manual1')}
              />
            }
            styles={styles}
          >
            <Text style={styles.screenTitle}>어떤 재료가 필요한가요?</Text>
            <View style={styles.ingredientRow}>
              <View style={styles.ingredientNameField}>
                <InputField
                  isDone={!!draft.ingredients[activeIngredientIndex]?.name.trim()}
                  label={`재료 ${activeIngredientIndex + 1}`}
                  placeholder="예: 설탕"
                  styles={styles}
                  value={draft.ingredients[activeIngredientIndex]?.name ?? ''}
                  onChangeText={(name) => updateIngredient(activeIngredientIndex, { name })}
                />
              </View>
              <View style={styles.ingredientAmountField}>
                <InputField
                  isDone={!!draft.ingredients[activeIngredientIndex]?.amount.trim()}
                  label="계량"
                  placeholder="예: 2스푼"
                  styles={styles}
                  value={draft.ingredients[activeIngredientIndex]?.amount ?? ''}
                  onChangeText={(amount) => updateIngredient(activeIngredientIndex, { amount })}
                />
              </View>
            </View>
            {draft.ingredients.length > 1 ? (
              <View style={styles.chipWrap}>
                {draft.ingredients.slice(0, -1).map((ingredient, index) => (
                  <EditableChip
                    key={`ingredient-chip-${index}`}
                    label={formatIngredient(ingredient)}
                    styles={styles}
                    onRemove={() => removeIngredient(index)}
                  />
                ))}
              </View>
            ) : null}
            <AddRowButton
              active={!!draft.ingredients[activeIngredientIndex]?.name.trim() && !!draft.ingredients[activeIngredientIndex]?.amount.trim()}
              label="추가"
              styles={styles}
              onPress={addIngredient}
            />
          </ManualStepShell>
        ) : null}

        {step === 'manual3' ? (
          <ManualStepShell
            footer={
              <BottomActions
                disabled={!canReview}
                primaryLabel={isEditMode ? '수정 완료' : '완료'}
                secondaryLabel="이전"
                styles={styles}
                onPrimaryPress={() => {
                  if (canReview) setStep('review');
                }}
                onSecondaryPress={() => setStep('manual2')}
              />
            }
            styles={styles}
          >
            <Text style={styles.screenTitle}>조리 단계를 입력해주세요</Text>
            <InputField
              isDone={!!draft.steps[activeStepIndex]?.description.trim()}
              label={`${activeStepIndex + 1}단계`}
              multiline
              placeholder="예: 면을 삶아주세요"
              styles={styles}
              value={draft.steps[activeStepIndex]?.description ?? ''}
              onChangeText={(description) => updateStep(activeStepIndex, { description })}
            />
            {draft.steps.length > 1 ? (
              <View style={styles.stepChipList}>
                {draft.steps.slice(0, -1).map((recipeStep, index) => (
                  <StepChip
                    key={`step-chip-${index}`}
                    index={index}
                    label={recipeStep.description}
                    styles={styles}
                    onRemove={() => removeStep(index)}
                  />
                ))}
              </View>
            ) : null}
            <AddRowButton
              active={!!draft.steps[activeStepIndex]?.description.trim()}
              label="추가"
              styles={styles}
              onPress={addStep}
            />
          </ManualStepShell>
        ) : null}

        {step === 'review' ? (
          <ReviewStep
            draft={normalizedDraft}
            isEditMode={isEditMode}
            isSaving={isSaving}
            setStep={setStep}
            styles={styles}
            updateDraft={updateDraft}
            onSave={saveDraft}
          />
        ) : null}

        {step === 'success' ? <SuccessStep styles={styles} /> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * - 작성 방식 선택 화면이다.
 * - Figma의 Rec_000_001_Write 카드 3개를 React Native Pressable로 옮겼다.
 */
function MethodStep({
  setAiDraftMode,
  setStep,
  styles,
}: {
  setAiDraftMode: (mode: AiDraftMode) => void;
  setStep: (step: CreateStep) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>레시피를 작성할게요</Text>
      <View style={styles.methodList}>
        <MethodCard
          iconSvg={recipeYoutubeIconSvg}
          subtitle="레시피 가져오기"
          title="유튜브 링크로"
          styles={styles}
          onPress={() => {
            setAiDraftMode('youtube');
            setStep('auto');
          }}
        />
        <MethodCard
          iconSvg={recipeAiIconSvg}
          subtitle="레시피 자동 작성"
          title="요리 이름만 적고"
          styles={styles}
          onPress={() => {
            setAiDraftMode('query');
            setStep('auto');
          }}
        />
        <MethodCard
          iconSvg={recipeWriteIconSvg}
          subtitle="나만의 요리"
          title="직접 작성하기"
          styles={styles}
          onPress={() => setStep('manual1')}
        />
      </View>
    </ScrollView>
  );
}

/**
 * - 유튜브 링크/요리 제목 기반 자동 작성 입력 화면이다.
 * - 값이 입력되면 하단 CTA를 노출하는 Figma 상태를 따른다.
 */
function AutoInputStep({
  aiDraftInput,
  aiDraftMode,
  setAiDraftInput,
  styles,
  onSubmit,
}: {
  aiDraftInput: string;
  aiDraftMode: AiDraftMode;
  setAiDraftInput: (input: string) => void;
  styles: ReturnType<typeof createStyles>;
  onSubmit: () => void;
}) {
  const isYoutubeMode = aiDraftMode === 'youtube';

  return (
    <ManualStepShell
      footer={
        <BottomActions
          disabled={!aiDraftInput.trim()}
          primaryLabel="다음"
          styles={styles}
          onPrimaryPress={onSubmit}
        />
      }
      styles={styles}
    >
      {isYoutubeMode ? (
        <View style={styles.autoTitleBlock}>
          <View style={styles.autoTitleRow}>
            <Text style={styles.screenTitle}>유튜브 링크로</Text>
            <SvgXml xml={recipeYoutubeLogoSvg} width={28} height={28} />
          </View>
          <Text style={styles.screenTitle}>레시피를 요약해드릴게요!</Text>
        </View>
      ) : (
        <Text style={styles.screenTitle}>요리 이름이 뭔가요?{'\n'}레시피 초안을 작성해드릴게요</Text>
      )}
      <InputField
        autoCapitalize="none"
        leadingIconSvg={isYoutubeMode ? recipeLinkIconSvg : undefined}
        isDone={!!aiDraftInput.trim()}
        keyboardType={isYoutubeMode ? 'url' : 'default'}
        label={isYoutubeMode ? '유튜브 주소 붙여넣기' : '요리 제목'}
        placeholder={isYoutubeMode ? 'https://youtube.com/shorts/...' : '예: 프렌치토스트'}
        styles={styles}
        value={aiDraftInput}
        onChangeText={setAiDraftInput}
      />
    </ManualStepShell>
  );
}

/**
 * - 직접 작성 단계의 공통 뼈대다.
 * - 스크롤 컨텐츠와 하단 고정 CTA를 분리해 키보드 등장 시에도 구조가 유지된다.
 */
function ManualStepShell({
  children,
  footer,
  styles,
}: {
  children: ReactNode;
  footer: ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.stepShell}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

/**
 * - 작성 결과 검토 화면이다.
 * - 저장 전 공개 여부와 자동/직접 작성 결과를 한 번에 확인한다.
 */
function ReviewStep({
  draft,
  isEditMode,
  isSaving,
  setStep,
  styles,
  updateDraft,
  onSave,
}: {
  draft: RecipeDraft;
  isEditMode: boolean;
  isSaving: boolean;
  setStep: (step: CreateStep) => void;
  styles: ReturnType<typeof createStyles>;
  updateDraft: (draft: Partial<RecipeDraft>) => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.stepShell}>
      <ScrollView contentContainerStyle={styles.reviewContent}>
        <View style={styles.reviewTitleBlock}>
          <Text style={styles.reviewTitle}>{draft.title || '제목 없음'}</Text>
          <Text style={styles.reviewDescription}>{draft.description || '레시피 설명이 없습니다.'}</Text>
        </View>

        <View style={styles.ingredientPanel}>
          {draft.ingredients.map((ingredient, index) => (
            <Text key={`review-ingredient-${index}`} style={styles.ingredientText}>
              {'\u2022  '}
              {formatIngredient(ingredient)}
            </Text>
          ))}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>조리방법</Text>
          <View style={styles.reviewStepList}>
            {draft.steps.map((recipeStep, index) => (
              <View key={`review-step-${index}`} style={styles.reviewStepRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.reviewStepText}>{recipeStep.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.visibilityRow}>
        <Text style={styles.visibilityLabel}>레시피 공개</Text>
        <Switch
          ios_backgroundColor={styles.switchTrack.backgroundColor}
          thumbColor={styles.switchThumb.backgroundColor}
          trackColor={{
            false: styles.switchTrack.backgroundColor,
            true: styles.switchTrackActive.backgroundColor,
          }}
          value={draft.visibility === 'public'}
          onValueChange={(isPublic) => updateDraft({ visibility: isPublic ? 'public' : 'private' })}
        />
      </View>

      <BottomActions
        primaryLabel={isSaving ? (isEditMode ? '수정 중...' : '작성 중...') : isEditMode ? '수정 완료' : '작성 완료'}
        secondaryLabel="수정"
        styles={styles}
        onPrimaryPress={onSave}
        onSecondaryPress={() => setStep('manual1')}
      />
    </View>
  );
}

/**
 * - 레시피 저장 완료 화면이다.
 * - Figma의 Rec_001_001_Success 문구와 홈 이동 CTA를 반영한다.
 */
function SuccessStep({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.successScreen}>
      <View style={styles.successHeader} />
      <View style={styles.successContent}>
        <Text style={styles.successTitle}>레시피 등록이 완료되었어요!</Text>
        <View style={styles.successImageArea}>
          <DdongLottie speechText="얍!" style={styles.successCharacter} />
        </View>
      </View>
      <View style={styles.successBottomArea}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.successHomeButton, { opacity: pressed ? 0.78 : 1 }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.successHomeButtonText}>홈으로</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * - Rec_000_002_Loading에서 사용하는 동글이 캐릭터 영역이다.
 * - 로티는 캐릭터 애니메이션만 사용하고, 말풍선/흐릿한 배경은 TSX 공통 컴포넌트가 렌더링한다.
 */
function LoadingCharacter({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return <DdongLottie speechText="얍!" style={styles.loadingCharacter} />;
}

/**
 * - Figma 공통 상단 헤더다.
 * - 직접 작성 단계에서는 3분할 progress indicator를 함께 보여준다.
 */
function RecipeHeader({
  onBackPress,
  progressStep,
  showMore = false,
  styles,
}: {
  onBackPress: () => void;
  progressStep?: number;
  showMore?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerBar}>
        <Pressable accessibilityRole="button" hitSlop={12} style={styles.headerIconButton} onPress={onBackPress}>
          <Ionicons name="chevron-back" size={26} color={styles.iconColor.color} />
        </Pressable>
        <View style={styles.headerSpacer} />
        {showMore ? (
          <Ionicons name="ellipsis-horizontal" size={24} color={styles.iconMutedColor.color} />
        ) : (
          <View style={styles.headerIconButton} />
        )}
      </View>
      {progressStep ? (
        <View style={styles.progress}>
          {[1, 2, 3].map((index) => (
            <View
              key={`progress-${index}`}
              style={[styles.progressBar, index <= progressStep ? styles.progressBarActive : styles.progressBarInactive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * - Figma의 Search Input 컴포넌트에 해당하는 입력 필드다.
 * - 완료 상태에는 체크 아이콘을 표시해 색상만으로 상태를 구분하지 않게 한다.
 */
function InputField({
  autoCapitalize,
  errorText,
  leadingIconSvg,
  isDone = false,
  keyboardType,
  label,
  multiline = false,
  onBlur,
  onChangeText,
  placeholder,
  styles,
  value,
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  errorText?: string;
  leadingIconSvg?: string;
  isDone?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'url';
  label: string;
  multiline?: boolean;
  onBlur?: () => void;
  onChangeText: (value: string) => void;
  placeholder: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputBox, errorText ? styles.inputBoxError : null, multiline ? styles.inputBoxMultiline : null]}>
        {leadingIconSvg ? <SvgXml xml={leadingIconSvg} width={24} height={24} /> : null}
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor={styles.placeholderColor.color}
          style={[styles.textInput, multiline ? styles.multilineInput : null]}
          value={value}
          onBlur={onBlur}
          onChangeText={onChangeText}
        />
        {isDone ? <SvgXml xml={recipeCheckIconSvg} width={24} height={24} /> : null}
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

/**
 * - 조리시간 선택 칩이다.
 */
function TimeChip({
  isSelected,
  label,
  onPress,
  styles,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.timeChip,
        isSelected ? styles.timeChipSelected : null,
        { opacity: pressed ? 0.78 : 1 },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.timeChipText, isSelected ? styles.timeChipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

/**
 * - 재료와 조리 단계에서 사용하는 추가 버튼이다.
 * - active=true: 입력이 채워졌을 때 흰색 배경 + 테두리 + 진한 텍스트
 * - active=false: 비활성 반투명 배경 + 연한 텍스트
 */
function AddRowButton({
  active = false,
  label,
  onPress,
  styles,
}: {
  active?: boolean;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.addRowButton,
        active ? styles.addRowButtonActive : null,
        { opacity: pressed ? 0.78 : 1 },
      ]}
      onPress={onPress}
    >
      <Ionicons name="add" size={20} color={active ? styles.addRowIconActiveColor.color : styles.addRowIconColor.color} />
      <Text style={[styles.addRowText, active ? styles.addRowTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

/**
 * - 하단 고정 CTA 영역이다.
 * - secondary가 있으면 Figma 검토 화면처럼 좌우 버튼을 함께 배치한다.
 */
function BottomActions({
  disabled = false,
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
  styles,
}: {
  disabled?: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.bottomArea}>
      {secondaryLabel ? (
        <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={onSecondaryPress}>
          <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={({ pressed }) => [
          styles.primaryButton,
          { opacity: disabled ? 0.45 : pressed ? 0.78 : 1 },
        ]}
        onPress={onPrimaryPress}
      >
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </Pressable>
    </View>
  );
}

/**
 * - 작성 방식 선택 카드다.
 */
function MethodCard({
  iconSvg,
  onPress,
  styles,
  subtitle,
  title,
}: {
  iconSvg: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  subtitle: string;
  title: string;
}) {
  return (
    <Pressable accessibilityRole="button" style={styles.methodCard} onPress={onPress}>
      <SvgXml xml={iconSvg} width={32} height={32} />
      <View style={styles.methodText}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

/**
 * - 재료 누적 결과를 표시하는 삭제 가능한 칩이다.
 */
function EditableChip({
  label,
  onRemove,
  styles,
}: {
  label: string;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.editableChip}>
      <Text style={styles.editableChipText}>{label}</Text>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={onRemove}>
        <Ionicons name="close" size={20} color={styles.iconMutedColor.color} />
      </Pressable>
    </View>
  );
}

/**
 * - 조리 단계 누적 결과를 표시하는 번호 칩이다.
 */
function StepChip({
  index,
  label,
  onRemove,
  styles,
}: {
  index: number;
  label: string;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.stepChip}>
      <View style={styles.numberBadge}>
        <Text style={styles.numberBadgeText}>{index + 1}</Text>
      </View>
      <Text numberOfLines={1} style={styles.stepChipText}>{label}</Text>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={onRemove}>
        <Ionicons name="close" size={20} color={styles.iconMutedColor.color} />
      </Pressable>
    </View>
  );
}

/**
 * - 헤더 좌상단 뒤로가기 동작을 결정한다.
 * - method 선택 화면과 수정 모드 검토 화면에서는 화면을 닫는다.
 * - auto/manual 작성 단계에서도 화면을 닫는다. 하단에 이전 버튼이 있으므로 헤더 뒤로가기는 나가기 역할이다.
 */
function handleBack(step: CreateStep, isEditMode: boolean, _setStep: (step: CreateStep) => void) {
  if (step === 'method' || (step === 'review' && isEditMode)) {
    router.back();
    return;
  }
  // 작성 중 헤더 뒤로가기는 화면을 완전히 닫는다
  router.back();
}

function toProgressStep(step: CreateStep): number | undefined {
  if (step === 'manual1') return 1;
  if (step === 'manual2') return 2;
  if (step === 'manual3') return 3;
  return undefined;
}

function splitIngredientText(text: string): RecipeDraftIngredient {
  const [name = '', ...amountParts] = text.split(' ');
  return { name, amount: amountParts.join(' ') };
}

function normalizeDraft(draft: RecipeDraft): RecipeDraft {
  const ingredients = draft.ingredients.filter((ingredient) => ingredient.name.trim() || ingredient.amount.trim());
  const steps = draft.steps.filter((recipeStep) => recipeStep.description.trim());

  return {
    ...draft,
    ingredients: ingredients.length > 0 ? ingredients : [{ name: '', amount: '' }],
    steps: steps.length > 0 ? steps : [{ description: '' }],
  };
}

function formatIngredient(ingredient: RecipeDraftIngredient): string {
  return [ingredient.name.trim(), ingredient.amount.trim()].filter(Boolean).join(' ') || '재료 없음';
}

/**
 * - 작성 화면의 draft를 백엔드 생성/수정 API 요청으로 변환한다.
 * - 비어 있는 재료/조리 단계는 저장 요청에서 제외한다.
 */
function toCreateRecipeRequest(draft: RecipeDraft): CreateRecipeRequest {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    servings: toNullableNumber(draft.servings),
    cookingTimeMinutes: toNullableNumber(draft.cookingTimeMinutes),
    visibility: draft.visibility === 'public' ? 'PUBLIC' : 'PRIVATE',
    ingredients: draft.ingredients
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        amount: ingredient.amount.trim() || null,
      }))
      .filter((ingredient) => ingredient.name),
    steps: draft.steps
      .map((recipeStep) => ({ description: recipeStep.description.trim() }))
      .filter((recipeStep) => recipeStep.description),
  };
}

function toNullableNumber(value: string): number | null {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && value.trim() ? parsed : null;
}

/**
 * - 사용자가 로딩 화면에서 뒤로가기를 눌러 취소한 요청인지 판별한다.
 * - 취소는 실패 알림을 띄우지 않고 입력 화면으로 조용히 복귀한다.
 */
function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

function createStyles(theme: AppTheme) {
  const isDark = theme.mode === 'dark';
  const colors = {
    background: isDark ? theme.background : '#ECF0F4',
    surface: theme.surface,
    surfaceMuted: isDark ? theme.surfaceMuted : '#E4E9EE',
    text: isDark ? theme.text : '#343D46',
    textMuted: '#838A90',
    textSubtle: isDark ? '#A8B0B8' : '#646D74',
    border: isDark ? theme.border : '#E4E9EE',
    primary: isDark ? '#D7DD59' : '#C9CF4B',
    primarySoft: isDark ? 'rgba(215, 221, 89, 0.18)' : 'rgba(251, 254, 191, 0.6)',
    button: isDark ? '#F7F8FA' : '#343D46',
    buttonText: isDark ? '#11141B' : '#FFFFFF',
    danger: theme.danger,
  };

  return StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    keyboardArea: {
      flex: 1,
    },
    centerState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    header: {
      backgroundColor: colors.background,
    },
    headerBar: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 56,
      paddingHorizontal: 16,
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
    progress: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 20,
    },
    progressBar: {
      borderRadius: 99,
      flex: 1,
      height: 2,
    },
    progressBarActive: {
      backgroundColor: colors.primary,
    },
    progressBarInactive: {
      backgroundColor: colors.surfaceMuted,
    },
    stepShell: {
      flex: 1,
    },
    content: {
      gap: 32,
      padding: 20,
      paddingBottom: 32,
    },
    screenTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 31,
    },
    methodList: {
      gap: 12,
    },
    autoTitleBlock: {
      alignItems: 'flex-start',
    },
    autoTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    methodCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      flexDirection: 'row',
      gap: 12,
      minHeight: 82,
      padding: 20,
    },
    methodText: {
      flex: 1,
      gap: 2,
    },
    methodTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 25,
    },
    methodSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    field: {
      gap: 6,
    },
    fieldLabel: {
      color: colors.textSubtle,
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    inputBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: 'transparent',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      minHeight: 52,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    inputBoxError: {
      borderColor: colors.danger,
    },
    inputBoxMultiline: {
      alignItems: 'flex-start',
      minHeight: 100,
      paddingTop: 16,
    },
    textInput: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
      minHeight: 36,
      padding: 0,
    },
    multilineInput: {
      minHeight: 72,
      textAlignVertical: 'top',
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
    },
    timeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    timeChip: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: 'transparent',
      borderRadius: 8,
      borderWidth: 1,
      flexBasis: '48.75%',
      flexGrow: 1,
      height: 44,
      justifyContent: 'center',
      padding: 10,
    },
    timeChipSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    timeChipText: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '500',
    },
    timeChipTextSelected: {
      color: colors.text,
    },
    ingredientRow: {
      flexDirection: 'row',
      gap: 12,
    },
    ingredientNameField: {
      width: 200,
    },
    ingredientAmountField: {
      flex: 1,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    editableChip: {
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(228, 233, 238, 0.15)' : '#E4E9EE',
      borderColor: isDark ? theme.border : '#CED6DC',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      height: 40,
      paddingLeft: 12,
      paddingRight: 10,
    },
    editableChipText: {
      color: isDark ? '#A8B0B8' : '#646D74',
      fontSize: 16,
      fontWeight: '500',
    },
    stepChipList: {
      gap: 6,
    },
    stepChip: {
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(228, 233, 238, 0.15)' : '#E4E9EE',
      borderColor: isDark ? theme.border : '#CED6DC',
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 8,
      height: 40,
      paddingLeft: 12,
      paddingRight: 10,
    },
    stepChipText: {
      color: isDark ? '#A8B0B8' : '#646D74',
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
    },
    addRowButton: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)',
      borderColor: 'transparent',
      borderRadius: 99,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 2,
      height: 44,
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      width: 120,
    },
    addRowButtonActive: {
      backgroundColor: isDark ? theme.surface : '#FFFFFF',
      borderColor: isDark ? theme.border : '#CED6DC',
    },
    addRowText: {
      color: '#CED6DC',
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
      textAlign: 'center',
    },
    addRowTextActive: {
      color: isDark ? '#A8B0B8' : '#646D74',
    },
    addRowIconActiveColor: {
      color: isDark ? '#A8B0B8' : '#646D74',
    },
    bottomArea: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      flexDirection: 'row',
      gap: 16,
      padding: 20,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 20,
      flex: 1,
      height: 60,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    primaryButtonText: {
      color: colors.buttonText,
      fontSize: 18,
      fontWeight: '500',
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(228, 233, 238, 0.18)' : '#E4E9EE',
      borderRadius: 20,
      flex: 1,
      height: 60,
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    secondaryButtonText: {
      color: isDark ? '#A8B0B8' : '#646D74',
      fontSize: 18,
      fontWeight: '500',
    },
    reviewContent: {
      gap: 32,
      padding: 20,
      paddingBottom: 40,
    },
    reviewTitleBlock: {
      gap: 4,
    },
    reviewTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      lineHeight: 31,
    },
    reviewDescription: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
    },
    ingredientPanel: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      gap: 4,
      padding: 20,
    },
    ingredientText: {
      color: colors.textSubtle,
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    reviewSection: {
      gap: 20,
    },
    reviewSectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 25,
    },
    reviewStepList: {
      gap: 12,
    },
    reviewStepRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 8,
    },
    numberBadge: {
      alignItems: 'center',
      backgroundColor: isDark ? theme.surfaceMuted : '#FFFFFF',
      borderColor: isDark ? theme.border : '#E4E9EE',
      borderRadius: 5,
      borderWidth: 1,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    numberBadgeText: {
      color: '#8B95A1',
      fontSize: 13,
      fontWeight: '500',
    },
    reviewStepText: {
      color: colors.textMuted,
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
    },
    visibilityRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 8,
    },
    visibilityLabel: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '500',
    },
    switchTrack: {
      backgroundColor: colors.surfaceMuted,
    },
    switchTrackActive: {
      backgroundColor: colors.primary,
    },
    switchThumb: {
      backgroundColor: colors.surface,
    },
    loadingScreen: {
      alignItems: 'center',
      flex: 1,
      gap: 40,
      padding: 20,
    },
    loadingImageArea: {
      alignItems: 'center',
      alignSelf: 'stretch',
      height: 320,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    loadingCharacter: {
      height: 320,
      width: '100%',
    },
    loadingTitle: {
      alignSelf: 'stretch',
      color: colors.text,
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 31,
      textAlign: 'left',
    },
    successScreen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    successHeader: {
      height: 56,
    },
    successContent: {
      alignItems: 'center',
      flex: 1,
      gap: 40,
      padding: 20,
    },
    successImageArea: {
      alignItems: 'center',
      alignSelf: 'stretch',
      height: 320,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    successCharacter: {
      height: 320,
      width: '100%',
    },
    successBottomArea: {
      alignItems: 'center',
      backgroundColor: colors.background,
      justifyContent: 'center',
      padding: 20,
    },
    successHomeButton: {
      alignItems: 'center',
      backgroundColor: colors.button,
      borderRadius: 20,
      height: 60,
      justifyContent: 'center',
      padding: 10,
      width: '100%',
    },
    successHomeButtonText: {
      color: colors.buttonText,
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 25,
      textAlign: 'center',
    },
    successTitle: {
      alignSelf: 'stretch',
      color: colors.text,
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 31,
      textAlign: 'left',
    },
    iconColor: {
      color: colors.text,
    },
    iconMutedColor: {
      color: colors.textMuted,
    },
    addRowIconColor: {
      color: '#CED6DC',
    },
    placeholderColor: {
      color: colors.textMuted,
    },
    doneColor: {
      color: colors.primary,
    },
  });
}
