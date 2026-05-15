package com.leejun.recipeapp.domain.auth.controller

import com.leejun.recipeapp.domain.auth.dto.LoginRequest
import com.leejun.recipeapp.domain.auth.dto.NaverLoginRequest
import com.leejun.recipeapp.domain.auth.dto.RefreshTokenRequest
import com.leejun.recipeapp.domain.auth.dto.SignUpRequest
import com.leejun.recipeapp.domain.auth.dto.TokenResponse
import com.leejun.recipeapp.domain.auth.service.AuthService
import com.leejun.recipeapp.global.response.ApiResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

/**
 * - 인증 API 요청을 받는 REST 컨트롤러다.
 * - 이메일/비밀번호 기반 회원가입과 로그인을 AuthService로 위임한다.
 * - 자체 회원가입은 MVP 후순위지만 기존 개발 흐름 검증을 위해 유지한다.
 */
@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService
) {

    /**
     * - 신규 사용자를 생성하고 앱 자체 JWT를 발급한다.
     * - 요청 DTO의 validation 실패는 GlobalExceptionHandler에서 공통 응답으로 변환된다.
     * - 성공 시 HTTP 201 상태를 반환한다.
     */
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    fun signUp(@Valid @RequestBody request: SignUpRequest): ApiResponse<TokenResponse> =
        ApiResponse.ok(authService.signUp(request))

    /**
     * - 이메일과 비밀번호를 검증하고 앱 자체 JWT를 발급한다.
     * - 소셜 전용 계정처럼 비밀번호가 없는 계정은 인증 실패로 처리한다.
     */
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ApiResponse<TokenResponse> =
        ApiResponse.ok(authService.login(request))

    /**
     * - 모바일 앱이 네이버에서 발급받은 access token을 받아 앱 자체 JWT로 교환한다.
     * - 신규 네이버 사용자는 내부 사용자와 제공자 연결 정보를 함께 생성한다.
     * - 네이버 access token은 서버 DB에 저장하지 않는다.
     */
    @PostMapping("/oauth/naver")
    fun loginWithNaver(@Valid @RequestBody request: NaverLoginRequest): ApiResponse<TokenResponse> =
        ApiResponse.ok(authService.loginWithNaver(request))

    /**
     * - 유효한 refresh token으로 새로운 access token과 refresh token을 발급한다.
     * - 재발급에 성공하면 기존 refresh token은 폐기하고 새 refresh token만 활성 상태로 둔다.
     */
    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody request: RefreshTokenRequest): ApiResponse<TokenResponse> =
        ApiResponse.ok(authService.refresh(request))

    /**
     * - 전달받은 refresh token을 폐기해 이후 재사용을 막는다.
     * - access token은 stateless 구조라 서버 저장소에서 직접 삭제하지 않는다.
     */
    @PostMapping("/logout")
    fun logout(@Valid @RequestBody request: RefreshTokenRequest): ApiResponse<String> {
        authService.logout(request)
        return ApiResponse.ok("logout-ok")
    }
}
