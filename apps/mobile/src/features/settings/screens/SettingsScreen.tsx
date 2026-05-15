import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components/Screen';
import { useAuth } from '../../auth/AuthContext';
import { ThemePreference, useAppTheme, useThemePreference } from '../../../theme/useAppTheme';

/**
 * - 설정 화면에서 표시할 화면 모드 선택지다.
 * - system은 기기 설정을 따르고 light/dark는 앱 내부에서 강제 적용한다.
 * - 라벨은 설정 리스트 안에서 바로 이해할 수 있는 표현으로 둔다.
 */
const themeOptions: Array<{ value: ThemePreference; label: string; description: string }> = [
  { value: 'system', label: '시스템 설정', description: '기기 화면 모드를 따라갑니다' },
  { value: 'light', label: '라이트 모드', description: '밝은 화면으로 고정합니다' },
  { value: 'dark', label: '다크 모드', description: '어두운 화면으로 고정합니다' },
];

/**
 * - 앱 설정 화면이다.
 * - 계정, 화면 모드, 앱 정보를 섹션 단위로 보여준다.
 * - 화면 모드는 별도 저장소 없이 즉시 전역 테마에 반영한다.
 */
export function SettingsScreen() {
  const theme = useAppTheme();
  const { preference, setPreference } = useThemePreference();
  const { signOut } = useAuth();

  /**
   * - 현재 로그인 상태를 비우고 로그인 화면으로 이동한다.
   * - 서버 refresh token 폐기 API는 추후 로그아웃 연동 단계에서 추가한다.
   * - 지금은 클라이언트 메모리 상태를 기준으로 화면 접근을 차단한다.
   */
  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <Screen theme={theme}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>앱과 계정 관리</Text>
        <Text style={[styles.title, { color: theme.text }]}>설정</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>계정</Text>
        <SettingRow
          title="로그인 상태"
          value="소셜 계정"
          themeText={theme.text}
          themeMuted={theme.textMuted}
          themeSurface={theme.surfaceMuted}
        />
        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: theme.surfaceMuted, opacity: pressed ? 0.76 : 1 },
          ]}
        >
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: theme.text }]}>로그아웃</Text>
          </View>
          <Text style={[styles.rowValue, { color: theme.textMuted }]}>나가기</Text>
        </Pressable>
      </View>

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
        <SettingRow
          title="버전"
          value="1.0.0"
          themeText={theme.text}
          themeMuted={theme.textMuted}
          themeSurface={theme.surfaceMuted}
        />
      </View>
    </Screen>
  );
}

/**
 * - 설정 화면의 읽기 전용 행 props다.
 * - 현재 화면 내부에서만 쓰이는 단순 표시 컴포넌트다.
 * - 액션이 필요한 행은 Pressable을 직접 사용한다.
 */
type SettingRowProps = {
  title: string;
  value: string;
  themeText: string;
  themeMuted: string;
  themeSurface: string;
};

/**
 * - 설정 화면의 읽기 전용 행이다.
 * - 제목과 설명을 같은 시각 구조로 반복해 리스트 밀도를 일정하게 유지한다.
 * - 배경은 토스식 중립 회색 표면을 사용한다.
 */
function SettingRow({
  title,
  value,
  themeText,
  themeMuted,
  themeSurface,
}: SettingRowProps) {
  return (
    <View style={[styles.row, { backgroundColor: themeSurface }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: themeText }]}>{title}</Text>
      </View>
      <Text style={[styles.rowValue, { color: themeMuted }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
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
