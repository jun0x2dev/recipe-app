package com.leejun.recipeapp.domain.recipe.dto

import com.leejun.recipeapp.domain.recipe.entity.RecipeVisibility
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * - 수동 레시피 작성 API 요청 DTO다.
 * - 모바일 작성 화면의 입력값을 저장 가능한 구조화 데이터로 전달한다.
 * - ingredients와 steps는 줄바꿈 텍스트를 모바일에서 배열로 변환해 보낸다.
 */
data class CreateRecipeRequest(
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

/**
 * - 레시피 생성 요청의 단일 재료 DTO다.
 * - amount는 계량 정보가 없을 수 있어 nullable로 둔다.
 */
data class RecipeIngredientRequest(
    @field:NotBlank(message = "재료명을 입력해주세요.")
    @field:Size(max = 120, message = "재료명은 120자 이하로 입력해주세요.")
    val name: String,

    @field:Size(max = 120, message = "재료 계량은 120자 이하로 입력해주세요.")
    val amount: String?
)

/**
 * - 레시피 생성 요청의 단일 조리 단계 DTO다.
 * - 순서는 요청 배열 순서를 사용하므로 별도 order 필드는 받지 않는다.
 */
data class RecipeStepRequest(
    @field:NotBlank(message = "조리 단계를 입력해주세요.")
    @field:Size(max = 1000, message = "조리 단계는 1000자 이하로 입력해주세요.")
    val description: String
)
