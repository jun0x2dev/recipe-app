package com.leejun.recipeapp.domain.recipe.service

import com.leejun.recipeapp.domain.recipe.entity.RecipeCategory
import com.leejun.recipeapp.domain.recipe.repository.RecipeCategoryKeywordRepository
import com.leejun.recipeapp.domain.recipe.repository.RecipeCategoryRepository
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Component

/**
 * - 레시피 제목으로 카테고리를 자동 분류하는 컴포넌트다.
 * - DB에서 키워드 사전을 로드해 메모리에 캐싱한다.
 * - 긴 키워드부터 매칭해 "볶음밥"이 "볶음"(반찬)보다 "밥" 카테고리에 우선 매칭되도록 한다.
 * - 매칭 실패 시 '기타' 카테고리를 반환한다.
 */
@Component
class RecipeCategoryClassifier(
    private val categoryKeywordRepository: RecipeCategoryKeywordRepository,
    private val categoryRepository: RecipeCategoryRepository
) {
    /**
     * - 키워드 → 카테고리 매핑 캐시다.
     * - 긴 키워드가 먼저 오도록 정렬해 구체적 매칭을 우선한다.
     */
    private var keywordMap: List<Pair<String, RecipeCategory>> = emptyList()

    /**
     * - 매칭 실패 시 사용하는 기본 카테고리다.
     */
    private var defaultCategory: RecipeCategory? = null

    /**
     * - 앱 시작 시 키워드 사전을 DB에서 로드한다.
     */
    @PostConstruct
    fun loadKeywords() {
        keywordMap = categoryKeywordRepository.findAllWithCategory()
            .map { it.keyword to it.category }
        defaultCategory = categoryRepository.findByName("기타")
    }

    /**
     * - 키워드 사전을 재로드한다.
     * - 운영 중 DB에서 키워드를 추가/삭제한 뒤 호출하면 즉시 반영된다.
     */
    fun reloadKeywords() {
        loadKeywords()
    }

    /**
     * - 레시피 제목에서 카테고리를 추론한다.
     * - 제목에 포함된 가장 긴 키워드에 해당하는 카테고리를 반환한다.
     * - 매칭되는 키워드가 없으면 '기타' 카테고리를 반환한다.
     */
    fun classify(title: String): RecipeCategory? {
        val normalizedTitle = title.lowercase().replace(" ", "")

        for ((keyword, category) in keywordMap) {
            if (normalizedTitle.contains(keyword)) {
                return category
            }
        }

        return defaultCategory
    }
}
