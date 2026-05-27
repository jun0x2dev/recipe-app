package com.leejun.recipeapp.domain.recipe.entity

import com.leejun.recipeapp.domain.auth.entity.User
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

/**
 * - 사용자가 작성한 레시피의 기준 엔티티다.
 * - 제목, 설명, 몇 인분, 조리 시간, 공개 범위 같은 핵심 메타데이터를 보관한다.
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

    @Column(name = "servings")
    var servings: Int?,

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

    /**
     * - 레시피의 카테고리다.
     * - 생성/수정 시 제목 키워드 매칭으로 자동 분류된다.
     * - null이면 아직 분류되지 않은 상태다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    var category: RecipeCategory? = null

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
            servings: Int?,
            cookingTimeMinutes: Int?,
            visibility: RecipeVisibility
        ): Recipe =
            Recipe(
                user = user,
                title = title,
                description = description,
                servings = servings,
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

    /**
     * - 레시피의 핵심 메타데이터를 수정한다.
     * - 재료와 조리 단계는 replaceIngredients / replaceSteps로 별도 교체한다.
     */
    fun update(
        title: String,
        description: String?,
        servings: Int?,
        cookingTimeMinutes: Int?,
        visibility: RecipeVisibility
    ) {
        this.title = title
        this.description = description
        this.servings = servings
        this.cookingTimeMinutes = cookingTimeMinutes
        this.visibility = visibility
    }

    /**
     * - 기존 재료를 모두 제거하고 새 재료로 교체한다.
     * - orphanRemoval=true가 제거된 엔티티의 DELETE를 처리한다.
     */
    fun replaceIngredients(newIngredients: List<Pair<String, String?>>) {
        ingredients.clear()
        newIngredients.forEachIndexed { index, (name, amount) ->
            addIngredient(name, amount, index + 1)
        }
    }

    /**
     * - 기존 조리 단계를 모두 제거하고 새 단계로 교체한다.
     */
    fun replaceSteps(newSteps: List<String>) {
        steps.clear()
        newSteps.forEachIndexed { index, description ->
            addStep(description, index + 1)
        }
    }

    /**
     * - 조회수를 1 증가시킨다.
     * - 본인 레시피 조회 시에는 호출하지 않는다. (서비스 계층에서 판단)
     */
    fun incrementViewCount() {
        this.viewCount++
    }

    /**
     * - 좋아요 수를 1 증가시킨다.
     * - RecipeLike 생성과 함께 호출한다.
     */
    fun incrementLikeCount() {
        this.likeCount++
    }

    /**
     * - 좋아요 수를 1 감소시킨다.
     * - RecipeLike 삭제와 함께 호출한다.
     * - 0 이하로 내려가지 않도록 방어한다.
     */
    fun decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--
        }
    }

    /**
     * - 레시피를 논리 삭제한다.
     * - deletedAt이 설정되면 목록/상세 조회에서 제외된다.
     */
    fun softDelete() {
        this.deletedAt = LocalDateTime.now()
    }
}
