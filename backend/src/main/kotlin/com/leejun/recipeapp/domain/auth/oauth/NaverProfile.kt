package com.leejun.recipeapp.domain.auth.oauth

/**
 * - 네이버 프로필 응답을 서비스 계층에서 쓰기 쉽게 정규화한 모델이다.
 * - providerUserId는 내부 계정 연결의 기준값이다.
 * - email은 계정 매칭 기준이 아니라 사용자 표시와 보조 정보 저장에만 사용한다.
 */
data class NaverProfile(
    val providerUserId: String,
    val email: String?,
    val nickname: String,
    val profileImageUrl: String?
)
