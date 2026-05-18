package com.leejun.recipeapp.domain.recipe.entity

import com.leejun.recipeapp.domain.auth.entity.User
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

/**
 * - 사용자가 작성한 레시피의 기준 엔티티다.
 * - 제목, 설명, 조리 시간, 공개 범위 같은 핵심 메타데이터를 보관한다.
 * - 재료와 조리 단계는 순서 보존이 필요하므로 하위 테이블로 분리한다.
 */
@Entity
@Table(name = "recipes")
@EntityListeners(AuditingEntityListener::class)
class Recipe private constructor(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(nullable = false, length = 120)
    var title: String,

    @Column(columnDefinition = "text")
    var description: String?,

    @Column(name = "cooking_time_minutes")
    var cookingTimeMinutes: Int?,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var visibility: RecipeVisibility
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    @OneToMany(mappedBy = "recipe", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("sortOrder asc")
    val ingredients: MutableList<RecipeIngredient> = mutableListOf()

    @OneToMany(mappedBy = "recipe", cascade = [CascadeType.ALL], orphanRemoval = true)
    @OrderBy("sortOrder asc")
    val steps: MutableList<RecipeStep> = mutableListOf()

    @Column(name = "view_count", nullable = false)
    var viewCount: Long = 0
        private set

    @Column(name = "like_count", nullable = false)
    var likeCount: Long = 0
        private set

    @Column(name = "share_count", nullable = false)
    var shareCount: Long = 0
        private set

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    var createdAt: LocalDateTime? = null
        private set

    @LastModifiedDate
    @Column(name = "updated_at")
    var updatedAt: LocalDateTime? = null
        private set

    @Column(name = "deleted_at")
    var deletedAt: LocalDateTime? = null
        private set

    companion object {
        /**
         * - 신규 수동 작성 레시피를 생성한다.
         * - 재료와 조리 단계는 생성 직후 add 함수로 순서와 함께 연결한다.
         */
        fun create(
            user: User,
            title: String,
            description: String?,
            cookingTimeMinutes: Int?,
            visibility: RecipeVisibility
        ): Recipe =
            Recipe(
                user = user,
                title = title,
                description = description,
                cookingTimeMinutes = cookingTimeMinutes,
                visibility = visibility
            )
    }

    /**
     * - 레시피에 재료를 순서와 함께 추가한다.
     * - 입력 순서가 상세 화면 표시 순서가 되므로 서비스 계층에서 정렬된 값으로 호출한다.
     */
    fun addIngredient(name: String, amount: String?, sortOrder: Int) {
        ingredients.add(RecipeIngredient.create(this, name, amount, sortOrder))
    }

    /**
     * - 레시피에 조리 단계를 순서와 함께 추가한다.
     * - sortOrder는 사용자가 입력한 줄 순서를 보존하기 위한 값이다.
     */
    fun addStep(description: String, sortOrder: Int) {
        steps.add(RecipeStep.create(this, description, sortOrder))
    }
}
