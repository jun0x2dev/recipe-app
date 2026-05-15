package com.leejun.recipeapp.global.exception

import com.leejun.recipeapp.global.response.ApiError
import com.leejun.recipeapp.global.response.ApiResponse
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

/**
 * - 컨트롤러 계층에서 발생한 예외를 공통 API 응답으로 변환한다.
 * - CustomException은 ErrorCode 기준으로 상태와 메시지를 결정한다.
 * - 예상하지 못한 예외는 로그를 남기고 내부 서버 오류로 숨긴다.
 */
@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * - 비즈니스 예외를 ErrorCode 기반 실패 응답으로 변환한다.
     * - 서비스 계층에서 의도적으로 던진 오류를 클라이언트가 해석할 수 있게 한다.
     */
    @ExceptionHandler(CustomException::class)
    fun handleCustomException(e: CustomException): ResponseEntity<ApiResponse<Nothing>> {
        val errorCode = e.errorCode
        return ResponseEntity.status(errorCode.status)
            .body(ApiResponse.fail(ApiError(errorCode.name, errorCode.message)))
    }

    /**
     * - DTO validation 실패를 400 응답으로 변환한다.
     * - 여러 필드 오류 중 첫 번째 메시지를 우선 반환한다.
     */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(e: MethodArgumentNotValidException): ResponseEntity<ApiResponse<Nothing>> {
        val message = e.bindingResult.fieldErrors.firstOrNull()?.defaultMessage ?: "입력값이 올바르지 않습니다."
        return ResponseEntity.badRequest()
            .body(ApiResponse.fail(ApiError("VALIDATION_ERROR", message)))
    }

    /**
     * - 처리되지 않은 모든 예외의 최종 방어선이다.
     * - 상세 예외는 서버 로그에만 남기고 클라이언트에는 일반 메시지를 반환한다.
     */
    @ExceptionHandler(Exception::class)
    fun handleException(e: Exception): ResponseEntity<ApiResponse<Nothing>> {
        log.error("Unhandled exception", e)
        val errorCode = ErrorCode.INTERNAL_SERVER_ERROR
        return ResponseEntity.status(errorCode.status)
            .body(ApiResponse.fail(ApiError(errorCode.name, errorCode.message)))
    }
}
