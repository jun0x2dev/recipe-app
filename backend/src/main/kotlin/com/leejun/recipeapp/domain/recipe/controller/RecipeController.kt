package com.leejun.recipeapp.domain.recipe.controller

import com.leejun.recipeapp.domain.recipe.dto.*
import com.leejun.recipeapp.domain.recipe.service.RecipeService
import com.leejun.recipeapp.global.response.ApiResponse
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

/**
 * - 레시피 API 요청을 받는 REST 컨트롤러다.
 * - `/api/v1/recipes` 경로는 SecurityConfig의 기본 정책에 따라 JWT 인증이 필요하다.
 */
@RestController
@RequestMapping("/api/v1/recipes")
class RecipeController(
    private val recipeService: RecipeService
) {

    /**
     * - 인증된 사용자의 수동 작성 레시피를 생성한다.
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

    /**
     * - 인증된 사용자의 레시피 목록을 페이징 조회한다.
     * - keyword로 제목 검색을 지원한다.
     */
    @GetMapping
    fun getMyRecipes(
        authentication: Authentication,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ApiResponse<Page<RecipeListResponse>> {
        val userId = authentication.principal as Long
        return ApiResponse.ok(recipeService.getMyRecipes(userId, keyword, PageRequest.of(page, size)))
    }

    /**
     * - 공개 레시피 목록을 페이징 조회한다.
     * - 둘러보기 화면에서 사용한다.
     */
    @GetMapping("/public")
    fun getPublicRecipes(
        authentication: Authentication,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ApiResponse<Page<RecipeListResponse>> {
        return ApiResponse.ok(recipeService.getPublicRecipes(keyword, PageRequest.of(page, size)))
    }

    /**
     * - 레시피 상세를 조회한다.
     * - 본인 레시피이거나 공개 레시피만 접근할 수 있다.
     */
    @GetMapping("/{id}")
    fun getRecipe(
        authentication: Authentication,
        @PathVariable id: Long
    ): ApiResponse<RecipeResponse> {
        val userId = authentication.principal as Long
        return ApiResponse.ok(recipeService.getRecipe(userId, id))
    }

    /**
     * - 본인 레시피를 수정한다.
     */
    @PutMapping("/{id}")
    fun updateRecipe(
        authentication: Authentication,
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateRecipeRequest
    ): ApiResponse<RecipeResponse> {
        val userId = authentication.principal as Long
        return ApiResponse.ok(recipeService.updateRecipe(userId, id, request))
    }

    /**
     * - 본인 레시피를 논리 삭제한다.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteRecipe(
        authentication: Authentication,
        @PathVariable id: Long
    ) {
        val userId = authentication.principal as Long
        recipeService.deleteRecipe(userId, id)
    }
}
