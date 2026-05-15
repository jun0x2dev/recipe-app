import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * - Expo app config의 extra 값을 안전하게 읽기 위한 타입이다.
 * - 네이버 Client ID와 URL scheme은 공개 클라이언트 설정으로 앱에 포함한다.
 * - 네이버 Client Secret은 커밋하지 않고 환경 변수 기반 설정으로만 주입한다.
 */
type AppExtra = {
  apiBaseUrl?: string;
  naverClientId?: string;
  naverClientSecret?: string;
  naverUrlScheme?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

/**
 * - 로컬 백엔드 주소를 플랫폼별로 보정한다.
 * - Android 에뮬레이터는 호스트 PC localhost 접근에 10.0.2.2를 사용한다.
 * - 실기기 테스트에서는 EXPO_PUBLIC_API_BASE_URL로 PC의 LAN IP를 지정해야 한다.
 */
function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl;

  if (configuredUrl) {
    return Platform.OS === 'android'
      ? configuredUrl.replace('localhost', '10.0.2.2')
      : configuredUrl;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:8089' : 'http://localhost:8089';
}

/**
 * - 인증 기능에서 사용하는 런타임 설정이다.
 * - 민감한 값은 저장소에 남기지 않고 환경 변수로 덮어쓴다.
 * - 앱 출시 전 dev/prod 환경별 API 주소 분리가 필요하다.
 */
export const authConfig = {
  apiBaseUrl: resolveApiBaseUrl(),
  naverClientId: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? extra.naverClientId ?? '',
  naverClientSecret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? extra.naverClientSecret ?? '',
  naverUrlScheme: process.env.EXPO_PUBLIC_NAVER_URL_SCHEME ?? extra.naverUrlScheme ?? 'com.leejun.recipeapp',
};
