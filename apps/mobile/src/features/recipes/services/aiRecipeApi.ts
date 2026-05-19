import { authConfig } from '../../auth/services/authConfig';
import { RecipeDraft } from '../types/recipe';

/**
 * - AI Worker에 음식명 또는 짧은 요청 문장을 보내 레시피 초안을 생성한다.
 * - 유튜브 근거 없이 LLM이 만든 draft이므로 저장 전 사용자 검토가 필요하다.
 */
export async function generateRecipeDraftFromQuery(query: string): Promise<RecipeDraft> {
  const response = await fetch(`${authConfig.aiWorkerBaseUrl}/generate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const body = (await response.json()) as AiWorkerGenerateResponse | AiWorkerErrorResponse;

  if (!response.ok || !('recipe' in body)) {
    throw new Error(getAiWorkerErrorMessage(body));
  }

  return toRecipeDraft(body.recipe);
}

/**
 * - AI Worker에 유튜브 쇼츠 링크를 보내 레시피 초안을 생성한다.
 * - 현재는 개발 편의를 위해 모바일에서 AI Worker를 직접 호출한다.
 * - 운영 전에는 Spring Boot 백엔드가 AI Worker를 호출하는 구조로 바꾼다.
 */
export async function extractRecipeDraftFromYoutube(url: string): Promise<RecipeDraft> {
  const response = await fetch(`${authConfig.aiWorkerBaseUrl}/extract`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  const body = (await response.json()) as AiWorkerExtractResponse | AiWorkerErrorResponse;

  if (!response.ok || !('recipe' in body)) {
    throw new Error(getAiWorkerErrorMessage(body));
  }

  return toRecipeDraft(body.recipe);
}

/**
 * - AI Worker `/generate` 성공 응답 중 작성 화면에 필요한 필드만 정의한다.
 */
type AiWorkerGenerateResponse = {
  query: string;
  recipe: AiRecipeDraft;
};

/**
 * - AI Worker `/extract` 성공 응답 중 작성 화면에 필요한 필드만 정의한다.
 */
type AiWorkerExtractResponse = {
  recipe: AiRecipeDraft;
};

/**
 * - AI Worker 오류 응답 형태다.
 */
type AiWorkerErrorResponse = {
  detail?: {
    code?: string;
    message?: string;
  };
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
 * - AI Worker 오류 응답에서 사용자에게 표시할 메시지를 고른다.
 */
function getAiWorkerErrorMessage(
  body: AiWorkerGenerateResponse | AiWorkerExtractResponse | AiWorkerErrorResponse,
): string {
  if ('detail' in body && body.detail?.message) {
    return body.detail.message;
  }

  return 'AI 레시피 추출 중 오류가 발생했습니다.';
}

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
