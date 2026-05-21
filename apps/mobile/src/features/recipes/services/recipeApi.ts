import { authConfig } from '../../auth/services/authConfig';
import { ApiResponse } from '../../auth/types/auth';
import { CreateRecipeRequest, PageResponse, Recipe, UpdateRecipeRequest } from '../types/recipe';

/**
 * - 백엔드 레시피 생성 API를 호출한다.
 */
export async function createRecipe(
  accessToken: string,
  request: CreateRecipeRequest,
): Promise<Recipe | null> {
  const body = await apiFetch<RecipeApiResponse>(accessToken, '/api/v1/recipes', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return body ? toRecipe(body) : null;
}

/**
 * - 내 레시피 목록을 페이징 조회한다.
 */
export async function fetchMyRecipes(
  accessToken: string,
  params: { keyword?: string; page?: number; size?: number } = {},
): Promise<PageResponse<Recipe>> {
  const query = toQueryString(params);
  const page = await apiFetch<PageResponse<RecipeListApiResponse>>(
    accessToken,
    `/api/v1/recipes${query}`,
  );

  return {
    ...page!,
    content: page!.content.map(toRecipeFromList),
  };
}

/**
 * - 공개 레시피 목록을 페이징 조회한다.
 */
export async function fetchPublicRecipes(
  accessToken: string,
  params: { keyword?: string; page?: number; size?: number } = {},
): Promise<PageResponse<Recipe>> {
  const query = toQueryString(params);
  const page = await apiFetch<PageResponse<RecipeListApiResponse>>(
    accessToken,
    `/api/v1/recipes/public${query}`,
  );

  return {
    ...page!,
    content: page!.content.map(toRecipeFromList),
  };
}

/**
 * - 레시피 상세를 조회한다.
 */
export async function fetchRecipe(accessToken: string, recipeId: string): Promise<Recipe> {
  const body = await apiFetch<RecipeApiResponse>(accessToken, `/api/v1/recipes/${recipeId}`);
  return toRecipe(body!);
}

/**
 * - 레시피를 수정한다.
 */
export async function updateRecipe(
  accessToken: string,
  recipeId: string,
  request: UpdateRecipeRequest,
): Promise<Recipe> {
  const body = await apiFetch<RecipeApiResponse>(accessToken, `/api/v1/recipes/${recipeId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });

  return toRecipe(body!);
}

/**
 * - 좋아요한 레시피 목록을 페이징 조회한다.
 * - 메뉴 > 좋아요한 레시피 화면에서 사용한다.
 */
export async function fetchLikedRecipes(
  accessToken: string,
  params: { page?: number; size?: number } = {},
): Promise<PageResponse<Recipe>> {
  const query = toQueryString(params);
  const page = await apiFetch<PageResponse<RecipeListApiResponse>>(
    accessToken,
    `/api/v1/recipes/liked${query}`,
  );

  return {
    ...page!,
    content: page!.content.map(toRecipeFromList),
  };
}

/**
 * - 레시피 좋아요를 토글한다.
 * - 이미 좋아요 상태이면 취소, 아니면 등록한다.
 * - liked: true/false를 반환해 UI 상태를 갱신한다.
 */
export async function toggleLike(
  accessToken: string,
  recipeId: string,
): Promise<{ liked: boolean }> {
  const body = await apiFetch<{ liked: boolean }>(accessToken, `/api/v1/recipes/${recipeId}/like`, {
    method: 'POST',
  });

  return body!;
}

/**
 * - 레시피를 삭제한다.
 */
export async function deleteRecipe(accessToken: string, recipeId: string): Promise<void> {
  const response = await fetch(`${authConfig.apiBaseUrl}/api/v1/recipes/${recipeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const body = JSON.parse(text) as ApiResponse<never>;
      throw new Error(body.error?.message ?? '레시피 삭제 중 오류가 발생했습니다.');
    } catch (error) {
      if (error instanceof Error && error.message !== '레시피 삭제 중 오류가 발생했습니다.') {
        throw error;
      }
      throw new Error(toHttpErrorMessage(response));
    }
  }
}

// ── 내부 헬퍼 ──

/**
 * - 공통 API 호출 헬퍼다.
 * - Bearer 토큰, JSON 파싱, ApiResponse 언래핑을 처리한다.
 */
async function apiFetch<T>(
  accessToken: string,
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const response = await fetch(`${authConfig.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();

  if (!text.trim()) {
    if (response.ok) return null;
    throw new Error(toHttpErrorMessage(response));
  }

  let body: ApiResponse<T>;
  try {
    body = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error(response.ok ? '서버 응답을 읽을 수 없습니다.' : toHttpErrorMessage(response));
  }

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? toHttpErrorMessage(response));
  }

  return body.data;
}

function toHttpErrorMessage(response: Response): string {
  if (response.status === 401 || response.status === 403) {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.';
  }
  return `요청 처리 중 오류가 발생했습니다. (${response.status})`;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join('&');
}

// ── 응답 타입 & 변환 ──

type RecipeApiResponse = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  servings: number | null;
  cookingTimeMinutes: number | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  ingredients: { name: string; amount: string | null }[];
  steps: { order: number; description: string }[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  liked: boolean;
  createdAt: string | null;
};

type RecipeListApiResponse = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  servings: number | null;
  cookingTimeMinutes: number | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  viewCount: number;
  likeCount: number;
  shareCount: number;
  liked: boolean;
  createdAt: string | null;
};

function toRecipe(response: RecipeApiResponse): Recipe {
  return {
    id: String(response.id),
    userId: String(response.userId),
    title: response.title,
    description: response.description ?? '',
    servings: response.servings ?? null,
    cookingTimeMinutes: response.cookingTimeMinutes ?? 0,
    visibility: response.visibility === 'PUBLIC' ? 'public' : 'private',
    ingredients: response.ingredients.map((ingredient) =>
      [ingredient.name, ingredient.amount].filter(Boolean).join(' '),
    ),
    steps: response.steps.sort((left, right) => left.order - right.order).map((step) => step.description),
    viewCount: response.viewCount,
    likeCount: response.likeCount,
    shareCount: response.shareCount,
    liked: response.liked,
    createdAt: response.createdAt?.slice(0, 10) ?? '',
  };
}

function toRecipeFromList(response: RecipeListApiResponse): Recipe {
  return {
    id: String(response.id),
    userId: String(response.userId),
    title: response.title,
    description: response.description ?? '',
    servings: response.servings ?? null,
    cookingTimeMinutes: response.cookingTimeMinutes ?? 0,
    visibility: response.visibility === 'PUBLIC' ? 'public' : 'private',
    ingredients: [],
    steps: [],
    viewCount: response.viewCount,
    likeCount: response.likeCount,
    shareCount: response.shareCount,
    liked: response.liked,
    createdAt: response.createdAt?.slice(0, 10) ?? '',
  };
}
