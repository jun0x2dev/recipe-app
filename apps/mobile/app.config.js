const appJson = require('./app.json');

/**
 * Expo 설정을 런타임에 보정한다.
 * - app.json의 정적 설정을 기반으로, 환경 변수(.env)에서 민감한 값을 주입한다.
 * - 네이버 로그인 SDK가 설치된 개발 빌드에서는 config plugin을 자동 등록한다.
 * - SDK가 없는 브라우저/Expo Go 확인 환경에서는 plugin resolve 오류 없이 앱을 시작한다.
 */
module.exports = () => {
  const config = { ...appJson.expo };
  const plugins = [...(config.plugins ?? [])];

  /** 환경 변수 기반 extra 값 주입 */
  config.extra = {
    ...(config.extra ?? {}),
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8089',
    naverClientId: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '',
    naverUrlScheme: process.env.EXPO_PUBLIC_NAVER_URL_SCHEME ?? 'com.leejun.recipeapp',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  };

  try {
    require.resolve('@react-native-seoul/naver-login');
    plugins.push([
      '@react-native-seoul/naver-login',
      {
        urlScheme: config.extra.naverUrlScheme,
      },
    ]);
  } catch {
    // SDK 미설치 환경에서는 네이티브 plugin을 등록하지 않는다.
  }

  plugins.push('expo-web-browser');

  return {
    ...config,
    plugins,
  };
};
