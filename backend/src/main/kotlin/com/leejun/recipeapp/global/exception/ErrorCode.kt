package com.leejun.recipeapp.global.exception

import org.springframework.http.HttpStatus

/**
 * - API 실패 상황을 표준화한 에러 코드 목록이다.
 * - 각 코드는 HTTP 상태와 클라이언트 노출 메시지를 함께 가진다.
 * - 새로운 정책 오류가 생기면 이 enum에 먼저 추가한 뒤 예외 처리에서 사용한다.
 */
enum class ErrorCode(
    val status: HttpStatus,
    val message: String
) {
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "만료된 토큰입니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다."),
    INVALID_OAUTH_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 소셜 로그인 토큰입니다."),
    USER_NOT_ACTIVE(HttpStatus.FORBIDDEN, "사용할 수 없는 계정입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    OAUTH_PROVIDER_ERROR(HttpStatus.BAD_GATEWAY, "소셜 로그인 제공자 응답 처리 중 오류가 발생했습니다."),

    RECIPE_NOT_FOUND(HttpStatus.NOT_FOUND, "레시피를 찾을 수 없습니다."),
    RECIPE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "해당 레시피에 대한 권한이 없습니다."),

    AI_WORKER_UNAVAILABLE(HttpStatus.BAD_GATEWAY, "AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요."),
    AI_WORKER_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "AI 처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."),
    AI_WORKER_ERROR(HttpStatus.BAD_GATEWAY, "AI 레시피 생성 중 오류가 발생했습니다."),

    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다.")
}
