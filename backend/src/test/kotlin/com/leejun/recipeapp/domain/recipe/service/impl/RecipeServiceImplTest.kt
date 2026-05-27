package com.leejun.recipeapp.domain.recipe.service.impl

import com.leejun.recipeapp.domain.auth.entity.User
import com.leejun.recipeapp.domain.auth.repository.UserRepository
import com.leejun.recipeapp.domain.recipe.dto.CreateRecipeRequest
import com.leejun.recipeapp.domain.recipe.dto.RecipeIngredientRequest
import com.leejun.recipeapp.domain.recipe.dto.RecipeStepRequest
import com.leejun.recipeapp.domain.recipe.entity.Recipe
import com.leejun.recipeapp.domain.recipe.entity.RecipeLike
import com.leejun.recipeapp.domain.recipe.entity.RecipeVisibility
import com.leejun.recipeapp.domain.recipe.entity.RecipeCategory
import com.leejun.recipeapp.domain.recipe.repository.RecipeLikeRepository
import com.leejun.recipeapp.domain.recipe.repository.RecipeRepository
import com.leejun.recipeapp.domain.recipe.service.RecipeCategoryClassifier
import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.Optional

/**
 * - RecipeServiceImpl의 수동 작성 저장 흐름을 검증한다.
 * - Repository는 mock으로 대체해 엔티티 구성과 예외 정책을 빠르게 확인한다.
 * - 레시피 생성 API의 핵심 회귀 방지 테스트다.
 */
class RecipeServiceImplTest {

    private lateinit var recipeRepository: RecipeRepository
    private lateinit var recipeLikeRepository: RecipeLikeRepository
    private lateinit var userRepository: UserRepository
    private lateinit var categoryClassifier: RecipeCategoryClassifier
    private lateinit var recipeService: RecipeServiceImpl

    /**
     * - 각 테스트마다 독립적인 mock Repository와 서비스 인스턴스를 준비한다.
     */
    @BeforeEach
    fun setUp() {
        recipeRepository = mockk()
        recipeLikeRepository = mockk()
        userRepository = mockk()
        categoryClassifier = mockk()
        every { categoryClassifier.classify(any()) } returns null
        recipeService = RecipeServiceImpl(recipeRepository, recipeLikeRepository, userRepository, categoryClassifier)
    }

    /**
     * - 레시피 생성 요청을 Recipe 엔티티와 하위 재료/단계로 변환해 저장하는지 확인한다.
     * - 재료와 단계의 입력 순서가 sortOrder로 보존되어야 한다.
     */
    @Test
    fun `create recipe saves recipe with ingredients and steps`() {
        val user = User.create("user@example.com", "encoded-password", "user")
        val request = CreateRecipeRequest(
            title = " 토마토 계란 볶음 ",
            description = " 간단한 아침 메뉴 ",
            servings = 2,
            cookingTimeMinutes = 10,
            visibility = RecipeVisibility.PRIVATE,
            ingredients = listOf(
                RecipeIngredientRequest("토마토", "2개"),
                RecipeIngredientRequest("계란", "3개")
            ),
            steps = listOf(
                RecipeStepRequest("토마토를 썬다."),
                RecipeStepRequest("계란과 함께 볶는다.")
            )
        )

        every { userRepository.findById(1L) } returns Optional.of(user)
        every { recipeRepository.save(any<Recipe>()) } answers { firstArg<Recipe>() }

        val response = recipeService.createRecipe(1L, request)

        assertThat(response.title).isEqualTo("토마토 계란 볶음")
        assertThat(response.description).isEqualTo("간단한 아침 메뉴")
        assertThat(response.servings).isEqualTo(2)
        assertThat(response.cookingTimeMinutes).isEqualTo(10)
        assertThat(response.visibility).isEqualTo(RecipeVisibility.PRIVATE)
        assertThat(response.ingredients).hasSize(2)
        assertThat(response.ingredients[0].name).isEqualTo("토마토")
        assertThat(response.steps).hasSize(2)
        assertThat(response.steps[0].order).isEqualTo(1)
        verify { recipeRepository.save(match { it.ingredients.size == 2 && it.steps.size == 2 }) }
    }

    /**
     * - JWT의 userId에 해당하는 사용자가 없으면 저장을 중단하는지 확인한다.
     * - 이 경우 표준 USER_NOT_FOUND 오류를 사용한다.
     */
    @Test
    fun `create recipe rejects missing user`() {
        every { userRepository.findById(999L) } returns Optional.empty()

        val exception = assertThrows(CustomException::class.java) {
            recipeService.createRecipe(
                999L,
                CreateRecipeRequest(
                    title = "레시피",
                    description = null,
                    servings = null,
                    cookingTimeMinutes = null,
                    visibility = RecipeVisibility.PRIVATE
                )
            )
        }

        assertThat(exception.errorCode).isEqualTo(ErrorCode.USER_NOT_FOUND)
    }

    /**
     * - 좋아요가 없는 상태에서 토글하면 좋아요가 등록되고 true를 반환하는지 확인한다.
     */
    @Test
    fun `toggleLike creates like when not yet liked`() {
        val user = User.create("user@example.com", "encoded-password", "user")
        val recipe = Recipe.create(user, "테스트 레시피", null, null, null, RecipeVisibility.PUBLIC)

        every { recipeRepository.findByIdAndDeletedAtIsNull(1L) } returns recipe
        every { userRepository.findById(1L) } returns Optional.of(user)
        every { recipeLikeRepository.existsByUserIdAndRecipeId(1L, 1L) } returns false
        every { recipeLikeRepository.save(any<RecipeLike>()) } answers { firstArg<RecipeLike>() }

        val result = recipeService.toggleLike(1L, 1L)

        assertThat(result).isTrue()
        assertThat(recipe.likeCount).isEqualTo(1)
        verify { recipeLikeRepository.save(any<RecipeLike>()) }
    }

    /**
     * - 이미 좋아요한 상태에서 토글하면 좋아요가 삭제되고 false를 반환하는지 확인한다.
     */
    @Test
    fun `toggleLike removes like when already liked`() {
        val user = User.create("user@example.com", "encoded-password", "user")
        val recipe = Recipe.create(user, "테스트 레시피", null, null, null, RecipeVisibility.PUBLIC)
        recipe.incrementLikeCount()

        every { recipeRepository.findByIdAndDeletedAtIsNull(1L) } returns recipe
        every { userRepository.findById(1L) } returns Optional.of(user)
        every { recipeLikeRepository.existsByUserIdAndRecipeId(1L, 1L) } returns true
        justRun { recipeLikeRepository.deleteByUserIdAndRecipeId(1L, 1L) }

        val result = recipeService.toggleLike(1L, 1L)

        assertThat(result).isFalse()
        assertThat(recipe.likeCount).isEqualTo(0)
        verify { recipeLikeRepository.deleteByUserIdAndRecipeId(1L, 1L) }
    }

    /**
     * - 삭제된 레시피에 좋아요를 시도하면 RECIPE_NOT_FOUND 오류가 발생하는지 확인한다.
     */
    @Test
    fun `toggleLike rejects deleted recipe`() {
        every { recipeRepository.findByIdAndDeletedAtIsNull(999L) } returns null

        val exception = assertThrows(CustomException::class.java) {
            recipeService.toggleLike(1L, 999L)
        }

        assertThat(exception.errorCode).isEqualTo(ErrorCode.RECIPE_NOT_FOUND)
    }
}
