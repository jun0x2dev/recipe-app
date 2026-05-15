package com.leejun.recipeapp.domain.auth.repository

import com.leejun.recipeapp.domain.auth.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

/**
 * - 사용자 엔티티의 영속성 접근을 담당한다.
 * - 이메일 로그인 흐름에서 사용자 조회와 중복 검사를 제공한다.
 * - 소셜 로그인은 추후 UserAuthProviderRepository를 별도로 추가해 처리한다.
 */
interface UserRepository : JpaRepository<User, Long> {
    fun findByEmail(email: String): Optional<User>
    fun existsByEmail(email: String): Boolean
}
