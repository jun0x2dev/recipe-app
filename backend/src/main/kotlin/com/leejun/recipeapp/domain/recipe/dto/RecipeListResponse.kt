package com.leejun.recipeapp.domain.recipe.dto

import com.leejun.recipeapp.domain.recipe.entity.Recipe
import com.leejun.recipeapp.domain.recipe.entity.RecipeVisibility
import java.time.LocalDateTime

/**
 * - 레시피 목록 API의 경량 응답 DTO다.
 * - 재료와 조리 단계를 제외해 목록 조회 시 불필요한 lazy loading을 방지한다.
 */
data class RecipeListResponse(
    val id: Long,
    val userId: Long,
    val title: String,
    val description: String?,
    val servings: Int?,
    val cookingTimeMinutes: Int?,
    val visibility: RecipeVisibility,
    val category: RecipeCategoryResponse?,
    val viewCount: Long,
    val likeCount: Long,
    val shareCount: Long,
    val liked: Boolean,
    val createdAt: LocalDateTime?
) {
    companion object {
        /**
         * - Recipe 엔티티를 목록용 경량 응답 DTO로 변환한다.
         * - liked는 요청 사용자의 좋아요 여부를 나타낸다.
         * - category는 자동 분류된 카테고리 정보를 포함한다.
         */
        fun from(recipe: Recipe, liked: Boolean): RecipeListResponse =
            RecipeListResponse(
                id = recipe.id,
                userId = recipe.user.id,
                title = recipe.title,
                description = recipe.description,
                servings = recipe.servings,
                cookingTimeMinutes = recipe.cookingTimeMinutes,
                visibility = recipe.visibility,
                category = recipe.category?.let { RecipeCategoryResponse.from(it) },
                viewCount = recipe.viewCount,
                likeCount = recipe.likeCount,
                shareCount = recipe.shareCount,
                liked = liked,
                createdAt = recipe.createdAt
            )
    }
}
