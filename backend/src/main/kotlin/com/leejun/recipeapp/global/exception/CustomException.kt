package com.leejun.recipeapp.global.exception

/**
 * - 애플리케이션에서 의도적으로 발생시키는 비즈니스 예외다.
 * - ErrorCode를 통해 HTTP 상태와 사용자 메시지를 함께 전달한다.
 * - GlobalExceptionHandler에서 공통 실패 응답으로 변환된다.
 */
class CustomException(val errorCode: ErrorCode) : RuntimeException(errorCode.message)
