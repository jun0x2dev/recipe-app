"""YouTube metadata extraction utilities.

- MVP에서는 유튜브 쇼츠 URL만 허용한다.
- yt-dlp를 사용해 제목, 설명란, 길이, 채널명 등 레시피 추출에 필요한 정보를 읽는다.
- 다운로드는 하지 않고 메타데이터 조회만 수행한다.
"""

from __future__ import annotations

from typing import Optional
from urllib.parse import parse_qs, urlparse

from recipe_extractor.errors import (
    InvalidYouTubeUrlError,
    UnsupportedYouTubeUrlError,
    YouTubeAccessDeniedError,
    YouTubeDependencyError,
    YouTubeMetadataError,
    YouTubeVideoUnavailableError,
)
from recipe_extractor.schemas import YouTubeMetadata


def is_youtube_shorts_url(url: str) -> bool:
    """입력 URL이 유튜브 쇼츠 URL인지 확인한다.

    - MVP 범위를 유튜브 쇼츠로 제한하기 위한 1차 가드다.
    - `youtube.com/shorts/{id}` 형식을 허용한다.
    - 공유 과정에서 붙는 query string은 허용한다.
    """

    parsed = urlparse(url)
    host = parsed.netloc.lower()
    path_parts = [part for part in parsed.path.split("/") if part]

    return host in {"www.youtube.com", "youtube.com", "m.youtube.com"} and len(path_parts) >= 2 and path_parts[0] == "shorts"


def validate_youtube_shorts_url(url: str) -> None:
    """서비스 입력 URL을 검증한다.

    - URL 형식이 아니면 `INVALID_YOUTUBE_URL`로 구분한다.
    - 유튜브지만 Shorts가 아니면 `UNSUPPORTED_YOUTUBE_URL`로 구분한다.
    - 현재 MVP는 유튜브 쇼츠만 지원한다.
    """

    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if parsed.scheme not in {"http", "https"} or not host:
        raise InvalidYouTubeUrlError(f"raw_url={url}")

    youtube_hosts = {"www.youtube.com", "youtube.com", "m.youtube.com", "youtu.be"}
    if host not in youtube_hosts:
        raise InvalidYouTubeUrlError(f"unsupported_host={host}")

    if not is_youtube_shorts_url(url):
        raise UnsupportedYouTubeUrlError(f"raw_url={url}")


def extract_video_id_from_shorts_url(url: str) -> Optional[str]:
    """유튜브 쇼츠 URL에서 영상 ID를 추출한다.

    - `/shorts/{videoId}` 경로를 우선 사용한다.
    - 예외적으로 `v` query가 있으면 보조값으로 사용한다.
    """

    parsed = urlparse(url)
    path_parts = [part for part in parsed.path.split("/") if part]

    if len(path_parts) >= 2 and path_parts[0] == "shorts":
        return path_parts[1]

    query = parse_qs(parsed.query)
    values = query.get("v")
    return values[0] if values else None


def fetch_youtube_metadata(url: str) -> YouTubeMetadata:
    """유튜브 쇼츠 메타데이터를 조회한다.

    - 실제 영상 파일은 다운로드하지 않는다.
    - 제목과 설명란은 LLM 입력에서 가장 높은 우선순위를 갖는다.
    - yt-dlp 오류는 앱 계층에서 처리하기 쉽도록 `YouTubeMetadataError`로 감싼다.
    """

    validate_youtube_shorts_url(url)

    try:
        import yt_dlp
    except ModuleNotFoundError as error:
        raise YouTubeDependencyError(
            "yt-dlp가 설치되어 있지 않습니다. ai-worker에서 `python -m pip install -e .`를 먼저 실행하세요."
        ) from error

    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": False,
    }

    try:
        with yt_dlp.YoutubeDL(options) as youtube:
            info = youtube.extract_info(url, download=False)
    except Exception as error:  # noqa: BLE001 - yt-dlp raises several concrete exception types.
        raise classify_youtube_metadata_error(error) from error

    if not isinstance(info, dict):
        raise YouTubeMetadataError("yt-dlp response is not a dict")

    return YouTubeMetadata(
        url=url,
        video_id=info.get("id") or extract_video_id_from_shorts_url(url),
        title=info.get("title") or "",
        description=info.get("description") or "",
        duration_seconds=info.get("duration"),
        channel_name=info.get("channel") or info.get("uploader"),
        thumbnail_url=info.get("thumbnail"),
        tags=list(info.get("tags") or []),
        raw=info,
    )


def classify_youtube_metadata_error(error: Exception) -> YouTubeMetadataError:
    """yt-dlp 오류 메시지를 사용자-facing 오류로 분류한다."""

    message = str(error)
    lowered = message.lower()

    unavailable_markers = [
        "video unavailable",
        "this video is unavailable",
        "private video",
        "removed",
        "does not exist",
        "unable to extract",
        "404",
    ]
    access_markers = [
        "403",
        "forbidden",
        "sign in to confirm",
        "login required",
        "cookies",
    ]

    if any(marker in lowered for marker in unavailable_markers):
        return YouTubeVideoUnavailableError(message)

    if any(marker in lowered for marker in access_markers):
        return YouTubeAccessDeniedError(message)

    return YouTubeMetadataError(message)
