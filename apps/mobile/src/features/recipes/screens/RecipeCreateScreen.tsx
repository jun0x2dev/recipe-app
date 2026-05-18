import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../auth/AuthContext';
import { AppTheme, useAppTheme } from '../../../theme/useAppTheme';
import { extractRecipeDraftFromYoutube } from '../services/aiRecipeApi';
import { createRecipe } from '../services/recipeApi';
import {
  CreateRecipeRequest,
  RecipeDraft,
  RecipeDraftIngredient,
  RecipeDraftStep,
  RecipeVisibility,
} from '../types/recipe';

/**
 * - 새 레시피 입력 폼의 초기 상태다.
 * - MVP 작성 화면에서 필요한 최소 필드만 포함한다.
 * - 백엔드 저장 API 연결 전까지는 화면 상태 검증 용도로 사용한다.
 */
const initialDraft: RecipeDraft = {
  title: '',
  description: '',
  cookingTimeMinutes: '20',
  visibility: 'private',
  ingredients: [{ name: '', amount: '' }],
  steps: [{ description: '' }],
};

/**
 * - 레시피 작성 화면이다.
 * - 제목, 설명, 조리 시간, 공개 여부, 재료, 조리 단계를 입력받는다.
 * - 현재 저장 동작은 백엔드 연결 전 임시 안내 후 이전 화면으로 돌아간다.
 */
