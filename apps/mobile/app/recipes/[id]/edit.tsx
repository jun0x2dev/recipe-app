import { useLocalSearchParams } from 'expo-router';

import { RecipeCreateScreen } from '../../../src/features/recipes/screens/RecipeCreateScreen';

/**
 * - 레시피 수정 화면 라우트다.
 * - URL의 id 파라미터를 RecipeCreateScreen에 전달해 수정 모드로 동작시킨다.
 */
export default function RecipeEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <RecipeCreateScreen recipeId={id} />;
}
