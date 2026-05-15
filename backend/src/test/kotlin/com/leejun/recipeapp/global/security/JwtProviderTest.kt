package com.leejun.recipeapp.global.security

import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

/**
 * - JwtProvider의 토큰 생성과 파싱 규칙을 검증한다.
 * - Spring 컨텍스트 없이 순수 단위 테스트로 빠르게 실행한다.
 * - userId, role, subject 클레임이 인증 필터에서 사용할 수 있는 형태인지 확인한다.
 */
class JwtProviderTest {

    private val jwtProvider = JwtProvider(
        secret = "test-secret-key-must-be-at-least-256-bits-for-hs256-algorithm",
        accessTokenExpiry = 3_600_000,
        refreshTokenExpiry = 604_800_000
    )

    /**
     * - access token에 userId와 role 클레임이 포함되는지 검증한다.
     * - 이메일이 있으면 JWT subject로 이메일을 사용한다.
     */
    @Test
    fun `access token contains user id and role`() {
        val token = jwtProvider.generateAccessToken(
            userId = 1L,
            email = "user@example.com",
            role = "ADMIN"
        )

        jwtProvider.validate(token)

        assertThat(jwtProvider.getSubject(token)).isEqualTo("user@example.com")
        assertThat(jwtProvider.getUserId(token)).isEqualTo(1L)
        assertThat(jwtProvider.getRole(token)).isEqualTo("ADMIN")
    }

    /**
     * - 이메일이 없는 소셜 계정 토큰의 subject fallback을 검증한다.
     * - subject는 null이 될 수 없으므로 userId 문자열을 사용한다.
     */
    @Test
    fun `token subject falls back to user id when email is null`() {
        val token = jwtProvider.generateAccessToken(
            userId = 7L,
            email = null,
            role = "USER"
        )

        assertThat(jwtProvider.getSubject(token)).isEqualTo("7")
        assertThat(jwtProvider.getRole(token)).isEqualTo("USER")
    }

    /**
     * - 형식이 잘못된 토큰은 INVALID_TOKEN으로 변환되는지 검증한다.
     * - JJWT 내부 예외가 외부로 직접 노출되지 않아야 한다.
     */
    @Test
    fun `invalid token throws invalid token exception`() {
        val exception = assertThrows(CustomException::class.java) {
            jwtProvider.validate("invalid.token.value")
        }

        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_TOKEN)
    }
}
