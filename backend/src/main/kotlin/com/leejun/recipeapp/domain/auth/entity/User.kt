package com.leejun.recipeapp.domain.auth.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

/**
 * - 앱 내부 사용자를 표현하는 기준 엔티티다.
 * - 로그인 제공자와 무관하게 권한, 상태, 닉네임 같은 공통 사용자 정보를 보관한다.
 * - 소셜 전용 계정을 지원하기 위해 email과 password는 nullable로 둔다.
 */
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener::class)
class User private constructor(
    @Column(name = "email")
    val email: String?,

    @Column(name = "password")
    var password: String?,

    @Column(nullable = false, length = 50)
    val nickname: String,

    @Column(name = "profile_image_url")
    val profileImageUrl: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val role: UserRole = UserRole.USER,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: UserStatus = UserStatus.ACTIVE
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

    var deletedAt: LocalDateTime? = null
        private set

    companion object {
        /**
         * - 이메일/비밀번호 회원가입 사용자를 생성한다.
         * - encodedPassword에는 이미 암호화된 비밀번호만 전달한다.
         */
        fun create(email: String, encodedPassword: String, nickname: String): User =
            User(email = email, password = encodedPassword, nickname = nickname)

        /**
         * - Apple, 네이버, 구글 같은 소셜 로그인 사용자를 생성한다.
         * - 자체 비밀번호가 없으므로 password는 null로 저장한다.
         */
        fun createSocialUser(
            email: String?,
            nickname: String,
            profileImageUrl: String? = null,
            status: UserStatus = UserStatus.ACTIVE
        ): User =
            User(
                email = email,
                password = null,
                nickname = nickname,
                profileImageUrl = profileImageUrl,
                status = status
            )
    }

    /**
     * - 사용자의 이메일 로그인 비밀번호를 갱신한다.
     * - 호출자는 반드시 BCrypt 등으로 암호화된 값을 전달해야 한다.
     */
    fun updatePassword(encodedPassword: String) {
        this.password = encodedPassword
    }

    /**
     * - 사용자 삭제 시각을 기록한다.
     * - 상태 전환 정책은 추후 계정 삭제 API에서 함께 다룬다.
     */
    fun delete(deletedAt: LocalDateTime) {
        this.deletedAt = deletedAt
    }
}

/**
 * - 사용자 권한을 표현한다.
 * - USER는 일반 사용자, ADMIN은 운영 관리자 권한이다.
 */
enum class UserRole {
    USER, ADMIN
}

/**
 * - 사용자 계정 상태를 표현한다.
 * - 정지 또는 삭제 상태의 사용자는 주요 API 접근을 차단하는 방향으로 확장한다.
 */
enum class UserStatus {
    ACTIVE, SUSPENDED, DELETED
}
