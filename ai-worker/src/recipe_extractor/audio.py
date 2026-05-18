"""Audio download utilities for YouTube Shorts.

- STT 입력으로 사용할 오디오 파일만 임시 저장한다.
- 원본 영상 파일은 저장하지 않는다.
- 다운로드 결과는 `ai-worker/tmp/audio` 아래에 두는 것을 기본값으로 한다.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

from recipe_extractor.errors import AudioDownloadError, YouTubeDependencyError
from recipe_extractor.schemas import DownloadedAudio
from recipe_extractor.youtube import extract_video_id_from_shorts_url, is_youtube_shorts_url


def download_youtube_audio(
    url: str,
    output_dir: Path,
    youtube_client: str = "android",
    cookies_from_browser: Optional[str] = None,
    cookies_file: Optional[Path] = None,
) -> DownloadedAudio:
    """유튜브 쇼츠에서 STT용 오디오를 다운로드한다.

    - `bestaudio/best` 포맷을 사용해 가능한 오디오 전용 스트림을 우선 선택한다.
    - ffmpeg 후처리를 강제하지 않아 로컬 설치 부담을 줄인다.
    - 다운로드된 파일 경로와 포맷 정보를 반환한다.
    - YouTube 403이 발생할 수 있어 기본 player client는 `android`로 둔다.
    - 필요한 경우 브라우저 쿠키 또는 cookies.txt 파일을 전달할 수 있다.
    """

    if not is_youtube_shorts_url(url):
        raise AudioDownloadError(f"raw_url={url}")

    try:
        import yt_dlp
    except ModuleNotFoundError as error:
        raise YouTubeDependencyError(
            "yt-dlp가 설치되어 있지 않습니다. ai-worker에서 `python -m pip install -e .`를 먼저 실행하세요."
        ) from error

    output_dir.mkdir(parents=True, exist_ok=True)

    options: dict[str, Any] = {
        "format": "bestaudio/best",
        "outtmpl": str(output_dir / "%(id)s.%(ext)s"),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "retries": 3,
        "fragment_retries": 3,
        "extractor_args": {
            "youtube": {
                "player_client": [youtube_client],
            },
        },
    }

    if cookies_from_browser:
        options["cookiesfrombrowser"] = (cookies_from_browser,)

    if cookies_file:
        options["cookiefile"] = str(cookies_file)

    try:
        with yt_dlp.YoutubeDL(options) as youtube:
            info = youtube.extract_info(url, download=True)
    except Exception as error:  # noqa: BLE001 - yt-dlp raises several concrete exception types.
        raise AudioDownloadError(str(error)) from error

    if not isinstance(info, dict):
        raise AudioDownloadError("yt-dlp audio response is not a dict")

    audio_path = Path(youtube.prepare_filename(info))
    video_id = info.get("id") or extract_video_id_from_shorts_url(url)

    if not audio_path.exists() and video_id:
        candidates = sorted(output_dir.glob(f"{video_id}.*"))
        if candidates:
            audio_path = candidates[0]

    if not audio_path.exists():
        raise AudioDownloadError(f"downloaded audio file not found: {audio_path}")

    return DownloadedAudio(
        path=audio_path,
        video_id=video_id,
        extension=audio_path.suffix.lstrip(".") or None,
        format_id=info.get("format_id"),
    )
