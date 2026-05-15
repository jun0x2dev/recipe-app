import { RecipeCreateScreen } from '../../src/features/recipes/screens/RecipeCreateScreen';

/**
 * - 새 레시피 작성 화면 라우트다.
 * - 실제 입력 폼과 저장 흐름은 RecipeCreateScreen에 위임한다.
 * - modal presentation 설정은 상위 Stack layout에서 관리한다.
 */
export default function RecipeCreateRoute() {
  return <RecipeCreateScreen />;
}
