package com.leejun.recipeapp.domain.recipe.entity

import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * - 레시피 카테고리 엔티티다.
 * - 밥, 면, 파스타 등 음식 종류를 분류한다.
 * - thumbnailUrl은 모바일 앱에서 카테고리 썸네일 이미지를 매핑하는 키다.
 * - NULL이면 썸네일 없이 표시한다.
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
     * - 카테고리 썸네일 이미지 키(또는 URL)다.
     * - 모바일 앱에서 로컬 에셋 매핑에 사용하며, 추후 S3 URL로 전환 가능하다.
     * - NULL이면 해당 카테고리의 썸네일을 표시하지 않는다.
     */
    @Column(name = "thumbnail_url", length = 500)
    val thumbnailUrl: String? = null,

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
