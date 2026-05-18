package com.leejun.recipeapp.domain.recipe.entity

import jakarta.persistence.*

/**
 * - 레시피의 단일 조리 단계를 표현한다.
 * - description은 사용자가 입력한 단계 설명이다.
 * - sortOrder는 입력 순서와 화면 표시 순서를 안정적으로 보존한다.
 */
@Entity
@Table(name = "recipe_steps")
class RecipeStep private constructor(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    val recipe: Recipe,

    @Column(nullable = false, columnDefinition = "text")
    val description: String,

    @Column(name = "sort_order", nullable = false)
    val sortOrder: Int
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    companion object {
        /**
         * - 레시피 하위 조리 단계 엔티티를 생성한다.
         * - 외부에서는 Recipe.addStep을 통해 연결하는 것을 기본으로 한다.
         */
        fun create(recipe: Recipe, description: String, sortOrder: Int): RecipeStep =
            RecipeStep(recipe, description, sortOrder)
    }
}
