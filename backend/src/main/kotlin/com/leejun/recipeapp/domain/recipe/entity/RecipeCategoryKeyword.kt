package com.leejun.recipeapp.domain.recipe.entity

import jakarta.persistence.*

/**
 * - 카테고리 자동 분류에 사용하는 키워드 엔티티다.
 * - 레시피 제목에 이 키워드가 포함되면 연결된 카테고리로 분류한다.
 * - 운영 중 키워드 추가/삭제는 DB에서 직접 수행할 수 있어 배포가 필요 없다.
 */
@Entity
@Table(name = "recipe_category_keywords")
class RecipeCategoryKeyword(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    val category: RecipeCategory,

    @Column(nullable = false, length = 50)
    val keyword: String
)
