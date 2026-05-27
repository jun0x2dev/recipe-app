package com.leejun.recipeapp.domain.recipe.repository

import com.leejun.recipeapp.domain.recipe.entity.RecipeCategoryKeyword
import org.springframework.data.jpa.repository.JpaRepository

/**
 * - 카테고리 키워드 저장소다.
 * - 전체 키워드를 조회해 카테고리 분류 서비스에서 사용한다.
 */
interface RecipeCategoryKeywordRepository : JpaRepository<RecipeCategoryKeyword, Long> {

    /**
     * - 모든 키워드를 카테고리와 함께 조회한다.
     * - fetch join으로 N+1을 방지한다.
     */
    @org.springframework.data.jpa.repository.Query(
        "SELECT k FROM RecipeCategoryKeyword k JOIN FETCH k.category ORDER BY LENGTH(k.keyword) DESC"
    )
    fun findAllWithCategory(): List<RecipeCategoryKeyword>
}
