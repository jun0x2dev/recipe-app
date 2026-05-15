const appJson = require('./app.json');

/**
 * - Expo 설정을 런타임에 보정한다.
 * - 네이버 로그인 SDK가 설치된 개발 빌드에서는 config plugin을 자동 등록한다.
 * - SDK가 없는 브라우저/Expo Go 확인 환경에서는 plugin resolve 오류 없이 앱을 시작한다.
 */
module.exports = () => {
  const config = { ...appJson.expo };
  const plugins = [...(config.plugins ?? [])];

  try {
    require.resolve('@react-native-seoul/naver-login');
    plugins.push([
      '@react-native-seoul/naver-login',
      {
        urlScheme: 'com.leejun.recipeapp',
      },
    ]);
  } catch {
    // SDK 미설치 환경에서는 네이티브 plugin을 등록하지 않는다.
  }

  return {
    ...config,
    plugins,
  };
};