export function RecipeCreateScreen() {
  const theme = useAppTheme();
  const { tokenResponse } = useAuth();
  const [draft, setDraft] = useState<RecipeDraft>(initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  /**
   * - 레시피 작성 draft의 일부 필드만 갱신한다.
   * - 기존 입력값은 유지하고 변경된 값만 병합한다.
   */
  const updateDraft = (nextDraft: Partial<RecipeDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...nextDraft }));
  };

  /**
   * - 특정 재료 행의 일부 필드를 갱신한다.
   * - 배열을 새로 만들어 React state 변경을 안정적으로 반영한다.
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
   * - 재료 입력 행을 하나 추가한다.
   */
  const addIngredient = () => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ingredients: [...currentDraft.ingredients, { name: '', amount: '' }],
    }));
  };

  /**
   * - 특정 재료 입력 행을 삭제한다.
   * - 최소 한 행은 남겨 사용자가 바로 입력을 이어갈 수 있게 한다.
   */
  const removeIngredient = (index: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ingredients:
        currentDraft.ingredients.length === 1
          ? [{ name: '', amount: '' }]
          : currentDraft.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }));
  };

  /**
   * - 특정 조리 단계 행의 설명을 갱신한다.
   */
  const updateStep = (index: number, nextStep: Partial<RecipeDraftStep>) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      steps: currentDraft.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...nextStep } : step,
      ),
    }));
  };

  /**
   * - 조리 단계 입력 행을 하나 추가한다.
   */
  const addStep = () => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      steps: [...currentDraft.steps, { description: '' }],
    }));
  };

  /**
   * - 특정 조리 단계 행을 삭제한다.
   * - 최소 한 행은 남겨 작성 화면이 빈 상태로 무너지지 않게 한다.
   */
  const removeStep = (index: number) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      steps:
        currentDraft.steps.length === 1
          ? [{ description: '' }]
          : currentDraft.steps.filter((_, stepIndex) => stepIndex !== index),
    }));
  };

  /**
   * - 작성 폼의 최소 validation을 수행한다.
   * - 제목이 비어 있으면 저장 흐름을 중단한다.
   * - 로그인 토큰이 있으면 백엔드 레시피 생성 API로 저장한다.
   */
  const saveDraft = async () => {
    if (!draft.title.trim()) {
      Alert.alert('제목을 입력해주세요');
      return;
    }

    if (!tokenResponse?.accessToken) {
      Alert.alert('로그인이 필요합니다', '레시피를 저장하려면 먼저 로그인해주세요.');
      return;
    }

    try {
      setIsSaving(true);
      await createRecipe(tokenResponse.accessToken, toCreateRecipeRequest(draft));
      Alert.alert('저장 완료', '레시피가 저장되었습니다.');
      router.back();
    } catch (error) {
      Alert.alert(
        '저장 실패',
        error instanceof Error ? error.message : '레시피 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * - 유튜브 쇼츠 링크를 AI Worker에 보내 레시피 초안을 가져온다.
   * - 받은 초안은 작성 폼에 채우고 사용자가 저장 전에 검토/수정하게 한다.
   */
  const requestAiDraft = async () => {
    const trimmedUrl = youtubeUrl.trim();

    if (!trimmedUrl) {
      Alert.alert('유튜브 링크를 입력해주세요');
      return;
    }

    try {
      setIsExtracting(true);
      const aiDraft = await extractRecipeDraftFromYoutube(trimmedUrl);
      setDraft((currentDraft) => ({
        ...currentDraft,
        ...aiDraft,
        visibility: currentDraft.visibility,
      }));
      setIsAiModalVisible(false);
      setYoutubeUrl('');
      Alert.alert('AI 초안 생성 완료', '내용을 확인하고 필요한 부분을 수정해주세요.');
    } catch (error) {
      Alert.alert(
        'AI 요청 실패',
        error instanceof Error ? error.message : 'AI 레시피 추출 중 오류가 발생했습니다.',
      );
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Screen theme={theme}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>레시피 작성</Text>
        <Text style={[styles.title, { color: theme.text }]}>새 레시피</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isExtracting}
        onPress={() => setIsAiModalVisible(true)}
        style={({ pressed }) => [
          styles.aiPanel,
          {
            backgroundColor: theme.surfaceMuted,
            borderColor: theme.border,
            opacity: isExtracting ? 0.55 : pressed ? 0.78 : 1,
          },
        ]}
      >
        <View style={[styles.aiIcon, { backgroundColor: theme.primary }]}>
          <Ionicons name="sparkles" size={18} color={theme.primaryText} />
        </View>
        <View style={styles.aiPanelText}>
          <Text style={[styles.aiTitle, { color: theme.text }]}>AI 초안 만들기</Text>
          <Text style={[styles.aiSubtitle, { color: theme.textMuted }]}>YouTube Shorts URL</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      </Pressable>

      <Section title="기본 정보" themeTextColor={theme.text}>
        <Field label="제목" themeTextColor={theme.text}>
          <TextInput
            placeholder="예: 간단한 토마토 파스타"
            placeholderTextColor={theme.textMuted}
            value={draft.title}
            onChangeText={(title) => updateDraft({ title })}
            style={[styles.input, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
          />
        </Field>

        <Field label="설명" themeTextColor={theme.text}>
          <TextInput
            multiline
            placeholder="레시피를 짧게 설명해주세요"
            placeholderTextColor={theme.textMuted}
            value={draft.description}
            onChangeText={(description) => updateDraft({ description })}
            style={[
              styles.input,
              styles.multiline,
              { backgroundColor: theme.surfaceMuted, color: theme.text },
            ]}
          />
        </Field>

        <View style={styles.basicRow}>
          <View style={styles.basicRowItem}>
            <Field label="조리 시간" themeTextColor={theme.text}>
              <TextInput
                keyboardType="number-pad"
                placeholder="분"
                placeholderTextColor={theme.textMuted}
                value={draft.cookingTimeMinutes}
                onChangeText={(cookingTimeMinutes) => updateDraft({ cookingTimeMinutes })}
                style={[styles.input, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
              />
            </Field>
          </View>

          <View style={styles.basicRowItem}>
            <Field label="공개 여부" themeTextColor={theme.text}>
              <View style={styles.segment}>
                {(['private', 'public'] as RecipeVisibility[]).map((visibility) => {
                  const isSelected = draft.visibility === visibility;

                  return (
                    <Pressable
                      key={visibility}
                      accessibilityRole="button"
                      onPress={() => updateDraft({ visibility })}
                      style={[
                        styles.segmentItem,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.surfaceMuted,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          { color: isSelected ? theme.primaryText : theme.text },
                        ]}
                      >
                        {visibility === 'public' ? '공개' : '비공개'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
          </View>
        </View>
      </Section>

      <Section
        title="재료"
        themeTextColor={theme.text}
        action={<IconTextButton label="추가" iconName="add" theme={theme} onPress={addIngredient} />}
      >
        <View style={styles.repeatList}>
          {draft.ingredients.map((ingredient, index) => (
            <View
              key={`ingredient-${index}`}
              style={[styles.itemCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
            >
              <View style={styles.itemCardHeader}>
                <Text style={[styles.itemCardTitle, { color: theme.text }]}>재료 {index + 1}</Text>
                <IconButton iconName="trash-outline" theme={theme} onPress={() => removeIngredient(index)} />
              </View>
              <View style={styles.ingredientFields}>
                <TextInput
                  placeholder="재료명"
                  placeholderTextColor={theme.textMuted}
                  value={ingredient.name}
                  onChangeText={(name) => updateIngredient(index, { name })}
                  style={[
                    styles.input,
                    styles.ingredientNameInput,
                    { backgroundColor: theme.surface, color: theme.text },
                  ]}
                />
                <TextInput
                  placeholder="계량"
                  placeholderTextColor={theme.textMuted}
                  value={ingredient.amount}
                  onChangeText={(amount) => updateIngredient(index, { amount })}
                  style={[
                    styles.input,
                    styles.amountInput,
                    { backgroundColor: theme.surface, color: theme.text },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </Section>

      <Section
        title="조리 단계"
        themeTextColor={theme.text}
        action={<IconTextButton label="추가" iconName="add" theme={theme} onPress={addStep} />}
      >
        <View style={styles.repeatList}>
          {draft.steps.map((step, index) => (
            <View
              key={`step-${index}`}
              style={[styles.itemCard, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
            >
              <View style={styles.stepCardHeader}>
                <View style={[styles.stepBadge, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.stepBadgeText, { color: theme.primaryText }]}>{index + 1}</Text>
                </View>
                <IconButton iconName="trash-outline" theme={theme} onPress={() => removeStep(index)} />
              </View>
              <TextInput
                multiline
                placeholder="조리 단계를 입력해주세요"
                placeholderTextColor={theme.textMuted}
                value={step.description}
                onChangeText={(description) => updateStep(index, { description })}
                style={[
                  styles.input,
                  styles.stepInput,
                  { backgroundColor: theme.surface, color: theme.text },
                ]}
              />
            </View>
          ))}
        </View>
      </Section>

      <AppButton
        label={isSaving ? '작성 중...' : '작성 완료'}
        theme={theme}
        disabled={isSaving}
        onPress={saveDraft}
      />

      <Modal
        animationType="fade"
        transparent
        visible={isAiModalVisible}
        onRequestClose={() => setIsAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>유튜브 쇼츠로 작성</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://youtube.com/shorts/..."
              placeholderTextColor={theme.textMuted}
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              style={[styles.input, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
            />
            <View style={styles.modalActions}>
              <AppButton
                label="취소"
                theme={theme}
                variant="secondary"
                disabled={isExtracting}
                onPress={() => setIsAiModalVisible(false)}
              />
              <AppButton
                label={isExtracting ? '생성 중...' : '초안 생성'}
                theme={theme}
                disabled={isExtracting}
                onPress={requestAiDraft}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

/**
 * - 작성 화면의 draft를 백엔드 생성 API 요청으로 변환한다.
 * - 빈 재료/단계 행은 저장 요청에서 제외한다.
 */
function toCreateRecipeRequest(draft: RecipeDraft): CreateRecipeRequest {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    cookingTimeMinutes: toNullableNumber(draft.cookingTimeMinutes),
    visibility: draft.visibility === 'public' ? 'PUBLIC' : 'PRIVATE',
    ingredients: draft.ingredients
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        amount: ingredient.amount.trim() || null,
      }))
      .filter((ingredient) => ingredient.name),
    steps: draft.steps
      .map((step) => ({ description: step.description.trim() }))
      .filter((step) => step.description),
  };
}

/**
 * - 조리 시간 TextInput 값을 nullable number로 변환한다.
 */
function toNullableNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * - 입력 필드의 라벨과 컨텐츠를 묶는 내부 컴포넌트 props다.
 * - 화면 단위에서만 사용하므로 별도 공용 컴포넌트로 분리하지 않는다.
 */
type FieldProps = {
  label: string;
  themeTextColor: string;
  children: ReactNode;
};

/**
 * - 작성 화면의 주요 섹션 props다.
 * - action은 섹션 우측에 놓을 작은 추가 버튼 같은 보조 액션이다.
 */
type SectionProps = {
  title: string;
  themeTextColor: string;
  action?: ReactNode;
  children: ReactNode;
};

/**
 * - 작성 화면의 섹션 레이아웃이다.
 * - 섹션 자체는 카드로 감싸지 않고 제목과 입력 그룹만 묶어 화면 밀도를 낮춘다.
 */
function Section({ title, themeTextColor, action, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: themeTextColor }]}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

/**
 * - 레시피 작성 화면의 단일 입력 필드 레이아웃이다.
 * - 라벨 색상은 현재 테마의 텍스트 색상을 따른다.
 * - children으로 TextInput, segmented control 같은 입력 UI를 받는다.
 */
function Field({ label, themeTextColor, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: themeTextColor }]}>{label}</Text>
      {children}
    </View>
  );
}

/**
 * - 아이콘과 짧은 텍스트를 함께 보여주는 보조 액션 버튼이다.
 */
type IconTextButtonProps = {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  theme: AppTheme;
  onPress: () => void;
};

/**
 * - 섹션 우측의 작은 추가 버튼이다.
 */
function IconTextButton({ label, iconName, theme, onPress }: IconTextButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconTextButton,
        { backgroundColor: theme.surfaceMuted, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <Ionicons name={iconName} size={16} color={theme.text} />
      <Text style={[styles.iconTextButtonLabel, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * - 반복 카드에서 사용하는 아이콘 전용 버튼 props다.
 */
type IconButtonProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  theme: AppTheme;
  onPress: () => void;
};

/**
 * - 삭제 같은 반복 액션을 compact하게 보여주는 아이콘 버튼이다.
 */
function IconButton({ iconName, theme, onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconOnlyButton,
        { backgroundColor: theme.surface, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <Ionicons name={iconName} size={18} color={theme.danger} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'stretch',
    gap: 6,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  aiPanel: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    padding: 16,
  },
  aiIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  aiPanelText: {
    flex: 1,
    gap: 3,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  aiSubtitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    borderRadius: 14,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  basicRow: {
    flexDirection: 'row',
    gap: 10,
  },
  basicRowItem: {
    flex: 1,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  repeatList: {
    gap: 10,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  itemCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  ingredientFields: {
    flexDirection: 'row',
    gap: 8,
  },
  ingredientNameInput: {
    flex: 1.4,
  },
  amountInput: {
    flex: 1,
  },
  stepCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepBadge: {
    alignItems: 'center',
    borderRadius: 12,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepBadgeText: {
    fontSize: 14,
    fontWeight: '900',
  },
  stepInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  iconTextButton: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 12,
  },
  iconTextButtonLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  iconOnlyButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    gap: 14,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalActions: {
    gap: 10,
  },
});
