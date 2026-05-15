import { RecipeListScreen } from '../../src/features/recipes/screens/RecipeListScreen';

/**
 * - 내 레시피 탭 라우트다.
 * - 실제 화면 구현은 RecipeListScreen에 위임한다.
 * - 하단 탭 구조에서도 route 파일은 화면 연결만 담당한다.
 */
export default function MyRecipesRoute() {
  return <RecipeListScreen />;
}
