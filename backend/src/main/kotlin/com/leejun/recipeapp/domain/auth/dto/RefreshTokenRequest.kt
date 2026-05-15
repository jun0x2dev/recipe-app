package com.leejun.recipeapp.domain.auth.dto

import jakarta.validation.constraints.NotBlank

/**
 * - refresh token 기반 재발급과 로그아웃 요청 값을 표현한다.
 * - refreshToken 원문은 요청 처리 중 해시로 변환하고 DB에는 저장하지 않는다.
 * - 공백 토큰은 validation 단계에서 차단한다.
 */
data class RefreshTokenRequest(
    @field:NotBlank(message = "리프레시 토큰은 필수입니다.")
    val refreshToken: String
)
