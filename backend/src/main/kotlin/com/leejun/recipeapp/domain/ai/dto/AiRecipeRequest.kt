package com.leejun.recipeapp.domain.ai.dto

import jakarta.validation.constraints.NotBlank

/**
 * - 음식명 기반 AI 레시피 생성 요청 DTO다.
 * - 클라이언트가 `/api/v1/ai/recipes/generate`에 보내는 본문이다.
 */
data class AiGenerateRequest(
    @field:NotBlank(message = "음식명을 입력해주세요.")
    val query: String
)

/**
 * - 유튜브 쇼츠 기반 AI 레시피 추출 요청 DTO다.
 * - 클라이언트가 `/api/v1/ai/recipes/extract`에 보내는 본문이다.
 */
data class AiExtractRequest(
    @field:NotBlank(message = "유튜브 링크를 입력해주세요.")
    val url: String
)
