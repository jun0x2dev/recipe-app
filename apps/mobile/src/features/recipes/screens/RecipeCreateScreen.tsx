import { router } from 'expo-router';
import { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { Screen } from '../../../components/Screen';
import { useAppTheme } from '../../../theme/useAppTheme';
import { RecipeDraft, RecipeVisibility } from '../types/recipe';

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
  ingredientsText: '',
  stepsText: '',
};

/**
 * - 레시피 작성 화면이다.
 * - 제목, 설명, 조리 시간, 공개 여부, 재료, 조리 단계를 입력받는다.
 * - 현재 저장 동작은 백엔드 연결 전 임시 안내 후 이전 화면으로 돌아간다.
 */
export function RecipeCreateScreen() {
  const theme = useAppTheme();
  const [draft, setDraft] = useState<RecipeDraft>(initialDraft);

  /**
   * - 레시피 작성 draft의 일부 필드만 갱신한다.
   * - 기존 입력값은 유지하고 변경된 값만 병합한다.
   */
  const updateDraft = (nextDraft: Partial<RecipeDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...nextDraft }));
  };

  /**
   * - 작성 폼의 최소 validation을 수행한다.
   * - 제목이 비어 있으면 저장 흐름을 중단한다.
   * - 실제 저장은 레시피 생성 API 구현 후 연결한다.
   */
  const saveDraft = () => {
    if (!draft.title.trim()) {
      Alert.alert('제목을 입력해주세요');
      return;
    }

    Alert.alert('저장 준비 완료', '백엔드 연결 후 실제 저장 기능을 붙일 예정입니다.');
    router.back();
  };

  return (
    <Screen theme={theme}>
      <Text style={[styles.title, { color: theme.text }]}>새 레시피</Text>

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

      <Field label="조리 시간" themeTextColor={theme.text}>
        <TextInput
          keyboardType="number-pad"
          placeholder="분 단위"
          placeholderTextColor={theme.textMuted}
          value={draft.cookingTimeMinutes}
          onChangeText={(cookingTimeMinutes) => updateDraft({ cookingTimeMinutes })}
          style={[styles.input, { backgroundColor: theme.surfaceMuted, color: theme.text }]}
        />
      </Field>

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

      <Field label="재료" themeTextColor={theme.text}>
        <TextInput
          multiline
          placeholder={'한 줄에 하나씩 입력\n예: 양파 1/2개'}
          placeholderTextColor={theme.textMuted}
          value={draft.ingredientsText}
          onChangeText={(ingredientsText) => updateDraft({ ingredientsText })}
          style={[
            styles.input,
            styles.multiline,
            { backgroundColor: theme.surfaceMuted, color: theme.text },
          ]}
        />
      </Field>

      <Field label="조리 단계" themeTextColor={theme.text}>
        <TextInput
          multiline
          placeholder={'한 줄에 한 단계씩 입력\n예: 팬에 기름을 두른다'}
          placeholderTextColor={theme.textMuted}
          value={draft.stepsText}
          onChangeText={(stepsText) => updateDraft({ stepsText })}
          style={[
            styles.input,
            styles.multiline,
            { backgroundColor: theme.surfaceMuted, color: theme.text },
          ]}
        />
      </Field>

      <AppButton label="저장" theme={theme} onPress={saveDraft} />
    </Screen>
  );
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

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
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
});
