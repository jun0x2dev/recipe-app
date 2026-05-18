import { useLocalSearchParams } from 'expo-router';

import { RecipeDetailScreen } from '../../../src/features/recipes/screens/RecipeDetailScreen';

/**
 * - 레시피 상세 화면 라우트다.
 * - URL의 id 파라미터를 읽어 상세 화면 컴포넌트에 전달한다.
 */
export default function RecipeDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <RecipeDetailScreen recipeId={id} />;
}
