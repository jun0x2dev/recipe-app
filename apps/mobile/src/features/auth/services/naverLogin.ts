import { authConfig } from './authConfig';

/**
 * - @react-native-seoul/naver-login의 최소 사용 형태를 앱 내부 타입으로 정의한다.
 * - 패키지를 아직 설치하지 않은 상태에서도 TypeScript 컴파일이 깨지지 않게 분리한다.
 * - 실제 dev build에서는 동일한 API를 제공하는 네이티브 모듈이 런타임에 로드된다.
 */
type NaverLoginModule = {
  initialize: (params: {
    consumerKey: string;
    consumerSecret: string;
    appName: string;
    serviceUrlSchemeIOS: string;
  }) => void;
  login: () => Promise<NaverLoginResponse>;
};

/**
 * - 네이버 네이티브 SDK 로그인 결과 중 access token만 사용한다.
 * - refresh token은 앱 서버 정책상 저장하지 않고 네이버 재로그인에 맡긴다.
 * - 사용자가 취소한 경우에는 일반 실패와 구분해 메시지를 만든다.
 */
type NaverLoginResponse = {
  isSuccess: boolean;
  successResponse?: {
    accessToken: string;
  };
  failureResponse?: {
    message?: string;
    isCancel?: boolean;
  };
};

/**
 * - 네이버 로그인 실패를 화면에서 표시하기 위한 도메인 오류다.
 * - isCancel이 true면 사용자가 로그인 창을 닫은 정상 취소로 볼 수 있다.
 */
export class NaverLoginError extends Error {
  constructor(
    message: string,
    readonly isCancel = false,
  ) {
    super(message);
  }
}

/**
 * - 네이버 네이티브 모듈을 런타임에 로드한다.
 * - Expo Go나 패키지 미설치 상태에서는 null을 반환해 안내 메시지로 전환한다.
 * - 정적 import를 피해서 현재 저장소의 타입체크와 번들 분석이 막히지 않게 한다.
 */
function loadNaverLoginModule(): NaverLoginModule | null {
  try {
    const metroRequire = eval('require') as (moduleName: string) => unknown;
    return metroRequire('@react-native-seoul/naver-login') as NaverLoginModule;
  } catch {
    return null;
  }
}

/**
 * - 네이버 SDK를 초기화하고 로그인 창을 연다.
 * - 성공하면 네이버 access token만 반환하고 백엔드 교환은 호출자가 수행한다.
 * - Client Secret은 저장소에 커밋하지 않고 환경 변수로 제공해야 한다.
 */
export async function requestNaverAccessToken(): Promise<string> {
  const naverLogin = loadNaverLoginModule();

  if (!naverLogin) {
    throw new NaverLoginError(
      '네이버 로그인 SDK가 설치된 개발 빌드에서만 사용할 수 있습니다.',
    );
  }

  if (!authConfig.naverClientId || !authConfig.naverClientSecret) {
    throw new NaverLoginError('네이버 Client ID 또는 Client Secret 설정이 없습니다.');
  }

  naverLogin.initialize({
    consumerKey: authConfig.naverClientId,
    consumerSecret: authConfig.naverClientSecret,
    appName: 'Recipe App',
    serviceUrlSchemeIOS: authConfig.naverUrlScheme,
  });

  const response = await naverLogin.login();

  if (!response.isSuccess || !response.successResponse?.accessToken) {
    throw new NaverLoginError(
      response.failureResponse?.isCancel
        ? '네이버 로그인이 취소되었습니다.'
        : response.failureResponse?.message ?? '네이버 로그인에 실패했습니다.',
      response.failureResponse?.isCancel ?? false,
    );
  }

  return response.successResponse.accessToken;
}
