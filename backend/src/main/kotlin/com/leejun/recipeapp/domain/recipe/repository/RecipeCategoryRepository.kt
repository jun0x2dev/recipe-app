package com.leejun.recipeapp.domain.recipe.repository

import com.leejun.recipeapp.domain.recipe.entity.RecipeCategory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

/**
 * - 레시피 카테고리 저장소다.
 * - 카테고리 목록 조회와 키워드 기반 분류에 사용한다.
 */
interface RecipeCategoryRepository : JpaRepository<RecipeCategory, Long> {

    /**
     * - 모든 카테고리를 정렬 순서대로 조회한다.
     * - 모바일 앱에서 카테고리 목록 캐싱 시 사용한다.
     */
    fun findAllByOrderBySortOrderAsc(): List<RecipeCategory>

    /**
     * - '기타' 카테고리를 조회한다.
     * - 키워드 매칭 실패 시 기본 카테고리로 사용한다.
     */
    fun findByName(name: String): RecipeCategory?
}
