package com.leejun.recipeapp.domain.recipe.service.impl

import com.leejun.recipeapp.domain.auth.repository.UserRepository
import com.leejun.recipeapp.domain.recipe.dto.*
import com.leejun.recipeapp.domain.recipe.entity.Recipe
import com.leejun.recipeapp.domain.recipe.entity.RecipeVisibility
import com.leejun.recipeapp.domain.recipe.repository.RecipeRepository
import com.leejun.recipeapp.domain.recipe.service.RecipeService
import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * - 레시피 도메인 서비스 구현체다.
 * - 생성, 조회, 수정, 삭제 정책을 구현한다.
 * - 소유자 검증이 필요한 작업은 공통 헬퍼로 처리한다.
 */
@Service
class RecipeServiceImpl(
    private val recipeRepository: RecipeRepository,
    private val userRepository: UserRepository
) : RecipeService {

    @Transactional
    override fun createRecipe(userId: Long, request: CreateRecipeRequest): RecipeResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { CustomException(ErrorCode.USER_NOT_FOUND) }

        val recipe = Recipe.create(
            user = user,
            title = request.title.trim(),
            description = request.description?.trim()?.ifBlank { null },
            servings = request.servings,
            cookingTimeMinutes = request.cookingTimeMinutes,
            visibility = request.visibility
        )

        request.ingredients
            .mapIndexed { index, ingredient -> index + 1 to ingredient }
            .forEach { (sortOrder, ingredient) ->
                recipe.addIngredient(
                    name = ingredient.name.trim(),
                    amount = ingredient.amount?.trim()?.ifBlank { null },
                    sortOrder = sortOrder
                )
            }

        request.steps
            .mapIndexed { index, step -> index + 1 to step }
            .forEach { (sortOrder, step) ->
                recipe.addStep(
                    description = step.description.trim(),
                    sortOrder = sortOrder
                )
            }

        return RecipeResponse.from(recipeRepository.save(recipe))
    }

    @Transactional(readOnly = true)
    override fun getRecipe(userId: Long, recipeId: Long): RecipeResponse {
        val recipe = findActiveRecipeOrThrow(recipeId)

        if (recipe.user.id != userId && recipe.visibility != RecipeVisibility.PUBLIC) {
            throw CustomException(ErrorCode.RECIPE_ACCESS_DENIED)
        }

        return RecipeResponse.from(recipe)
    }

    @Transactional(readOnly = true)
    override fun getMyRecipes(userId: Long, keyword: String?, pageable: Pageable): Page<RecipeListResponse> {
        val likeKeyword = keyword?.takeIf { it.isNotBlank() }?.let { "%${it.lowercase()}%" }
        return recipeRepository.findMyRecipes(userId, likeKeyword, pageable)
            .map { RecipeListResponse.from(it) }
    }

    @Transactional(readOnly = true)
    override fun getPublicRecipes(keyword: String?, pageable: Pageable): Page<RecipeListResponse> {
        val likeKeyword = keyword?.takeIf { it.isNotBlank() }?.let { "%${it.lowercase()}%" }
        return recipeRepository.findByVisibility(RecipeVisibility.PUBLIC, likeKeyword, pageable)
            .map { RecipeListResponse.from(it) }
    }

    @Transactional
    override fun updateRecipe(userId: Long, recipeId: Long, request: UpdateRecipeRequest): RecipeResponse {
        val recipe = findOwnedRecipeOrThrow(recipeId, userId)

        recipe.update(
            title = request.title.trim(),
            description = request.description?.trim()?.ifBlank { null },
            servings = request.servings,
            cookingTimeMinutes = request.cookingTimeMinutes,
            visibility = request.visibility
        )

        recipe.replaceIngredients(
            request.ingredients.map { it.name.trim() to it.amount?.trim()?.ifBlank { null } }
        )

        recipe.replaceSteps(
            request.steps.map { it.description.trim() }
        )

        return RecipeResponse.from(recipeRepository.save(recipe))
    }

    @Transactional
    override fun deleteRecipe(userId: Long, recipeId: Long) {
        val recipe = findOwnedRecipeOrThrow(recipeId, userId)
        recipe.softDelete()
    }

    private fun findActiveRecipeOrThrow(recipeId: Long): Recipe {
        return recipeRepository.findByIdAndDeletedAtIsNull(recipeId)
            ?: throw CustomException(ErrorCode.RECIPE_NOT_FOUND)
    }

    private fun findOwnedRecipeOrThrow(recipeId: Long, userId: Long): Recipe {
        val recipe = findActiveRecipeOrThrow(recipeId)

        if (recipe.user.id != userId) {
            throw CustomException(ErrorCode.RECIPE_ACCESS_DENIED)
        }

        return recipe
    }
}
