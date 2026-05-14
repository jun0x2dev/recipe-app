export type RecipeVisibility = 'public' | 'private';

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

export type RecipeDraft = {
  title: string;
  description: string;
  cookingTimeMinutes: string;
  visibility: RecipeVisibility;
  ingredientsText: string;
  stepsText: string;
};
