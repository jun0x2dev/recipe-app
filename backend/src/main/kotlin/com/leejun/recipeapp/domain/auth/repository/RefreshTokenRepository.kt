package com.leejun.recipeapp.domain.auth.repository

import com.leejun.recipeapp.domain.auth.entity.RefreshToken
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

/**
 * - refresh token 저장소 접근을 담당한다.
 * - tokenHash 기준으로 원문 토큰 없이 저장된 세션을 찾는다.
 * - revokedAt이 null인 토큰만 활성 토큰으로 간주한다.
 */
interface RefreshTokenRepository : JpaRepository<RefreshToken, Long> {
    fun findByTokenHashAndRevokedAtIsNull(tokenHash: String): Optional<RefreshToken>
}
