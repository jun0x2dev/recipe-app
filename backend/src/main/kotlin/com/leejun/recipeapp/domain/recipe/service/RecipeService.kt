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
     * - userId를 받아 각 레시피의 좋아요 여부를 함께 반환한다.
     */
    fun getPublicRecipes(userId: Long, keyword: String?, pageable: Pageable): Page<RecipeListResponse>

    /**
     * - 본인 레시피를 수정한다.
     */
    fun updateRecipe(userId: Long, recipeId: Long, request: UpdateRecipeRequest): RecipeResponse

    /**
     * - 본인 레시피를 논리 삭제한다.
     */
    fun deleteRecipe(userId: Long, recipeId: Long)

    /**
     * - 레시피 좋아요를 토글한다.
     * - 이미 좋아요 상태이면 취소하고 false를 반환한다.
     * - 좋아요 상태가 아니면 등록하고 true를 반환한다.
     */
    fun toggleLike(userId: Long, recipeId: Long): Boolean

    /**
     * - 특정 사용자가 특정 레시피에 좋아요를 눌렀는지 확인한다.
     */
    fun isLiked(userId: Long, recipeId: Long): Boolean

    /**
     * - 사용자가 좋아요한 레시피 목록을 페이징 조회한다.
     * - 최신 좋아요 순으로 정렬한다.
     */
    fun getLikedRecipes(userId: Long, pageable: Pageable): Page<RecipeListResponse>
}
