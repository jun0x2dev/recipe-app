package com.leejun.recipeapp.domain.recipe.entity

import jakarta.persistence.*

/**
 * - 레시피에 포함된 단일 재료를 표현한다.
 * - name은 재료명, amount는 사용자가 입력한 계량 문자열이다.
 * - sortOrder는 입력 순서를 보존해 상세 화면에서 자연스럽게 표시하기 위한 값이다.
 */
@Entity
@Table(name = "recipe_ingredients")
class RecipeIngredient private constructor(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    val recipe: Recipe,

    @Column(nullable = false, length = 120)
    val name: String,

    @Column(length = 120)
    val amount: String?,

    @Column(name = "sort_order", nullable = false)
    val sortOrder: Int
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    companion object {
        /**
         * - 레시피 하위 재료 엔티티를 생성한다.
         * - 외부에서는 Recipe.addIngredient를 통해 연결하는 것을 기본으로 한다.
         */
        fun create(recipe: Recipe, name: String, amount: String?, sortOrder: Int): RecipeIngredient =
            RecipeIngredient(recipe, name, amount, sortOrder)
    }
}
