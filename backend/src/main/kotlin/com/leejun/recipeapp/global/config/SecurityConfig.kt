package com.leejun.recipeapp.global.config

import com.leejun.recipeapp.global.security.JwtAuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

/**
 * - Spring Security 전역 정책을 정의한다.
 * - 인증 API와 actuator 일부 경로는 공개하고, 나머지는 JWT 인증을 요구한다.
 * - 관리자 API는 ADMIN 권한을 가진 토큰만 접근할 수 있도록 제한한다.
 */
@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter
) {

    /**
     * - HTTP 보안 필터 체인을 구성한다.
     * - 세션을 사용하지 않는 stateless API 인증 방식을 적용한다.
     * - JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 배치한다.
     */
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                    .anyRequest().authenticated()
            }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
            .build()
    }

    /**
     * - 사용자 비밀번호 암호화에 사용할 PasswordEncoder를 제공한다.
     * - 현재 구현은 BCrypt를 사용한다.
     */
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
}
