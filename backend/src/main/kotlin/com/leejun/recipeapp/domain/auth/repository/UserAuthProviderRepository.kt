package com.leejun.recipeapp.domain.auth.repository

import com.leejun.recipeapp.domain.auth.entity.AuthProvider
import com.leejun.recipeapp.domain.auth.entity.UserAuthProvider
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

/**
 * - 외부 로그인 제공자와 내부 사용자 연결 정보를 조회한다.
 * - 소셜 로그인 매칭은 이메일이 아니라 provider와 providerUserId 조합을 기준으로 한다.
 * - providerUserId는 네이버 response.id처럼 제공자가 보장하는 고유 식별값이다.
 */
interface UserAuthProviderRepository : JpaRepository<UserAuthProvider, Long> {
    fun findByProviderAndProviderUserId(
        provider: AuthProvider,
        providerUserId: String
    ): Optional<UserAuthProvider>
}
