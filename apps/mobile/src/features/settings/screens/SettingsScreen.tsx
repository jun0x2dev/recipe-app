import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';

import { Screen } from '../../../components/Screen';
import { ThemePreference, useAppTheme, useThemePreference } from '../../../theme/useAppTheme';

/**
 * - 설정 화면에서 표시할 화면 모드 선택지다.
 * - system은 기기 설정을 따르고 light/dark는 앱 내부에서 강제 적용한다.
 */
const themeOptions: Array<{ value: ThemePreference; label: string; description: string }> = [
  { value: 'system', label: '시스템 설정', description: '기기 화면 모드를 따라갑니다' },
  { value: 'light', label: '라이트 모드', description: '밝은 화면으로 고정합니다' },
  { value: 'dark', label: '다크 모드', description: '어두운 화면으로 고정합니다' },
];

/**
 * - 앱 설정 화면이다.
 * - 화면 모드와 앱 정보를 섹션 단위로 보여준다.
 * - 메뉴 > 설정에서 진입한다.
 */
export function SettingsScreen() {
  const theme = useAppTheme();
  const { preference, setPreference } = useThemePreference();

  return (
    <Screen theme={theme}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>화면</Text>
        <View style={styles.optionList}>
          {themeOptions.map((option) => {
            const isSelected = preference === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => setPreference(option.value)}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: theme.surfaceMuted, opacity: pressed ? 0.76 : 1 },
                ]}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{option.label}</Text>
                </View>
                <Text style={[styles.check, { color: isSelected ? theme.primary : theme.textMuted }]}>
                  {isSelected ? '✓' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>앱</Text>
        <View style={[styles.row, { backgroundColor: theme.surfaceMuted }]}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: theme.text }]}>버전</Text>
          </View>
          <Text style={[styles.rowValue, { color: theme.textMuted }]}>1.0.0</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  optionList: {
    gap: 8,
  },
  row: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  check: {
    fontSize: 17,
    fontWeight: '800',
  },
});
