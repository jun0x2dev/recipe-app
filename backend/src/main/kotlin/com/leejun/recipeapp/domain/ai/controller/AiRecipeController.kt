package com.leejun.recipeapp.domain.ai.controller

import com.leejun.recipeapp.domain.ai.client.AiWorkerClient
import com.leejun.recipeapp.domain.ai.dto.AiExtractRequest
import com.leejun.recipeapp.domain.ai.dto.AiGenerateRequest
import com.leejun.recipeapp.global.response.ApiResponse
import jakarta.validation.Valid
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * - AI 레시피 생성/추출 요청을 받아 AI Worker로 프록시하는 컨트롤러다.
 * - `/api/v1/ai/recipes` 경로는 SecurityConfig 기본 정책에 따라 JWT 인증이 필요하다.
 * - 모바일 앱이 AI Worker를 직접 호출하지 않고 백엔드를 거치도록 하여
 *   인증, 로깅, rate limiting을 일원화한다.
 */
@RestController
@RequestMapping("/api/v1/ai/recipes")
class AiRecipeController(
    private val aiWorkerClient: AiWorkerClient
) {

    /**
     * - 음식명을 받아 AI Worker `/generate`로 레시피 초안을 생성한다.
     * - 인증된 사용자만 호출할 수 있다.
     * - AI Worker 응답을 그대로 data에 담아 반환한다.
     */
    @PostMapping("/generate")
    fun generate(
        authentication: Authentication,
        @Valid @RequestBody request: AiGenerateRequest
    ): ApiResponse<Map<String, Any>> {
        return ApiResponse.ok(aiWorkerClient.generate(request.query))
    }

    /**
     * - 유튜브 쇼츠 링크를 받아 AI Worker `/extract`로 레시피를 추출한다.
     * - 인증된 사용자만 호출할 수 있다.
     * - STT + LLM 파이프라인으로 응답 시간이 길 수 있다.
     */
    @PostMapping("/extract")
    fun extract(
        authentication: Authentication,
        @Valid @RequestBody request: AiExtractRequest
    ): ApiResponse<Map<String, Any>> {
        return ApiResponse.ok(aiWorkerClient.extract(request.url))
    }
}
