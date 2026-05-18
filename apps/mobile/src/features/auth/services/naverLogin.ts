import NaverLoginSDK from '@react-native-seoul/naver-login';

import { authConfig } from './authConfig';

export class NaverLoginError extends Error {
  constructor(
    message: string,
    readonly isCancel = false,
  ) {
    super(message);
  }
}

export async function requestNaverAccessToken(): Promise<string> {
  if (!authConfig.naverClientId || !authConfig.naverClientSecret) {
    throw new NaverLoginError('네이버 Client ID 또는 Client Secret 설정이 없습니다.');
  }

  NaverLoginSDK.initialize({
    consumerKey: authConfig.naverClientId,
    consumerSecret: authConfig.naverClientSecret,
    appName: 'Recipe App',
    serviceUrlSchemeIOS: authConfig.naverUrlScheme,
  });

  const response = await NaverLoginSDK.login();

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
