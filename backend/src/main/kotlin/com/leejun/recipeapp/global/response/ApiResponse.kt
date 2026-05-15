package com.leejun.recipeapp.global.response

/**
 * - 모든 API 성공/실패 응답의 공통 래퍼다.
 * - success가 true면 data를 사용하고, false면 error를 사용한다.
 * - 컨트롤러와 예외 핸들러가 같은 응답 구조를 공유하도록 한다.
 */
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: ApiError?
) {
    companion object {
        /**
         * - 성공 응답을 생성한다.
         * - data에는 클라이언트가 사용할 실제 결과를 담는다.
         */
        fun <T> ok(data: T): ApiResponse<T> = ApiResponse(true, data, null)

        /**
         * - 실패 응답을 생성한다.
         * - error에는 표준화된 코드와 메시지를 담는다.
         */
        fun <T> fail(error: ApiError): ApiResponse<T> = ApiResponse(false, null, error)
    }
}

/**
 * - API 실패 사유를 표현한다.
 * - code는 클라이언트 분기 처리에 사용한다.
 * - message는 사용자 또는 개발자가 읽을 수 있는 설명이다.
 */
data class ApiError(
    val code: String,
    val message: String
)
