package com.leejun.recipeapp.domain.auth.oauth

/**
 * - Google id token 검증을 추상화한다.
 * - AuthService는 Google HTTP 검증 방식과 분리된 프로필 결과만 사용한다.
 * - 테스트에서는 이 인터페이스를 mock으로 대체해 사용자 생성 흐름만 검증한다.
 */
interface GoogleTokenVerifier {
    fun verify(idToken: String): GoogleProfile
}
