package com.leejun.recipeapp.domain.auth.dto

/**
 * - 인증 성공 후 클라이언트에 전달하는 토큰 응답이다.
 * - access token은 API 인증에 사용한다.
 * - refresh token은 access token 재발급과 로그아웃 처리에 사용한다.
 */
data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer"
)
