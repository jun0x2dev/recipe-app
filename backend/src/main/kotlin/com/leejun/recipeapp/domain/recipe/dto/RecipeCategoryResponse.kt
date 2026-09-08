package com.leejun.recipeapp.domain.recipe.dto

import com.leejun.recipeapp.domain.recipe.entity.RecipeCategory

/**
 * - 레시피 카테고리 응답 DTO다.
 * - 레시피 목록/상세 응답에 포함되어 카테고리 정보를 전달한다.
 * - thumbnailUrl이 있으면 모바일에서 이미지 썸네일을, 없으면 썸네일 없이 표시한다.
 * - 카테고리 목록 API에서도 단독으로 사용한다.
 */
data class RecipeCategoryResponse(
    val id: Long,
    val name: String,
    val thumbnailUrl: String?
) {
    companion object {
        /**
         * - RecipeCategory 엔티티를 응답 DTO로 변환한다.
         */
        fun from(category: RecipeCategory): RecipeCategoryResponse =
            RecipeCategoryResponse(
                id = category.id,
                name = category.name,
                thumbnailUrl = category.thumbnailUrl
            )
    }
}
