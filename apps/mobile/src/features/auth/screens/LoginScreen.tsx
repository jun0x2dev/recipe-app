import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { Screen } from '../../../components/Screen';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useAuth } from '../AuthContext';
import { loginWithNaverAccessToken } from '../services/authApi';
import { NaverLoginError, requestNaverAccessToken } from '../services/naverLogin';

/**
 * - 앱 로그인 화면이다.
 * - 네이버 SDK에서 access token을 받은 뒤 백엔드 JWT로 교환한다.
 * - Apple과 Google 로그인 버튼은 추후 같은 화면에 확장한다.
 */
export function LoginScreen() {
  const theme = useAppTheme();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /**
   * - 브라우저 개발 확인용으로 인증 화면을 우회한다.
   * - 실제 API 인증에는 사용할 수 없는 더미 토큰만 메모리에 저장한다.
   * - 네이티브 SDK 검증 전에도 레시피 화면을 확인할 수 있게 한다.
   */
  const handleWebPreview = () => {
    signIn({
      accessToken: 'web-preview-access-token',
      refreshToken: 'web-preview-refresh-token',
      tokenType: 'Bearer',
    });
    router.replace('/');
  };

  /**
   * - 네이버 로그인 버튼 클릭 흐름을 처리한다.
   * - SDK 로그인 실패와 백엔드 교환 실패를 하나의 화면 메시지로 표시한다.
   * - 성공하면 홈 라우트로 이동해 레시피 목록을 보여준다.
   */
  const handleNaverLogin = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const naverAccessToken = await requestNaverAccessToken();
      const tokenResponse = await loginWithNaverAccessToken(naverAccessToken);

      signIn(tokenResponse);
      router.replace('/');
    } catch (error) {
      if (error instanceof NaverLoginError && error.isCancel) {
        setMessage(error.message);
      } else if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('로그인 처리 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen theme={theme}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>Recipe App</Text>
        <Text style={[styles.title, { color: theme.text }]}>로그인</Text>
        <Text style={[styles.description, { color: theme.textMuted }]}>
          네이버 계정으로 시작해 내 레시피를 안전하게 관리하세요.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          label={isLoading ? '처리 중' : '네이버로 계속하기'}
          theme={{
            ...theme,
            primary: '#03C75A',
            primaryText: '#FFFFFF',
          }}
          disabled={isLoading}
          onPress={handleNaverLogin}
        />
        {Platform.OS === 'web' ? (
          <AppButton
            label="브라우저에서 둘러보기"
            theme={theme}
            variant="secondary"
            disabled={isLoading}
            onPress={handleWebPreview}
          />
        ) : null}
        {isLoading ? <ActivityIndicator color={theme.primary} /> : null}
        {message ? <Text style={[styles.message, { color: theme.danger }]}>{message}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    paddingTop: 48,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: 14,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
});
