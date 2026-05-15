package com.leejun.recipeapp.global.security

import com.leejun.recipeapp.global.exception.CustomException
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * - Authorization 헤더의 Bearer 토큰을 읽어 Spring Security 인증 객체로 변환한다.
 * - JWT가 유효하면 userId를 principal로, role 클레임을 권한으로 등록한다.
 * - 토큰이 없거나 유효하지 않으면 인증 컨텍스트를 비우고 다음 필터로 넘긴다.
 */
@Component
class JwtAuthenticationFilter(
    private val jwtProvider: JwtProvider
) : OncePerRequestFilter() {

    /**
     * - 요청마다 한 번 실행되는 JWT 인증 필터 본문이다.
     * - 유효한 토큰은 SecurityContextHolder에 인증 정보로 저장한다.
     * - 잘못된 토큰은 CustomException을 잡아 인증 없이 진행하게 한다.
     */
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val token = resolveToken(request)
        if (token != null) {
            try {
                jwtProvider.validate(token)
                val role = jwtProvider.getRole(token)
                val auth = UsernamePasswordAuthenticationToken(
                    jwtProvider.getUserId(token),
                    null,
                    listOf(SimpleGrantedAuthority("ROLE_$role"))
                )
                SecurityContextHolder.getContext().authentication = auth
            } catch (e: CustomException) {
                SecurityContextHolder.clearContext()
            }
        }
        filterChain.doFilter(request, response)
    }

    /**
     * - Authorization 헤더에서 Bearer 토큰 값을 추출한다.
     * - Bearer 접두사가 없으면 인증 토큰이 없는 요청으로 처리한다.
     */
    private fun resolveToken(request: HttpServletRequest): String? {
        val bearer = request.getHeader("Authorization") ?: return null
        return if (bearer.startsWith("Bearer ")) bearer.substring(7) else null
    }
}
