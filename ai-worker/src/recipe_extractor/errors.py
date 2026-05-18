"""Common error types and codes for the AI worker.

- Spring Boot의 ErrorCode처럼 API/CLI에서 공유할 오류 코드를 한곳에 둔다.
- 각 예외는 사용자-facing `code`, HTTP `status_code`, 메시지를 함께 가진다.
- 도메인 모듈은 이 예외를 던지고, API 계층은 이를 HTTP 응답으로 변환한다.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ErrorCode(str, Enum):
    """AI Worker에서 사용하는 표준 오류 코드."""

    INVALID_YOUTUBE_URL = "INVALID_YOUTUBE_URL"
    UNSUPPORTED_YOUTUBE_URL = "UNSUPPORTED_YOUTUBE_URL"
    YOUTUBE_VIDEO_UNAVAILABLE = "YOUTUBE_VIDEO_UNAVAILABLE"
    YOUTUBE_ACCESS_DENIED = "YOUTUBE_ACCESS_DENIED"
    YOUTUBE_DEPENDENCY_MISSING = "YOUTUBE_DEPENDENCY_MISSING"
    YOUTUBE_METADATA_ERROR = "YOUTUBE_METADATA_ERROR"
    AUDIO_DOWNLOAD_ERROR = "AUDIO_DOWNLOAD_ERROR"
    STT_ERROR = "STT_ERROR"
    RECIPE_EXTRACTION_ERROR = "RECIPE_EXTRACTION_ERROR"
    NOT_RECIPE_CONTENT = "NOT_RECIPE_CONTENT"


@dataclass(frozen=True)
class ErrorSpec:
    """클라이언트에 노출할 표준 에러 사양."""

    status_code: int
    message: str


ERROR_SPECS = {
    ErrorCode.INVALID_YOUTUBE_URL: ErrorSpec(400, "올바른 유튜브 쇼츠 URL을 입력해주세요."),
    ErrorCode.UNSUPPORTED_YOUTUBE_URL: ErrorSpec(400, "현재는 유튜브 쇼츠 URL만 지원합니다."),
    ErrorCode.YOUTUBE_VIDEO_UNAVAILABLE: ErrorSpec(404, "영상을 찾을 수 없거나 사용할 수 없습니다."),
    ErrorCode.YOUTUBE_ACCESS_DENIED: ErrorSpec(403, "유튜브 접근이 차단되었거나 인증이 필요합니다."),
    ErrorCode.YOUTUBE_DEPENDENCY_MISSING: ErrorSpec(500, "유튜브 처리에 필요한 서버 의존성이 누락되었습니다."),
    ErrorCode.YOUTUBE_METADATA_ERROR: ErrorSpec(502, "유튜브 영상 정보를 가져오지 못했습니다."),
    ErrorCode.AUDIO_DOWNLOAD_ERROR: ErrorSpec(502, "유튜브 오디오를 다운로드하지 못했습니다."),
    ErrorCode.STT_ERROR: ErrorSpec(502, "영상 음성을 텍스트로 변환하지 못했습니다."),
    ErrorCode.RECIPE_EXTRACTION_ERROR: ErrorSpec(502, "레시피 초안을 생성하지 못했습니다."),
    ErrorCode.NOT_RECIPE_CONTENT: ErrorSpec(422, "요리 레시피 영상으로 판단하기 어렵습니다."),
}


class AppError(RuntimeError):
    """AI Worker의 공통 예외 기반 클래스.

    - `ErrorCode`에 매핑된 표준 status/message를 사용한다.
    - 내부 원인이나 원본 도구 오류는 `debug_message`에만 보관한다.
    """

    code = ErrorCode.RECIPE_EXTRACTION_ERROR

    def __init__(self, debug_message: Optional[str] = None):
        self.spec = ERROR_SPECS[self.code]
        self.status_code = self.spec.status_code
        self.message = self.spec.message
        self.debug_message = debug_message
        super().__init__(self.message)


class YouTubeMetadataError(AppError):
    """유튜브 메타데이터 추출 실패를 표현하는 예외."""

    code = ErrorCode.YOUTUBE_METADATA_ERROR


class InvalidYouTubeUrlError(YouTubeMetadataError):
    """입력값이 URL 형식이 아니거나 유튜브 URL이 아닐 때 사용한다."""

    code = ErrorCode.INVALID_YOUTUBE_URL


class UnsupportedYouTubeUrlError(YouTubeMetadataError):
    """지원 범위가 아닌 유튜브 URL일 때 사용한다."""

    code = ErrorCode.UNSUPPORTED_YOUTUBE_URL


class YouTubeVideoUnavailableError(YouTubeMetadataError):
    """삭제, 비공개, 존재하지 않는 영상일 때 사용한다."""

    code = ErrorCode.YOUTUBE_VIDEO_UNAVAILABLE


class YouTubeAccessDeniedError(YouTubeMetadataError):
    """유튜브 접근이 차단되거나 인증이 필요한 경우 사용한다."""

    code = ErrorCode.YOUTUBE_ACCESS_DENIED


class YouTubeDependencyError(YouTubeMetadataError):
    """yt-dlp 등 실행 의존성이 없을 때 사용한다."""

    code = ErrorCode.YOUTUBE_DEPENDENCY_MISSING


class AudioDownloadError(AppError):
    """오디오 다운로드 실패를 표현하는 예외."""

    code = ErrorCode.AUDIO_DOWNLOAD_ERROR


class SpeechToTextError(AppError):
    """STT 처리 실패를 표현하는 예외."""

    code = ErrorCode.STT_ERROR


class RecipeExtractionError(AppError):
    """레시피 초안 추출 실패를 표현하는 예외."""

    code = ErrorCode.RECIPE_EXTRACTION_ERROR


class RecipeRelevanceError(AppError):
    """요리 레시피 영상으로 보기 어려운 경우 사용한다."""

    code = ErrorCode.NOT_RECIPE_CONTENT
