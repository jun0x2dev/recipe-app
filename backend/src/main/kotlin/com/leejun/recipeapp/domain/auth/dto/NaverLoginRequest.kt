package com.leejun.recipeapp.domain.auth.dto

import jakarta.validation.constraints.NotBlank

/**
 * - 네이버 로그인 교환 API의 요청 DTO다.
 * - accessToken은 모바일 앱이 네이버 SDK 또는 OAuth 흐름으로 발급받은 값이다.
 * - 백엔드는 이 토큰을 네이버 프로필 조회에만 사용하고 저장하지 않는다.
 */
data class NaverLoginRequest(
    @field:NotBlank(message = "네이버 access token은 필수입니다.")
    val accessToken: String
)
