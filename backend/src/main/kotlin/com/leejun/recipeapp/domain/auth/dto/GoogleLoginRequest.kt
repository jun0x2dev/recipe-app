package com.leejun.recipeapp.domain.auth.dto

import jakarta.validation.constraints.NotBlank

/**
 * - Google 로그인 교환 API의 요청 DTO다.
 * - idToken은 Google OAuth 또는 Google Sign-In으로 발급받은 OpenID Connect 토큰이다.
 * - 백엔드는 이 토큰을 검증한 뒤 앱 자체 JWT를 발급한다.
 */
data class GoogleLoginRequest(
    @field:NotBlank(message = "Google id token은 필수입니다.")
    val idToken: String
)
