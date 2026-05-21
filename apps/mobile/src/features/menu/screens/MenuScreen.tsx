import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components/Screen';
import { useAuth } from '../../auth/AuthContext';
import { LoginProvider } from '../../auth/types/auth';
import { useAppTheme } from '../../../theme/useAppTheme';

/**
 * - 로그인 제공자별 표시 라벨이다.
 */
const providerLabel: Record<LoginProvider, string> = {
  naver: '네이버',
  google: 'Google',
  email: '이메일',
};

/**
 * - 메뉴 항목의 props다.
 * - 아이콘, 제목, 설명, 이동 경로를 받는다.
 */
type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  themeText: string;
  themeMuted: string;
  themeSurface: string;
};

/**
 * - 메뉴 화면의 단일 행 컴포넌트다.
 * - 아이콘, 제목, 설명, 화살표를 표시한다.
 */
function MenuItem({ icon, title, description, onPress, themeText, themeMuted, themeSurface }: MenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: themeSurface, opacity: pressed ? 0.76 : 1 },
      ]}
    >
      <Ionicons name={icon} size={22} color={themeText} style={styles.menuIcon} />
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, { color: themeText }]}>{title}</Text>
        <Text style={[styles.menuDescription, { color: themeMuted }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={themeMuted} />
    </Pressable>
  );
}

/**
 * - 메뉴 탭의 메인 화면이다.
 * - 계정 정보, 좋아요한 레시피, 설정 등 부가 기능으로의 진입점을 제공한다.
 * - 로그아웃 버튼도 여기에 배치한다.
 */
export function MenuScreen() {
  const theme = useAppTheme();
  const { signOut, loginProvider, email } = useAuth();

  /**
   * - 현재 로그인 상태를 비우고 로그인 화면으로 이동한다.
   */
  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <Screen theme={theme}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>나의 활동과 설정</Text>
        <Text style={[styles.title, { color: theme.text }]}>메뉴</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>계정</Text>
        <View style={[styles.accountCard, { backgroundColor: theme.surfaceMuted }]}>
          {email ? (
            <Text style={[styles.accountEmail, { color: theme.text }]}>{email}</Text>
          ) : null}
          {loginProvider ? (
            <Text style={[styles.accountProvider, { color: theme.textMuted }]}>
              {providerLabel[loginProvider]} 계정으로 로그인
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>나의 활동</Text>
        <MenuItem
          icon="heart-outline"
          title="좋아요한 레시피"
          description="내가 좋아요를 누른 레시피 모아보기"
          onPress={() => router.push('/menu/liked-recipes')}
          themeText={theme.text}
          themeMuted={theme.textMuted}
          themeSurface={theme.surfaceMuted}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>앱</Text>
        <MenuItem
          icon="settings-outline"
          title="설정"
          description="화면 모드, 앱 정보"
          onPress={() => router.push('/menu/settings')}
          themeText={theme.text}
          themeMuted={theme.textMuted}
          themeSurface={theme.surfaceMuted}
        />
      </View>

      <View style={styles.section}>
        <Pressable
          accessibilityRole="button"
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.menuItem,
            { backgroundColor: theme.surfaceMuted, opacity: pressed ? 0.76 : 1 },
          ]}
        >
          <Ionicons name="log-out-outline" size={22} color={theme.danger} style={styles.menuIcon} />
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: theme.danger }]}>로그아웃</Text>
          </View>
        </Pressable>
      </View>
    </Screen>
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
  accountCard: {
    borderRadius: 14,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '800',
  },
  accountProvider: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuItem: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 14,
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  menuDescription: {
    fontSize: 12,
    fontWeight: '600',
  },
});
