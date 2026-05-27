package com.leejun.recipeapp.domain.recipe.controller

import com.leejun.recipeapp.domain.recipe.dto.*
import com.leejun.recipeapp.domain.recipe.repository.RecipeCategoryRepository
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
    private val recipeService: RecipeService,
    private val categoryRepository: RecipeCategoryRepository
) {

    /**
     * - 카테고리 목록을 정렬 순서대로 반환한다.
     * - 모바일 앱에서 카테고리 필터링/표시에 사용한다.
     */
    @GetMapping("/categories")
    fun getCategories(): ApiResponse<List<RecipeCategoryResponse>> {
        val categories = categoryRepository.findAllByOrderBySortOrderAsc()
            .map { RecipeCategoryResponse.from(it) }
        return ApiResponse.ok(categories)
    }


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
     * - 각 레시피에 요청 사용자의 좋아요 여부를 포함한다.
     */
    @GetMapping("/public")
    fun getPublicRecipes(
        authentication: Authentication,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ApiResponse<Page<RecipeListResponse>> {
        val userId = authentication.principal as Long
        return ApiResponse.ok(recipeService.getPublicRecipes(userId, keyword, PageRequest.of(page, size)))
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

    /**
     * - 사용자가 좋아요한 레시피 목록을 페이징 조회한다.
     * - 메뉴 > 좋아요한 레시피 화면에서 사용한다.
     */
    @GetMapping("/liked")
    fun getLikedRecipes(
        authentication: Authentication,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ApiResponse<Page<RecipeListResponse>> {
        val userId = authentication.principal as Long
        return ApiResponse.ok(recipeService.getLikedRecipes(userId, PageRequest.of(page, size)))
    }

    /**
     * - 레시피 좋아요를 토글한다.
     * - 이미 좋아요 상태이면 취소, 아니면 등록한다.
     * - liked: true/false를 반환해 클라이언트가 상태를 갱신할 수 있게 한다.
     */
    @PostMapping("/{id}/like")
    fun toggleLike(
        authentication: Authentication,
        @PathVariable id: Long
    ): ApiResponse<Map<String, Boolean>> {
        val userId = authentication.principal as Long
        val liked = recipeService.toggleLike(userId, id)
        return ApiResponse.ok(mapOf("liked" to liked))
    }
}
