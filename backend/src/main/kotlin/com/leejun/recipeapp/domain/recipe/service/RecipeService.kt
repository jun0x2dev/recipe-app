package com.leejun.recipeapp.domain.recipe.service

import com.leejun.recipeapp.domain.recipe.dto.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

/**
 * - 레시피 도메인 서비스 계약이다.
 * - 컨트롤러는 이 인터페이스에 의존해 저장 정책과 영속성 구현을 분리한다.
 */
interface RecipeService {

    /**
     * - 인증된 사용자의 수동 작성 레시피를 생성한다.
     */
    fun createRecipe(userId: Long, request: CreateRecipeRequest): RecipeResponse

    /**
     * - 레시피 상세를 조회한다.
     * - 본인 레시피이거나 공개 레시피만 조회할 수 있다.
     */
    fun getRecipe(userId: Long, recipeId: Long): RecipeResponse

    /**
     * - 인증된 사용자의 레시피 목록을 페이징 조회한다.
     */
    fun getMyRecipes(userId: Long, keyword: String?, pageable: Pageable): Page<RecipeListResponse>

    /**
     * - 공개 레시피 목록을 페이징 조회한다.
     */
    fun getPublicRecipes(keyword: String?, pageable: Pageable): Page<RecipeListResponse>

    /**
     * - 본인 레시피를 수정한다.
     */
    fun updateRecipe(userId: Long, recipeId: Long, request: UpdateRecipeRequest): RecipeResponse

    /**
     * - 본인 레시피를 논리 삭제한다.
     */
    fun deleteRecipe(userId: Long, recipeId: Long)
}
