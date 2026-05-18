package com.leejun.recipeapp.domain.recipe.controller

import com.leejun.recipeapp.domain.recipe.dto.CreateRecipeRequest
import com.leejun.recipeapp.domain.recipe.dto.RecipeResponse
import com.leejun.recipeapp.domain.recipe.service.RecipeService
import com.leejun.recipeapp.global.response.ApiResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

/**
 * - 레시피 API 요청을 받는 REST 컨트롤러다.
 * - `/api/v1/recipes` 경로는 SecurityConfig의 기본 정책에 따라 JWT 인증이 필요하다.
 * - 현재는 수동 작성 생성 API를 우선 제공한다.
 */
@RestController
@RequestMapping("/api/v1/recipes")
class RecipeController(
    private val recipeService: RecipeService
) {

    /**
     * - 인증된 사용자의 수동 작성 레시피를 생성한다.
     * - JwtAuthenticationFilter가 Authentication principal에 넣은 userId를 작성자 ID로 사용한다.
     * - 성공 시 생성된 레시피 상세 데이터를 반환한다.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createRecipe(
        authentication: Authentication,
        @Valid @RequestBody request: CreateRecipeRequest
    ): ApiResponse<RecipeResponse> {
        val userId = authentication.principal as Long
        return ApiResponse.ok(recipeService.createRecipe(userId, request))
    }
}
