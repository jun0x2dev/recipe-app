package com.leejun.recipeapp.domain.recipe.entity

import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * - 레시피 카테고리 엔티티다.
 * - 밥, 면, 파스타 등 음식 종류를 분류한다.
 * - emoji와 color는 모바일 앱에서 카테고리 썸네일을 동적 렌더링할 때 사용한다.
 * - 키워드 매칭으로 레시피를 자동 분류하는 기준이 된다.
 */
@Entity
@Table(name = "recipe_categories")
class RecipeCategory(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, unique = true, length = 30)
    val name: String,

    /**
     * - 카테고리를 대표하는 이모지다.
     * - 모바일 앱의 카테고리 썸네일에 표시한다.
     */
    @Column(nullable = false, length = 10)
    val emoji: String,

    /**
     * - 카테고리 썸네일의 배경색 hex 코드다.
     * - 예: #FF8C42
     */
    @Column(nullable = false, length = 7)
    val color: String,

    @Column(name = "sort_order", nullable = false)
    val sortOrder: Int = 0,

    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    /**
     * - 이 카테고리에 연결된 매칭 키워드 목록이다.
     * - 레시피 제목에 키워드가 포함되면 이 카테고리로 분류한다.
     */
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    val keywords: MutableList<RecipeCategoryKeyword> = mutableListOf()
}
