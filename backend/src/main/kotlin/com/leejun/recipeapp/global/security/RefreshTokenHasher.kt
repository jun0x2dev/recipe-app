package com.leejun.recipeapp.global.security

import org.springframework.stereotype.Component
import java.security.MessageDigest
import java.util.Base64

/**
 * - refresh token 원문을 저장용 해시로 변환한다.
 * - DB에는 원문 토큰 대신 SHA-256 해시의 Base64 문자열만 저장한다.
 * - 토큰 탈취 피해를 줄이기 위한 최소 저장소 보호 장치다.
 */
@Component
class RefreshTokenHasher {

    /**
     * - 전달받은 refresh token 원문을 SHA-256으로 해시한다.
     * - 결과는 DB 저장과 조회에 사용하기 쉽도록 Base64 문자열로 반환한다.
     */
    fun hash(refreshToken: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(refreshToken.toByteArray())
        return Base64.getEncoder().encodeToString(digest)
    }
}
