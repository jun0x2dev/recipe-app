import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

const ddongCharacterLottie = require('../assets/DDongCharacter.json');

type DdongLottieProps = {
  speechText?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * - 동글이 Lottie를 앱 화면에서 공통으로 렌더링한다.
 * - lottie-react-native iOS 렌더러가 Gaussian Blur와 텍스트를 미리보기처럼 처리하지 못해
 *   원본 JSON에서 배경 blur 원과 말풍선을 제거한 파생 JSON을 사용한다.
 * - 흐릿한 배경과 말풍선 문구는 TSX/SVG로 그려 화면별 크기와 텍스트를 제어한다.
 */
export function DdongLottie({ speechText = '나는 동글이야!', style }: DdongLottieProps) {
  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      <Svg height="100%" style={styles.glow} viewBox="0 0 335 320" width="100%">
        <Defs>
          <RadialGradient id="peachGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFC59F" stopOpacity="0.52" />
            <Stop offset="58%" stopColor="#FFC59F" stopOpacity="0.20" />
            <Stop offset="100%" stopColor="#FFC59F" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="yellowGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#F5FF40" stopOpacity="0.55" />
            <Stop offset="58%" stopColor="#F5FF40" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#F5FF40" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="128" cy="164" fill="url(#peachGlow)" rx="142" ry="132" />
        <Ellipse cx="205" cy="150" fill="url(#yellowGlow)" rx="142" ry="132" />
      </Svg>
      {speechText ? (
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{speechText}</Text>
          <View style={styles.speechTail} />
        </View>
      ) : null}
      <LottieView
        autoPlay
        loop
        resizeMode="contain"
        source={ddongCharacterLottie}
        style={styles.lottie}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
  },
  lottie: {
    height: '100%',
    width: '100%',
  },
  speechBubble: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 19,
    paddingVertical: 4,
    position: 'absolute',
    top: 32,
    zIndex: 2,
    shadowColor: '#D2CB91',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  speechText: {
    color: '#897E5B',
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 27,
  },
  speechTail: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 7,
    borderRightColor: 'transparent',
    borderRightWidth: 7,
    borderTopColor: '#FFFFFF',
    borderTopWidth: 8,
    bottom: -7,
    height: 0,
    left: 24,
    position: 'absolute',
    width: 0,
  },
});
