package com.leejun.recipeapp.domain.recipe.dto

import com.leejun.recipeapp.domain.recipe.entity.RecipeVisibility
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * - 레시피 수정 API 요청 DTO다.
 * - 생성 요청과 동일한 필드 구조와 검증 규칙을 적용한다.
 * - 재료와 조리 단계는 전체 교체 방식으로 처리한다.
 */
data class UpdateRecipeRequest(
    @field:NotBlank(message = "레시피 제목을 입력해주세요.")
    @field:Size(max = 120, message = "레시피 제목은 120자 이하로 입력해주세요.")
    val title: String,

    @field:Size(max = 1000, message = "레시피 설명은 1000자 이하로 입력해주세요.")
    val description: String?,

    @field:Min(value = 1, message = "조리 시간은 1분 이상이어야 합니다.")
    @field:Max(value = 1440, message = "조리 시간은 1440분 이하로 입력해주세요.")
    val cookingTimeMinutes: Int?,

    val visibility: RecipeVisibility = RecipeVisibility.PRIVATE,

    @field:Size(max = 100, message = "재료는 최대 100개까지 입력할 수 있습니다.")
    val ingredients: List<@Valid RecipeIngredientRequest> = emptyList(),

    @field:Size(max = 100, message = "조리 단계는 최대 100개까지 입력할 수 있습니다.")
    val steps: List<@Valid RecipeStepRequest> = emptyList()
)
