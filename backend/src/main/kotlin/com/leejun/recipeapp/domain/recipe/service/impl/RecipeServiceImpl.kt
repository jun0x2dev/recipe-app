package com.leejun.recipeapp.domain.recipe.service.impl

import com.leejun.recipeapp.domain.auth.repository.UserRepository
import com.leejun.recipeapp.domain.recipe.dto.CreateRecipeRequest
import com.leejun.recipeapp.domain.recipe.dto.RecipeResponse
import com.leejun.recipeapp.domain.recipe.entity.Recipe
import com.leejun.recipeapp.domain.recipe.repository.RecipeRepository
import com.leejun.recipeapp.domain.recipe.service.RecipeService
import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * - 레시피 작성 정책을 구현하는 서비스다.
 * - JWT에서 전달된 사용자 ID로 작성자를 조회하고 레시피/재료/단계를 한 번에 저장한다.
 * - 생성 API는 AI 추출 결과와 수동 작성 결과가 같은 저장 구조를 쓰도록 설계한다.
 */
@Service
class RecipeServiceImpl(
    private val recipeRepository: RecipeRepository,
    private val userRepository: UserRepository
) : RecipeService {

    /**
     * - 인증된 사용자의 새 레시피를 저장한다.
     * - 입력 문자열은 앞뒤 공백을 제거해 저장 품질을 일정하게 유지한다.
     * - 작성자 ID가 더 이상 유효하지 않으면 표준 사용자 오류로 처리한다.
     */
    @Transactional
    override fun createRecipe(userId: Long, request: CreateRecipeRequest): RecipeResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { CustomException(ErrorCode.USER_NOT_FOUND) }

        val recipe = Recipe.create(
            user = user,
            title = request.title.trim(),
            description = request.description?.trim()?.ifBlank { null },
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
}
