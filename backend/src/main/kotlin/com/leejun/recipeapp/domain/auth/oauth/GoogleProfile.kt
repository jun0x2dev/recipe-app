package com.leejun.recipeapp.domain.auth.oauth

/**
 * - Google id token 검증 결과를 서비스 계층에서 쓰기 쉽게 정규화한 모델이다.
 * - providerUserId는 Google sub claim이며 내부 계정 연결의 기준값이다.
 * - email은 표시와 보조 정보 저장에 사용하고 계정 자동 연결 기준으로 사용하지 않는다.
 */
data class GoogleProfile(
    val providerUserId: String,
    val email: String?,
    val emailVerified: Boolean,
    val nickname: String,
    val profileImageUrl: String?
)
