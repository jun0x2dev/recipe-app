import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { appleLogoSvg, googleLogoSvg, naverLogoSvg } from '../../../assets/login';

/**
 * - 로그인 제공자별 버튼 종류다.
 * - provider에 따라 색상, 로고, CTA 문구를 고정한다.
 */
type SocialLoginProvider = 'apple' | 'naver' | 'google';

/**
 * - 소셜 로그인 버튼 props다.
 * - 브랜드 정책과 앱 로딩 상태를 함께 반영하기 위해 공통 AppButton과 분리한다.
 */
type SocialLoginButtonProps = {
  provider: SocialLoginProvider;
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

/**
 * - 제공자별 설정 맵이다.
 * - 피그마 Hom_000_001_로그인 디자인 기준
 * - borderRadius 20px, 로고 32x32, space-between 배치
 */
const PROVIDER_CONFIG = {
  apple: {
    label: 'Apple로 시작하기',
    backgroundColor: '#000000',
    borderColor: '#000000',
    labelColor: '#FFFFFF',
    svg: appleLogoSvg,
  },
  naver: {
    label: '네이버로 시작하기',
    backgroundColor: '#03A94D',
    borderColor: '#03A94D',
    labelColor: '#FFFFFF',
    svg: naverLogoSvg,
  },
  google: {
    label: 'Google로 시작하기',
    backgroundColor: '#FFFFFF',
    borderColor: '#747775',
    labelColor: '#1F1F1F',
    svg: googleLogoSvg,
  },
} as const;

/**
 * - 소셜 로그인 전용 Pressable 버튼이다.
 * - 피그마 Hom_000_001_로그인 디자인 기준으로 구현한다.
 * - borderRadius 20px, padding 10px 20px, 로고 32x32, space-between 정렬
 * - Apple: 검정 배경, 흰색 텍스트
 * - 네이버: 초록 배경(#03A94D), 흰색 텍스트
 * - Google: 흰색 배경, 회색 테두리(#747775), 검정 텍스트(#1F1F1F)
 */
export function SocialLoginButton({
  provider,
  disabled = false,
  isLoading = false,
  onPress,
}: SocialLoginButtonProps) {
  const config = PROVIDER_CONFIG[provider];
  const label = isLoading ? '처리 중' : config.label;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          opacity: disabled ? 0.52 : pressed ? 0.82 : 1,
        },
      ]}
    >
      <SvgXml xml={config.svg} width={32} height={32} />
      <Text style={[styles.label, { color: config.labelColor }]}>{label}</Text>
      {/* 피그마 space-between을 위한 빈 placeholder (로고와 대칭) */}
      <View style={styles.placeholder} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 25,
  },
  placeholder: {
    width: 32,
  },
});
