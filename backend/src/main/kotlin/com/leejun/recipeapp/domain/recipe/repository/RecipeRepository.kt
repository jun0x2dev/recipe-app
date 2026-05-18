package com.leejun.recipeapp.domain.recipe.repository

import com.leejun.recipeapp.domain.recipe.entity.Recipe
import org.springframework.data.jpa.repository.JpaRepository

/**
 * - 레시피 엔티티의 영속성 접근을 담당한다.
 * - 현재는 생성 API에 필요한 save 기능을 JpaRepository 기본 구현으로 사용한다.
 * - 목록/상세 구현 시 작성자별 조회, 공개 레시피 조회 쿼리를 추가한다.
 */
interface RecipeRepository : JpaRepository<Recipe, Long>
