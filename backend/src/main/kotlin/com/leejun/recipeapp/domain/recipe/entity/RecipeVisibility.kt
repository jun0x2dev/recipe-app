package com.leejun.recipeapp.domain.recipe.entity

/**
 * - 레시피 공개 범위를 표현한다.
 * - PRIVATE은 작성자 본인만 볼 수 있는 레시피다.
 * - PUBLIC은 추후 둘러보기와 공유 화면에 노출할 수 있는 레시피다.
 */
enum class RecipeVisibility {
    PRIVATE,
    PUBLIC
}
