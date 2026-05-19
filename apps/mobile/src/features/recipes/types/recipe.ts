/**
 * - 레시피 공개 범위를 표현한다.
 * - public은 다른 사용자가 볼 수 있는 레시피다.
 * - private은 작성자 본인만 볼 수 있는 레시피다.
 */
export type RecipeVisibility = 'public' | 'private';

/**
 * - 레시피 목록과 상세 화면에서 사용하는 도메인 타입이다.
 * - 현재는 mock 데이터 기준 필드를 정의한다.
 * - 백엔드 API 응답 스키마가 확정되면 이 타입을 함께 조정한다.
 */
export type Recipe = {
  id: string;
  userId: string;
  title: string;
  description: string;
  servings: number | null;
  cookingTimeMinutes: number;
  visibility: RecipeVisibility;
  ingredients: string[];
  steps: string[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  createdAt: string;
};

/**
 * - 백엔드 레시피 생성 API에 전달하는 단일 재료 요청이다.
 * - amount는 사용자가 계량을 입력하지 않을 수 있어 null을 허용한다.
 */
export type CreateRecipeIngredientRequest = {
  name: string;
  amount: string | null;
};

/**
 * - 백엔드 레시피 생성 API에 전달하는 단일 조리 단계 요청이다.
 */
export type CreateRecipeStepRequest = {
  description: string;
};

/**
 * - 백엔드 레시피 생성 API 요청 타입이다.
 * - 모바일 작성 폼의 문자열 입력값을 저장 가능한 구조로 변환한 결과다.
 */
export type CreateRecipeRequest = {
  title: string;
  description: string | null;
  servings: number | null;
  cookingTimeMinutes: number | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  ingredients: CreateRecipeIngredientRequest[];
  steps: CreateRecipeStepRequest[];
};

/**
 * - 레시피 작성 화면의 단일 재료 입력 상태다.
 * - UI에서 재료명과 계량을 별도 입력칸으로 관리한다.
 */
export type RecipeDraftIngredient = {
  name: string;
  amount: string;
};

/**
 * - 레시피 작성 화면의 단일 조리 단계 입력 상태다.
 */
export type RecipeDraftStep = {
  description: string;
};

/**
 * - 레시피 작성 화면의 입력 상태 타입이다.
 * - TextInput 값은 문자열로 관리하고 저장 시 숫자로 변환한다.
 * - 재료와 조리 단계는 추가/삭제 가능한 배열 입력 UI로 관리한다.
 */
export type RecipeDraft = {
  title: string;
  description: string;
  servings: string;
  cookingTimeMinutes: string;
  visibility: RecipeVisibility;
  ingredients: RecipeDraftIngredient[];
  steps: RecipeDraftStep[];
};

/**
 * - 레시피 수정 API 요청 타입이다.
 * - 생성 요청과 동일한 구조를 사용한다.
 */
export type UpdateRecipeRequest = CreateRecipeRequest;

/**
 * - Spring Page JSON 응답을 매핑하는 타입이다.
 * - 목록 API의 페이징 결과를 표현한다.
 */
export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};
