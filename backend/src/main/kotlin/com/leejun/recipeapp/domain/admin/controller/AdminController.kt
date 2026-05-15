package com.leejun.recipeapp.domain.admin.controller

import com.leejun.recipeapp.global.response.ApiResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * - 관리자 전용 API의 진입점을 담당한다.
 * - `/api/v1/admin/` 하위 경로는 SecurityConfig에서 ADMIN 권한으로 제한된다.
 * - 현재 엔드포인트는 권한 분리 동작을 검증하기 위한 최소 확인용 API다.
 */
@RestController
@RequestMapping("/api/v1/admin")
class AdminController {

    /**
     * - 관리자 권한을 가진 토큰으로만 호출 가능한 상태 확인 API다.
     * - 실제 운영 지표가 아니라 보안 경계 검증을 위한 고정 응답을 반환한다.
     */
    @GetMapping("/health")
    fun health(): ApiResponse<String> = ApiResponse.ok("admin-ok")
}
