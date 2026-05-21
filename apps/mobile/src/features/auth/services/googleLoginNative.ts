import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { authConfig } from './authConfig';

/**
 * - iOS/Android에서 브라우저가 닫힌 뒤 앱으로 돌아오도록 세션을 워밍업한다.
 * - 웹에서는 호출할 필요가 없으므로 네이티브에서만 실행한다.
 */
if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

/**
 * - expo-auth-session의 Google provider를 사용해 네이티브 환경에서 id_token을 획득하는 훅이다.
 * - web client ID만으로 iOS에서도 ASWebAuthenticationSession 기반 인증이 동작한다.
 * - 인증 성공 시 id_token을 반환하며, 이를 백엔드에 전달해 JWT를 발급받는다.
 *
 * @returns promptAsync - 인증 프롬프트를 시작하는 함수
 * @returns isReady - 인증 요청이 준비되었는지 여부
 * @returns idToken - 인증 성공 시 획득한 id_token (null이면 미완료)
 */
export function useNativeGoogleLogin() {
  const [idToken, setIdToken] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: authConfig.googleWebClientId,
    iosClientId: authConfig.googleIosClientId,
  });

  /**
   * - 인증 응답이 success이면 id_token을 추출해 상태에 저장한다.
   * - dismiss나 error 응답은 무시한다. (화면에서 별도 처리)
   */
  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.params.id_token;
      if (token) {
        setIdToken(token);
      }
    }
  }, [response]);

  return {
    promptAsync,
    isReady: !!request,
    idToken,
  };
}
