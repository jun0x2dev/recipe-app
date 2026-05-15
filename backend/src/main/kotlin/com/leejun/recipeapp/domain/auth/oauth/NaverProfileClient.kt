package com.leejun.recipeapp.domain.auth.oauth

/**
 * - 네이버 회원 프로필 조회를 추상화한다.
 * - AuthService는 HTTP 구현체를 직접 알지 않고 정규화된 프로필만 사용한다.
 * - 테스트에서는 이 인터페이스를 mock으로 대체해 사용자 생성 흐름만 검증한다.
 */
interface NaverProfileClient {
    fun getProfile(accessToken: String): NaverProfile
}
