import { StyleSheet, Text, View } from 'react-native';

/**
 * - 오메추(오늘의 메뉴 추천) 화면이다.
 * - 추후 AI 기반 메뉴 추천 기능을 구현할 예정이다.
 * - 현재는 준비 중 안내만 표시한다.
 */
export function RecommendScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>오메추 기능을 준비 중입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    color: '#8B95A1',
    fontSize: 16,
    fontWeight: '500',
  },
});
