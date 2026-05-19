import { authConfig } from '../../auth/services/authConfig';
import { ApiResponse } from '../../auth/types/auth';
import { RecipeDraft } from '../types/recipe';

/**
 * - 백엔드 AI 레시피 프록시 API를 통해 음식명 기반 레시피 초안을 생성한다.
 * - 백엔드가 JWT 인증을 거친 뒤 AI Worker로 요청을 전달한다.
 * - LLM이 만든 draft이므로 저장 전 사용자 검토가 필요하다.
 */
export async function generateRecipeDraftFromQuery(
  accessToken: string,
  query: string,
): Promise<RecipeDraft> {
  const body = await apiFetch<AiWorkerGenerateResponse>(
    accessToken,
    '/api/v1/ai/recipes/generate',
    {
      method: 'POST',
      body: JSON.stringify({ query }),
    },
  );

  return toRecipeDraft(body.recipe);
}

/**
 * - 백엔드 AI 레시피 프록시 API를 통해 유튜브 쇼츠 기반 레시피 초안을 생성한다.
 * - 백엔드가 JWT 인증을 거친 뒤 AI Worker로 요청을 전달한다.
 * - STT + LLM 파이프라인으로 응답 시간이 길 수 있다.
 */
export async function extractRecipeDraftFromYoutube(
  accessToken: string,
  url: string,
): Promise<RecipeDraft> {
  const body = await apiFetch<AiWorkerExtractResponse>(
    accessToken,
    '/api/v1/ai/recipes/extract',
    {
      method: 'POST',
      body: JSON.stringify({ url }),
    },
  );

  return toRecipeDraft(body.recipe);
}

// ── 내부 헬퍼 ──

/**
 * - 백엔드 AI API 공통 호출 헬퍼다.
 * - Bearer 토큰, JSON 파싱, ApiResponse 언래핑을 처리한다.
 */
async function apiFetch<T>(
  accessToken: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${authConfig.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();

  let body: ApiResponse<T>;
  try {
    body = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error(
      response.ok ? '서버 응답을 읽을 수 없습니다.' : toHttpErrorMessage(response),
    );
  }

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.error?.message ?? toHttpErrorMessage(response));
  }

  return body.data;
}

/**
 * - HTTP 상태 코드 기반 기본 에러 메시지를 생성한다.
 */
function toHttpErrorMessage(response: Response): string {
  if (response.status === 401 || response.status === 403) {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.';
  }
  return `AI 레시피 생성 중 오류가 발생했습니다. (${response.status})`;
}

/**
 * - 백엔드에서 전달한 AI Worker `/generate` 응답 중 필요한 필드만 정의한다.
 */
type AiWorkerGenerateResponse = {
  query: string;
  recipe: AiRecipeDraft;
};

/**
 * - 백엔드에서 전달한 AI Worker `/extract` 응답 중 필요한 필드만 정의한다.
 */
type AiWorkerExtractResponse = {
  recipe: AiRecipeDraft;
};

/**
 * - AI Worker가 반환하는 레시피 초안 구조다.
 */
type AiRecipeDraft = {
  title?: string;
  description?: string | null;
  servings?: number | null;
  estimated_cooking_time_minutes?: number | null;
  ingredients?: AiIngredientDraft[];
  steps?: AiStepDraft[];
};

/**
 * - AI 추출 재료 항목이다.
 */
type AiIngredientDraft = {
  name?: string;
  amount?: string | null;
};

/**
 * - AI 추출 조리 단계 항목이다.
 */
type AiStepDraft = {
  order?: number;
  description?: string;
};

/**
 * - AI Worker 응답을 작성 화면 draft 상태로 변환한다.
 * - 사용자는 이 값이 채워진 뒤 저장 전 직접 검토하고 수정한다.
 */
function toRecipeDraft(recipe: AiRecipeDraft): RecipeDraft {
  return {
    title: recipe.title?.trim() ?? '',
    description: recipe.description?.trim() ?? '',
    servings: recipe.servings ? String(recipe.servings) : '',
    cookingTimeMinutes: recipe.estimated_cooking_time_minutes
      ? String(recipe.estimated_cooking_time_minutes)
      : '',
    visibility: 'private',
    ingredients: toIngredients(recipe.ingredients ?? []),
    steps: toSteps(recipe.steps ?? []),
  };
}

/**
 * - AI 재료 배열을 작성 화면의 반복 입력 상태로 변환한다.
 */
function toIngredients(ingredients: AiIngredientDraft[]) {
  const result = ingredients
    .map((ingredient) => ({
      name: ingredient.name?.trim() ?? '',
      amount: ingredient.amount?.trim() ?? '',
    }))
    .filter((ingredient) => ingredient.name || ingredient.amount);

  return result.length > 0 ? result : [{ name: '', amount: '' }];
}

/**
 * - AI 조리 단계 배열을 순서 기준으로 정렬한 뒤 반복 입력 상태로 변환한다.
 */
function toSteps(steps: AiStepDraft[]) {
  const result = [...steps]
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    .map((step) => ({ description: step.description?.trim() ?? '' }))
    .filter((step) => step.description);

  return result.length > 0 ? result : [{ description: '' }];
}
