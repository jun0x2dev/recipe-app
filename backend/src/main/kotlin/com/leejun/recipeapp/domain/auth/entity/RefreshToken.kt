package com.leejun.recipeapp.domain.auth.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

/**
 * - 앱 자체 refresh token 저장소 엔티티다.
 * - tokenHash에는 원문 refresh token이 아니라 해시값만 저장한다.
 * - 로그아웃, 계정 정지, 탈퇴 시 revokedAt을 기록해 재사용을 막는다.
 */
@Entity
@Table(name = "refresh_tokens")
@EntityListeners(AuditingEntityListener::class)
class RefreshToken private constructor(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "token_hash", nullable = false, unique = true)
    val tokenHash: String,

    @Column(name = "device_id", length = 100)
    val deviceId: String? = null,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    var revokedAt: LocalDateTime? = null
        private set

    @CreatedDate
    @Column(updatable = false)
    var createdAt: LocalDateTime? = null
        private set

    /**
     * - refresh token을 폐기 처리한다.
     * - 폐기된 토큰은 재발급 요청에 사용할 수 없어야 한다.
     */
    fun revoke(revokedAt: LocalDateTime) {
        this.revokedAt = revokedAt
    }

    companion object {
        /**
         * - 새 refresh token 저장 레코드를 생성한다.
         * - tokenHash는 저장 전에 해시된 값이어야 한다.
         * - deviceId는 기기별 세션 관리가 필요할 때 사용한다.
         */
        fun create(
            user: User,
            tokenHash: String,
            expiresAt: LocalDateTime,
            deviceId: String? = null
        ): RefreshToken = RefreshToken(
            user = user,
            tokenHash = tokenHash,
            expiresAt = expiresAt,
            deviceId = deviceId
        )
    }
}
