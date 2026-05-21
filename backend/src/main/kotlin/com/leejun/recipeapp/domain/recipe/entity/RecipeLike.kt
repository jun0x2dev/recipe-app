package com.leejun.recipeapp.domain.recipe.entity

import com.leejun.recipeapp.domain.auth.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * - 사용자의 레시피 좋아요 상태를 저장하는 엔티티다.
 * - user_id + recipe_id 조합은 유니크 제약으로 중복을 방지한다.
 * - 좋아요 취소 시에는 레코드를 삭제한다. (토글 방식)
 */
@Entity
@Table(
    name = "recipe_likes",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "recipe_id"])]
)
class RecipeLike private constructor(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    val recipe: Recipe
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()

    companion object {
        /**
         * - 새 좋아요 레코드를 생성한다.
         * - 서비스 계층에서 중복 체크 후 호출해야 한다.
         */
        fun create(user: User, recipe: Recipe): RecipeLike =
            RecipeLike(user = user, recipe = recipe)
    }
}
