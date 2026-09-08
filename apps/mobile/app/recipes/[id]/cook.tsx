import { useLocalSearchParams } from 'expo-router';

import { RecipeCookingScreen } from '../../../src/features/recipes/screens/RecipeCookingScreen';

/**
 * - 레시피 요리모드 화면 라우트다.
 * - URL의 id 파라미터를 읽어 요리모드 화면 컴포넌트에 전달한다.
 */
export default function RecipeCookingRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <RecipeCookingScreen recipeId={id} />;
}
