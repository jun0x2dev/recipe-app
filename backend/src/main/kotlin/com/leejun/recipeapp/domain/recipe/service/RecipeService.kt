package com.leejun.recipeapp.domain.recipe.service

import com.leejun.recipeapp.domain.recipe.dto.CreateRecipeRequest
import com.leejun.recipeapp.domain.recipe.dto.RecipeResponse

/**
 * - 레시피 도메인 서비스 계약이다.
 * - 컨트롤러는 이 인터페이스에 의존해 저장 정책과 영속성 구현을 분리한다.
 */
interface RecipeService {
    /**
     * - 인증된 사용자의 수동 작성 레시피를 생성한다.
     * - userId는 JWT 인증 principal에서 전달받은 내부 사용자 ID다.
     */
    fun createRecipe(userId: Long, request: CreateRecipeRequest): RecipeResponse
}
