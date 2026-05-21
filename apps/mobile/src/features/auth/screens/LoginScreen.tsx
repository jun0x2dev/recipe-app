import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  loadNativeGoogleLoginHook,
  NativeGoogleLoginResult,
  redirectToGoogleLogin,
} from '../services/googleLogin';
import { NaverLoginError, requestNaverAccessToken } from '../services/naverLogin';

/**
 * - 네이티브 Google 로그인 훅을 모듈 로드 시점에 한 번만 시도한다.
 * - expo-application 네이티브 모듈이 없으면 null이 되어 Google 버튼이 웹 전용으로 동작한다.
 * - npx expo run:ios로 네이티브 빌드를 갱신하면 정상 로드된다.
 */
const useNativeGoogleLogin = Platform.OS !== 'web' ? loadNativeGoogleLoginHook() : null;

/**
 * - 네이티브 Google 훅이 없을 때 사용하는 빈 폴백 훅이다.
 * - React 훅 규칙(항상 동일한 수의 훅 호출)을 지키기 위해 사용한다.
 */
function useGoogleLoginFallback(): NativeGoogleLoginResult {
  return { promptAsync: () => {}, isReady: false, idToken: null };
}

/**
 * - 앱 로그인 화면이다.
 * - 네이버 SDK에서 access token을 받은 뒤 백엔드 JWT로 교환한다.
 * - Google 로그인은 웹과 네이티브(iOS) 모두 지원한다.
 *   - 웹: redirect 방식 (기존)
 *   - 네이티브: expo-auth-session을 통한 ASWebAuthenticationSession
 * - 소셜 버튼은 각 로그인 제공자 브랜드 정책을 반영한 전용 컴포넌트를 사용한다.
 */
export function LoginScreen() {
  const theme = useAppTheme();
  const { signIn, lastLoginProvider, tokenResponse } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /**
   * - 네이티브 환경에서 expo-auth-session Google 로그인 훅을 사용한다.
   * - 네이티브 모듈이 없으면 폴백 훅을 사용해 isReady=false → Google 버튼 비활성화.
   * - React 훅 규칙을 지키기 위해 항상 동일한 훅을 호출한다.
   */
  const useGoogleHook = useNativeGoogleLogin ?? useGoogleLoginFallback;
  const nativeGoogle = useGoogleHook();

  /**
   * - 네이티브 Google 인증 성공 시 id_token이 변경되었는지 추적한다.
   */
  const lastProcessedIdToken = useRef<string | null>(null);

  /**
   * - Google OAuth redirect로 돌아온 id_token을 감지한다. (웹 전용)
   * - id_token을 백엔드에 교환해 앱 자체 JWT를 저장한다.
   * - redirect hash는 소비 후 제거해 새로고침 시 중복 로그인을 막는다.
   */
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleGoogleRedirect = async () => {
      try {
        const idToken = consumeGoogleRedirectIdToken();

        if (!idToken) {
          return;
        }

        setIsLoading(true);
        const tokenResponse = await loginWithGoogleIdToken(idToken);
        signIn(tokenResponse, 'google');
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
   * - 네이티브 Google 인증 성공 시 id_token을 백엔드에 교환한다.
   * - useNativeGoogleLogin 훅의 idToken 상태 변경을 감지해 자동 처리한다.
   */
  useEffect(() => {
    const idToken = nativeGoogle.idToken;
    if (!idToken || idToken === lastProcessedIdToken.current) return;
    lastProcessedIdToken.current = idToken;

    const exchangeToken = async () => {
      setIsLoading(true);
      setMessage(null);
      try {
        const tokenResponse = await loginWithGoogleIdToken(idToken);
        signIn(tokenResponse, 'google');
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

    exchangeToken();
  }, [nativeGoogle.idToken, signIn]);

  /**
   * - 브라우저 개발 확인용으로 인증 화면을 우회한다.
   * - 실제 API 인증에는 사용할 수 없는 더미 토큰만 메모리에 저장한다.
   */
  const handleWebPreview = () => {
    signIn(
      {
        accessToken: 'web-preview-access-token',
        refreshToken: 'web-preview-refresh-token',
        tokenType: 'Bearer',
      },
      'email',
    );
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

      signIn(tokenResponse, 'naver');
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
   * - Google 로그인 버튼 클릭 흐름을 처리한다.
   * - 웹: 브라우저 redirect 방식으로 Google 인증 화면에 이동한다.
   * - 네이티브(iOS): expo-auth-session의 promptAsync()로 in-app 브라우저를 열어 인증한다.
   * - 네이티브 모듈 미포함 시 안내 메시지를 표시한다.
   */
  const handleGoogleLogin = () => {
    setMessage(null);

    if (Platform.OS === 'web') {
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
    } else if (nativeGoogle.isReady) {
      nativeGoogle.promptAsync();
    } else {
      setMessage('Google 로그인을 사용하려면 네이티브 빌드가 필요합니다. (npx expo run:ios)');
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
        <View>
          <SocialLoginButton
            provider="naver"
            disabled={isLoading}
            isLoading={isLoading}
            onPress={handleNaverLogin}
          />
          {!tokenResponse && lastLoginProvider === 'naver' ? (
            <Text style={[styles.recentBadge, { color: theme.primary }]}>최근 로그인</Text>
          ) : null}
        </View>
        <View>
          <SocialLoginButton
            provider="google"
            disabled={isLoading}
            onPress={handleGoogleLogin}
          />
          {!tokenResponse && lastLoginProvider === 'google' ? (
            <Text style={[styles.recentBadge, { color: theme.primary }]}>최근 로그인</Text>
          ) : null}
        </View>
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
  recentBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
});
