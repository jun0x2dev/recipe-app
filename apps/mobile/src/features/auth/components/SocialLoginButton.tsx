import { FontAwesome } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * - 로그인 제공자별 버튼 종류다.
 * - provider에 따라 색상, 심볼, 접근성 라벨, CTA 문구를 고정한다.
 */
type SocialLoginProvider = 'naver' | 'google';

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
 * - 소셜 로그인 전용 Pressable 버튼이다.
 * - 네이버는 공식 지정 녹색 배경과 흰색 심볼을 사용한다.
 * - 구글은 흰색 배경, 얇은 테두리, Google 아이콘, 명확한 CTA를 사용한다.
 */
export function SocialLoginButton({
  provider,
  disabled = false,
  isLoading = false,
  onPress,
}: SocialLoginButtonProps) {
  const isNaver = provider === 'naver';
  const label = isLoading
    ? '처리 중'
    : isNaver
      ? '네이버로 계속하기'
      : 'Google로 계속하기';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isNaver ? styles.naverButton : styles.googleButton,
        {
          opacity: disabled ? 0.52 : pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={[styles.symbolBox, isNaver ? styles.naverSymbolBox : styles.googleSymbolBox]}>
        {isNaver ? (
          <Text style={styles.naverSymbol}>N</Text>
        ) : (
          <FontAwesome name="google" size={18} color="#4285F4" />
        )}
      </View>
      <Text style={[styles.label, isNaver ? styles.naverLabel : styles.googleLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DADCE0',
  },
  googleLabel: {
    color: '#1F1F1F',
  },
  googleSymbolBox: {
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  naverButton: {
    backgroundColor: '#03A94D',
    borderColor: '#03A94D',
  },
  naverLabel: {
    color: '#FFFFFF',
  },
  naverSymbol: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  naverSymbolBox: {
    backgroundColor: '#03A94D',
  },
  symbolBox: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
});
