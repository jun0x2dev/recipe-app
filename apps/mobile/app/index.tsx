import { Redirect } from 'expo-router';

import { useAuth } from '../src/features/auth/AuthContext';
import { RecipeListScreen } from '../src/features/recipes/screens/RecipeListScreen';

/**
 * - 앱 첫 화면 라우트다.
 * - 실제 화면 구현은 RecipeListScreen에 위임한다.
 * - 라우트 파일은 화면 연결만 담당한다.
 */
export default function HomeRoute() {
  const { tokenResponse } = useAuth();

  if (!tokenResponse) {
    return <Redirect href="/login" />;
  }

  return <RecipeListScreen />;
}
