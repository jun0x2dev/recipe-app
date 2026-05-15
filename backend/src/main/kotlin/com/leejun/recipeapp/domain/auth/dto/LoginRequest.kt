package com.leejun.recipeapp.domain.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

/**
 * - 이메일/비밀번호 로그인 요청 값을 표현한다.
 * - 이메일은 형식과 공백 여부를 검증한다.
 * - 비밀번호는 인증 비교에만 사용하고 응답으로 노출하지 않는다.
 */
data class LoginRequest(
    @field:Email(message = "올바른 이메일 형식이 아닙니다.")
    @field:NotBlank(message = "이메일은 필수입니다.")
    val email: String,

    @field:NotBlank(message = "비밀번호는 필수입니다.")
    val password: String
)
