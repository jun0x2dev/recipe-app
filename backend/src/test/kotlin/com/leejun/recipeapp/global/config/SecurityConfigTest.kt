package com.leejun.recipeapp.global.config

import com.leejun.recipeapp.global.security.JwtProvider
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

/**
 * - Spring Security 권한 규칙을 MockMvc로 검증한다.
 * - 실제 SecurityConfig와 JwtAuthenticationFilter를 포함한 test 프로필 컨텍스트를 사용한다.
 * - 관리자 경로가 USER와 ADMIN 권한을 정확히 구분하는지 확인한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var jwtProvider: JwtProvider

    /**
     * - USER 권한 토큰은 관리자 API에 접근할 수 없어야 한다.
     * - 기대 응답은 인증은 되었지만 권한이 부족한 403 Forbidden이다.
     */
    @Test
    fun `admin endpoint rejects user role`() {
        val token = jwtProvider.generateAccessToken(
            userId = 1L,
            email = "user@example.com",
            role = "USER"
        )

        mockMvc.get("/api/v1/admin/health") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isForbidden() }
        }
    }

    /**
     * - ADMIN 권한 토큰은 관리자 API에 접근할 수 있어야 한다.
     * - 응답 본문은 공통 ApiResponse 성공 형식인지 함께 확인한다.
     */
    @Test
    fun `admin endpoint allows admin role`() {
        val token = jwtProvider.generateAccessToken(
            userId = 1L,
            email = "admin@example.com",
            role = "ADMIN"
        )

        mockMvc.get("/api/v1/admin/health") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            jsonPath("$.data") { value("admin-ok") }
        }
    }
}
