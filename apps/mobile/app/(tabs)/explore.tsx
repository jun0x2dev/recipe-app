import { ExploreRecipeScreen } from '../../src/features/explore/screens/ExploreRecipeScreen';

/**
 * - 둘러보기 탭 라우트다.
 * - 다른 사용자의 공개 레시피 피드 화면으로 연결한다.
 * - 실제 API 연결 전까지는 mock 데이터를 사용한다.
 */
export default function ExploreRoute() {
  return <ExploreRecipeScreen />;
}
