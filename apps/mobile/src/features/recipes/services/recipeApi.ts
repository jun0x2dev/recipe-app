import { authConfig } from '../../auth/services/authConfig';
import { ApiResponse } from '../../auth/types/auth';
import { CreateRecipeRequest, Recipe } from '../types/recipe';

/**
 * - 백엔드 레시피 생성 API를 호출한다.
 * - accessToken은 Authorization Bearer 헤더로 전달한다.
 * - 성공하면 백엔드가 저장한 레시피 응답을 모바일 표시 타입으로 변환한다.
 */
export async function createRecipe(
  accessToken: string,
  request: CreateRecipeRequest,
): Promise<Recipe> {
  const response = await fetch(`${authConfig.apiBaseUrl}/api/v1/recipes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const body = (await response.json()) as ApiResponse<RecipeApiResponse>;

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? '레시피 저장 중 오류가 발생했습니다.');
  }

  return toRecipe(body.data);
}

/**
 * - 백엔드 레시피 응답 타입이다.
 * - Kotlin enum은 대문자 문자열로 내려오므로 모바일 도메인 타입으로 변환한다.
 */
type RecipeApiResponse = {
  id: number;
  title: string;
  description: string | null;
  cookingTimeMinutes: number | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  ingredients: { name: string; amount: string | null }[];
  steps: { order: number; description: string }[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  createdAt: string | null;
};

/**
 * - 백엔드 응답을 현재 모바일 화면에서 사용하는 Recipe 타입으로 변환한다.
 * - 재료는 name과 amount를 한 줄 문자열로 합쳐 기존 목록/상세 UI와 호환한다.
 */
function toRecipe(response: RecipeApiResponse): Recipe {
  return {
    id: String(response.id),
    title: response.title,
    description: response.description ?? '',
    cookingTimeMinutes: response.cookingTimeMinutes ?? 0,
    visibility: response.visibility === 'PUBLIC' ? 'public' : 'private',
    ingredients: response.ingredients.map((ingredient) =>
      [ingredient.name, ingredient.amount].filter(Boolean).join(' '),
    ),
    steps: response.steps.sort((left, right) => left.order - right.order).map((step) => step.description),
    viewCount: response.viewCount,
    likeCount: response.likeCount,
    shareCount: response.shareCount,
    createdAt: response.createdAt?.slice(0, 10) ?? '',
  };
}
