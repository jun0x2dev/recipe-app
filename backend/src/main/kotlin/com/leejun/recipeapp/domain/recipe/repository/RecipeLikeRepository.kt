package com.leejun.recipeapp.domain.recipe.repository

import com.leejun.recipeapp.domain.recipe.entity.RecipeLike
import org.springframework.data.jpa.repository.JpaRepository

/**
 * - RecipeLike 엔티티의 저장소다.
 * - 좋아요 토글(존재 여부 확인 → 생성/삭제)에 필요한 쿼리를 제공한다.
 */
interface RecipeLikeRepository : JpaRepository<RecipeLike, Long> {

    /**
     * - 특정 사용자가 특정 레시피에 좋아요를 눌렀는지 확인한다.
     */
    fun existsByUserIdAndRecipeId(userId: Long, recipeId: Long): Boolean

    /**
     * - 특정 사용자의 특정 레시피 좋아요를 삭제한다.
     * - 토글 해제 시 사용한다.
     */
    fun deleteByUserIdAndRecipeId(userId: Long, recipeId: Long)
}
