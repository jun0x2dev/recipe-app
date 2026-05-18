package com.leejun.recipeapp.domain.recipe.repository

import com.leejun.recipeapp.domain.recipe.entity.Recipe
import com.leejun.recipeapp.domain.recipe.entity.RecipeVisibility
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

/**
 * - 레시피 엔티티의 영속성 접근을 담당한다.
 * - 삭제되지 않은 레시피만 조회하도록 deletedAt IS NULL 조건을 공통 적용한다.
 */
interface RecipeRepository : JpaRepository<Recipe, Long> {

    /**
     * - 삭제되지 않은 단일 레시피를 조회한다.
     */
    fun findByIdAndDeletedAtIsNull(id: Long): Recipe?

    /**
     * - 특정 사용자의 레시피를 최신순으로 페이징 조회한다.
     * - keyword가 null이면 전체 조회, 있으면 제목 부분 일치 검색한다.
     * - keyword는 서비스에서 '%keyword%' 형태로 전달한다.
     */
    @Query(
        """
        SELECT r FROM Recipe r
        WHERE r.user.id = :userId
          AND r.deletedAt IS NULL
          AND (:keyword IS NULL OR LOWER(r.title) LIKE :keyword)
        ORDER BY r.createdAt DESC
        """
    )
    fun findMyRecipes(userId: Long, keyword: String?, pageable: Pageable): Page<Recipe>

    /**
     * - 공개 레시피를 최신순으로 페이징 조회한다.
     * - 둘러보기 화면에서 사용한다.
     */
    @Query(
        """
        SELECT r FROM Recipe r
        WHERE r.visibility = :visibility
          AND r.deletedAt IS NULL
          AND (:keyword IS NULL OR LOWER(r.title) LIKE :keyword)
        ORDER BY r.createdAt DESC
        """
    )
    fun findByVisibility(visibility: RecipeVisibility, keyword: String?, pageable: Pageable): Page<Recipe>
}
