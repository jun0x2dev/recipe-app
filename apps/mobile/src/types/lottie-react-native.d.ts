declare module 'lottie-react-native' {
  import { ComponentType } from 'react';
  import { ImageResizeMode, StyleProp, ViewStyle } from 'react-native';

  /**
   * - lottie-react-native 설치 전 타입 체크를 통과시키기 위한 최소 선언이다.
   * - 실제 런타임 렌더링은 package.json의 lottie-react-native 설치 후 동작한다.
   */
  type LottieViewProps = {
    autoPlay?: boolean;
    loop?: boolean;
    resizeMode?: ImageResizeMode;
    source: unknown;
    style?: StyleProp<ViewStyle>;
  };

  const LottieView: ComponentType<LottieViewProps>;

  export default LottieView;
}
