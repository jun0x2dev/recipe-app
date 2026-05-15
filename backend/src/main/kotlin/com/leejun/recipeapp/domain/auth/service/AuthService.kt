package com.leejun.recipeapp.domain.auth.service

import com.leejun.recipeapp.domain.auth.dto.LoginRequest
import com.leejun.recipeapp.domain.auth.dto.NaverLoginRequest
import com.leejun.recipeapp.domain.auth.dto.RefreshTokenRequest
import com.leejun.recipeapp.domain.auth.dto.SignUpRequest
import com.leejun.recipeapp.domain.auth.dto.TokenResponse

/**
 * - 인증 유스케이스의 진입 인터페이스다.
 * - 컨트롤러는 구현체 세부사항을 알지 않고 회원가입과 로그인을 요청한다.
 * - 소셜 로그인 도입 시 제공자별 인증 메서드를 이 계층에 확장한다.
 */
interface AuthService {
    fun signUp(request: SignUpRequest): TokenResponse
    fun login(request: LoginRequest): TokenResponse
    fun loginWithNaver(request: NaverLoginRequest): TokenResponse
    fun refresh(request: RefreshTokenRequest): TokenResponse
    fun logout(request: RefreshTokenRequest)
}
