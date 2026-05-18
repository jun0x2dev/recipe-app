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
    val cookingTimeMinutes: Int?,
    val visibility: RecipeVisibility,
    val viewCount: Long,
    val likeCount: Long,
    val shareCount: Long,
    val createdAt: LocalDateTime?
) {
    companion object {
        fun from(recipe: Recipe): RecipeListResponse =
            RecipeListResponse(
                id = recipe.id,
                userId = recipe.user.id,
                title = recipe.title,
                description = recipe.description,
                cookingTimeMinutes = recipe.cookingTimeMinutes,
                visibility = recipe.visibility,
                viewCount = recipe.viewCount,
                likeCount = recipe.likeCount,
                shareCount = recipe.shareCount,
                createdAt = recipe.createdAt
            )
    }
}
