package com.leejun.recipeapp.domain.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

/**
 * - 이메일/비밀번호 회원가입 요청 값을 표현한다.
 * - MVP에서는 자체 회원가입이 후순위지만 기존 백엔드 검증 흐름을 유지한다.
 * - 비밀번호와 닉네임은 최소 길이 정책을 요청 단계에서 먼저 검증한다.
 */
data class SignUpRequest(
    @field:Email(message = "올바른 이메일 형식이 아닙니다.")
    @field:NotBlank(message = "이메일은 필수입니다.")
    val email: String,

    @field:NotBlank(message = "비밀번호는 필수입니다.")
    @field:Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    val password: String,

    @field:NotBlank(message = "닉네임은 필수입니다.")
    @field:Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다.")
    val nickname: String
)
