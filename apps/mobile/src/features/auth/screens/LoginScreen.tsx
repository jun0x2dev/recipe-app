import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../../components/AppButton';
import { DdongLottie } from '../../../components/DdongLottie';
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
 * - 피그마 Hom_000_001_로그인 디자인 기준으로 구현한다.
 * - 배경: 그라디언트 (#FBFFC0 → #FFFFFF)
 * - 상단: 타이틀 텍스트 (Pretendard Bold 28px, #464646)
 * - 중앙: 동글이 Lottie 애니메이션 (flex fill)
 * - 하단: Apple → 네이버 → Google 순서 버튼 (gap 8px, padding 20px)
 */
export function LoginScreen() {
  const theme = useAppTheme();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const useGoogleHook = useNativeGoogleLogin ?? useGoogleLoginFallback;
  const nativeGoogle = useGoogleHook();
  const lastProcessedIdToken = useRef<string | null>(null);

  /**
   * - Google OAuth redirect로 돌아온 id_token을 감지한다. (웹 전용)
   */
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleGoogleRedirect = async () => {
      try {
        const idToken = consumeGoogleRedirectIdToken();
        if (!idToken) return;

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

  /**
   * - Apple 로그인 버튼 (현재 디자인만, 기능 미구현)
   */
  const handleAppleLogin = () => {
    setMessage('Apple 로그인은 준비 중입니다.');
  };

  return (
    <LinearGradient
      colors={['#FBFFC0', '#FBFFC0', '#FFFFFF']}
      locations={[0, 0.74, 1]}
      style={styles.gradient}
    >
      <View style={styles.headerSpacer} />

      {/* 상단 컨테이너: 타이틀과 동글이 Lottie를 피그마 순서대로 배치 */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{'레시피를 기록하고\n공유해보세요'}</Text>
        <View style={styles.illustrationArea}>
          <DdongLottie style={styles.illustration} />
        </View>
      </View>

      {/* 하단: 소셜 로그인 버튼 영역 */}
      <View style={styles.actions}>
        <View>
          <SocialLoginButton provider="apple" disabled={isLoading} onPress={handleAppleLogin} />
        </View>
        <View>
          <SocialLoginButton
            provider="naver"
            disabled={isLoading}
            isLoading={isLoading}
            onPress={handleNaverLogin}
          />
        </View>
        <View>
          <SocialLoginButton provider="google" disabled={isLoading} onPress={handleGoogleLogin} />
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
        {isLoading ? <ActivityIndicator color="#464646" /> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  headerSpacer: {
    height: 100,
  },
  contentContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 20,
    paddingHorizontal: 20,
  },
  title: {
    color: '#464646',
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 39,
    textAlign: 'center',
  },
  illustrationArea: {
    alignItems: 'center',
    height: 320,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  illustration: {
    height: 320,
    width: '100%',
  },
  actions: {
    gap: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  message: {
    color: '#E94235',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
  },
});
