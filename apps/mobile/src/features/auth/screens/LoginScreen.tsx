import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { Screen } from '../../../components/Screen';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useAuth } from '../AuthContext';
import { SocialLoginButton } from '../components/SocialLoginButton';
import { loginWithGoogleIdToken, loginWithNaverAccessToken } from '../services/authApi';
import {
  consumeGoogleRedirectIdToken,
  GoogleLoginError,
  redirectToGoogleLogin,
} from '../services/googleLogin';
import { NaverLoginError, requestNaverAccessToken } from '../services/naverLogin';

/**
 * - 앱 로그인 화면이다.
 * - 네이버 SDK에서 access token을 받은 뒤 백엔드 JWT로 교환한다.
 * - 소셜 버튼은 각 로그인 제공자 브랜드 정책을 반영한 전용 컴포넌트를 사용한다.
 */
export function LoginScreen() {
  const theme = useAppTheme();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /**
   * - Google OAuth redirect로 돌아온 id_token을 감지한다.
   * - id_token을 백엔드에 교환해 앱 자체 JWT를 저장한다.
   * - redirect hash는 소비 후 제거해 새로고침 시 중복 로그인을 막는다.
   */
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      try {
        const idToken = consumeGoogleRedirectIdToken();

        if (!idToken) {
          return;
        }

        setIsLoading(true);
        const tokenResponse = await loginWithGoogleIdToken(idToken);
        signIn(tokenResponse);
        router.replace('/');
      } catch (error) {
        if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage('Google 로그인 처리 중 알 수 없는 오류가 발생했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    handleGoogleRedirect();
  }, [signIn]);

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

  /**
   * - 브라우저에서 Google OAuth 로그인 화면으로 이동한다.
   * - 실제 토큰 검증과 앱 JWT 발급은 redirect 후 useEffect에서 처리한다.
   * - 네이티브 iOS 검증은 추후 iOS Client ID와 dev build에서 확장한다.
   */
  const handleGoogleLogin = () => {
    setMessage(null);

    try {
      redirectToGoogleLogin();
    } catch (error) {
      if (error instanceof GoogleLoginError) {
        setMessage(error.message);
      } else if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Google 로그인 시작 중 알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  return (
    <Screen theme={theme}>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.logoText, { color: theme.text }]}>R</Text>
        </View>
        <Text style={[styles.kicker, { color: theme.textMuted }]}>Recipe App</Text>
        <Text style={[styles.title, { color: theme.text }]}>내 레시피를 가볍게 기록하세요</Text>
        <Text style={[styles.description, { color: theme.textMuted }]}>
          소셜 계정으로 시작하고, 내가 만든 요리를 한 곳에서 관리하세요.
        </Text>
      </View>

      <View style={styles.actions}>
        <SocialLoginButton
          provider="naver"
          disabled={isLoading}
          isLoading={isLoading}
          onPress={handleNaverLogin}
        />
        {Platform.OS === 'web' ? (
          <SocialLoginButton
            provider="google"
            disabled={isLoading}
            onPress={handleGoogleLogin}
          />
        ) : null}
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
    gap: 10,
    paddingTop: 56,
  },
  logo: {
    alignItems: 'center',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    marginBottom: 10,
    width: 56,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 42,
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
