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
  title: string;
  description: string;
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
 * - 레시피 작성 화면의 입력 상태 타입이다.
 * - TextInput 값은 문자열로 관리하고 저장 시 숫자/배열로 변환한다.
 * - ingredientsText와 stepsText는 줄바꿈 기반 입력을 전제로 한다.
 */
export type RecipeDraft = {
  title: string;
  description: string;
  cookingTimeMinutes: string;
  visibility: RecipeVisibility;
  ingredientsText: string;
  stepsText: string;
};
