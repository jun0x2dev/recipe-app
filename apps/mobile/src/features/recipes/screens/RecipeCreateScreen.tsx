import { router } from 'expo-router';
import { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { Screen } from '../../../components/Screen';
import { useAppTheme } from '../../../theme/useAppTheme';
import { RecipeDraft, RecipeVisibility } from '../types/recipe';

const initialDraft: RecipeDraft = {
  title: '',
  description: '',
  cookingTimeMinutes: '20',
  visibility: 'private',
  ingredientsText: '',
  stepsText: '',
};

export function RecipeCreateScreen() {
  const theme = useAppTheme();
  const [draft, setDraft] = useState<RecipeDraft>(initialDraft);

  const updateDraft = (nextDraft: Partial<RecipeDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...nextDraft }));
  };

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
          style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
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
            { backgroundColor: theme.input, borderColor: theme.border, color: theme.text },
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
          style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
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
                    borderColor: isSelected ? theme.primary : theme.border,
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
            { backgroundColor: theme.input, borderColor: theme.border, color: theme.text },
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
            { backgroundColor: theme.input, borderColor: theme.border, color: theme.text },
          ]}
        />
      </Field>

      <AppButton label="저장" theme={theme} onPress={saveDraft} />
    </Screen>
  );
}

type FieldProps = {
  label: string;
  themeTextColor: string;
  children: ReactNode;
};

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
    borderRadius: 8,
    borderWidth: 1,
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
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
