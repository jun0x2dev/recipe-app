package com.leejun.recipeapp.global.security

import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.Date
import java.util.UUID

/**
 * - 앱 자체 JWT의 생성과 검증을 담당한다.
 * - userId와 role을 클레임에 포함해 인증/인가 필터에서 사용한다.
 * - 토큰 파싱 실패는 CustomException으로 변환해 전역 정책과 맞춘다.
 */
@Component
class JwtProvider(
    @Value("\${jwt.secret}") private val secret: String,
    @Value("\${jwt.access-token-expiry}") private val accessTokenExpiry: Long,
    @Value("\${jwt.refresh-token-expiry}") private val refreshTokenExpiry: Long
) {
    private val secretKey by lazy { Keys.hmacShaKeyFor(secret.toByteArray()) }

    /**
     * - API 인증에 사용할 access token을 생성한다.
     * - subject는 이메일이 있으면 이메일, 없으면 userId 문자열을 사용한다.
     */
    fun generateAccessToken(userId: Long, email: String?, role: String): String =
        buildToken(userId, email, role, accessTokenExpiry)

    /**
     * - access token 재발급에 사용할 refresh token을 생성한다.
     * - 저장소 구현 전까지는 access token과 같은 클레임 구조를 사용한다.
     */
    fun generateRefreshToken(userId: Long, email: String?, role: String): String =
        buildToken(userId, email, role, refreshTokenExpiry)

    /**
     * - refresh token의 만료 기간을 밀리초 단위로 반환한다.
     * - refresh token 저장소의 expiresAt 계산에 사용한다.
     */
    fun getRefreshTokenExpiryMillis(): Long = refreshTokenExpiry

    /**
     * - JWT subject를 반환한다.
     * - 이메일 없는 소셜 계정은 userId 문자열이 subject가 될 수 있다.
     */
    fun getSubject(token: String): String = getClaims(token).subject

    /**
     * - JWT에서 내부 사용자 ID를 추출한다.
     * - 인증 필터에서는 이 값을 principal로 사용한다.
     */
    fun getUserId(token: String): Long = (getClaims(token)["userId"] as Number).toLong()

    /**
     * - JWT에서 사용자 권한을 추출한다.
     * - Security 권한 매핑 시 ROLE_ 접두사를 붙여 사용한다.
     */
    fun getRole(token: String): String = getClaims(token)["role"] as String

    /**
     * - JWT 서명과 만료 여부를 검증한다.
     * - 검증 실패 시 INVALID_TOKEN 또는 TOKEN_EXPIRED로 변환한다.
     */
    fun validate(token: String) {
        getClaims(token)
    }

    /**
     * - 공통 JWT 빌드 로직이다.
     * - 토큰 만료 시간은 호출자가 access/refresh 정책에 따라 전달한다.
     * - jti를 넣어 같은 사용자에게 같은 시각에 발급해도 토큰 문자열이 달라지게 한다.
     */
    private fun buildToken(userId: Long, email: String?, role: String, expiry: Long): String {
        val now = Date()
        return Jwts.builder()
            .id(UUID.randomUUID().toString())
            .subject(email ?: userId.toString())
            .claim("userId", userId)
            .claim("role", role)
            .issuedAt(now)
            .expiration(Date(now.time + expiry))
            .signWith(secretKey)
            .compact()
    }

    /**
     * - JWT payload claims를 파싱한다.
     * - JJWT 예외를 도메인 공통 예외로 감싸 컨트롤러 응답 형식을 통일한다.
     */
    private fun getClaims(token: String) = try {
        Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .payload
    } catch (e: ExpiredJwtException) {
        throw CustomException(ErrorCode.TOKEN_EXPIRED)
    } catch (e: JwtException) {
        throw CustomException(ErrorCode.INVALID_TOKEN)
    }
}
