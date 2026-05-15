package com.leejun.recipeapp.domain.auth.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

/**
 * - 사용자와 외부 로그인 제공자의 연결 정보를 저장한다.
 * - Apple, 네이버, 구글, 추후 이메일 로그인을 같은 모델로 다룬다.
 * - 로그인 매칭은 이메일이 아니라 provider와 providerUserId 조합을 기준으로 한다.
 */
@Entity
@Table(
    name = "user_auth_providers",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_auth_provider_user", columnNames = ["provider", "provider_user_id"]),
        UniqueConstraint(name = "uk_user_provider", columnNames = ["user_id", "provider"])
    ]
)
@EntityListeners(AuditingEntityListener::class)
class UserAuthProvider private constructor(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val provider: AuthProvider,

    @Column(name = "provider_user_id", nullable = false)
    val providerUserId: String,

    @Column(name = "provider_email")
    val providerEmail: String? = null,

    @Column(name = "email_verified", nullable = false)
    val emailVerified: Boolean = false
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    @CreatedDate
    @Column(updatable = false)
    var createdAt: LocalDateTime? = null
        private set

    @LastModifiedDate
    var updatedAt: LocalDateTime? = null
        private set

    companion object {
        /**
         * - 로그인 제공자 연결 레코드를 생성한다.
         * - providerUserId는 제공자가 보장하는 변경되지 않는 사용자 식별값이어야 한다.
         * - providerEmail은 계정 연결 보조 정보로만 사용한다.
         */
        fun create(
            user: User,
            provider: AuthProvider,
            providerUserId: String,
            providerEmail: String?,
            emailVerified: Boolean
        ): UserAuthProvider = UserAuthProvider(
            user = user,
            provider = provider,
            providerUserId = providerUserId,
            providerEmail = providerEmail,
            emailVerified = emailVerified
        )
    }
}

/**
 * - 앱에서 지원하거나 추후 지원할 인증 제공자를 표현한다.
 * - MVP는 APPLE과 NAVER를 우선하고 GOOGLE은 선택 기능으로 둔다.
 * - EMAIL은 자체 이메일 로그인을 다시 도입할 때 사용한다.
 */
enum class AuthProvider {
    APPLE, NAVER, GOOGLE, EMAIL
}
