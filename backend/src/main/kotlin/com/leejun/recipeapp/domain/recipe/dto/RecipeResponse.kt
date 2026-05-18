package com.leejun.recipeapp.domain.recipe.dto

import com.leejun.recipeapp.domain.recipe.entity.Recipe
import com.leejun.recipeapp.domain.recipe.entity.RecipeVisibility
import java.time.LocalDateTime

/**
 * - 레시피 생성/조회 API의 응답 DTO다.
 * - Entity lazy loading 세부 구현을 클라이언트에 노출하지 않기 위해 별도 DTO로 변환한다.
 * - 현재 생성 API 기준 필드를 포함하며 목록/상세 확장 시 재사용한다.
 */
data class RecipeResponse(
    val id: Long,
    val userId: Long,
    val title: String,
    val description: String?,
    val cookingTimeMinutes: Int?,
    val visibility: RecipeVisibility,
    val ingredients: List<RecipeIngredientResponse>,
    val steps: List<RecipeStepResponse>,
    val viewCount: Long,
    val likeCount: Long,
    val shareCount: Long,
    val createdAt: LocalDateTime?
) {
    companion object {
        /**
         * - 저장된 Recipe 엔티티를 API 응답 DTO로 변환한다.
         * - 재료와 조리 단계는 sortOrder 기준 정렬 상태를 보장한다.
         */
        fun from(recipe: Recipe): RecipeResponse =
            RecipeResponse(
                id = recipe.id,
                userId = recipe.user.id,
                title = recipe.title,
                description = recipe.description,
                cookingTimeMinutes = recipe.cookingTimeMinutes,
                visibility = recipe.visibility,
                ingredients = recipe.ingredients
                    .sortedBy { it.sortOrder }
                    .map { RecipeIngredientResponse(it.name, it.amount) },
                steps = recipe.steps
                    .sortedBy { it.sortOrder }
                    .map { RecipeStepResponse(it.sortOrder, it.description) },
                viewCount = recipe.viewCount,
                likeCount = recipe.likeCount,
                shareCount = recipe.shareCount,
                createdAt = recipe.createdAt
            )
    }
}

/**
 * - 레시피 응답의 단일 재료 DTO다.
 */
data class RecipeIngredientResponse(
    val name: String,
    val amount: String?
)

/**
 * - 레시피 응답의 단일 조리 단계 DTO다.
 */
data class RecipeStepResponse(
    val order: Int,
    val description: String
)
