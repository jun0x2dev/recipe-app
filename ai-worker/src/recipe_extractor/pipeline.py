"""Shared extraction pipeline for CLI and API.

- CLI와 FastAPI가 같은 추출 흐름을 사용하도록 공통 로직을 모은다.
- 메타데이터, 오디오 다운로드, STT, 레시피 초안 추출 단계를 옵션으로 조합한다.
- 초기 API는 동기 처리이며, 추후 작업 큐 기반 비동기 처리로 분리할 수 있다.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

from recipe_extractor.audio import download_youtube_audio
from recipe_extractor.recipe import extract_recipe_draft
from recipe_extractor.relevance import ensure_recipe_related
from recipe_extractor.stt import transcribe_audio
from recipe_extractor.youtube import fetch_youtube_metadata


@dataclass(frozen=True)
class ExtractionOptions:
    """레시피 추출 파이프라인 실행 옵션.

    - CLI 인자와 API request body를 같은 형태로 변환해 사용한다.
    - `extract_recipe=true`이면 STT가 필요하므로 오디오 다운로드와 STT를 자동 수행한다.
    """

    download_audio: bool = False
    with_stt: bool = False
    extract_recipe: bool = False
    audio_dir: Path = Path("tmp/audio")
    youtube_client: str = "android"
    cookies_from_browser: Optional[str] = None
    cookies_file: Optional[Path] = None
    stt_model: str = "small"
    stt_language: str = "ko"
    stt_device: str = "cpu"
    stt_compute_type: str = "int8"
    recipe_provider: str = "heuristic"
    ollama_model: str = "gemma3:4b"
    ollama_url: str = "http://localhost:11434/api/generate"
    enforce_recipe_content: bool = False


def run_extraction(url: str, options: ExtractionOptions) -> dict[str, Any]:
    """유튜브 쇼츠 URL에서 요청된 추출 단계를 실행한다.

    - 기본 단계는 메타데이터 추출이다.
    - 오디오/STT/레시피 추출은 옵션에 따라 추가된다.
    - 반환값은 JSON 직렬화 가능한 dict다.
    """

    metadata = fetch_youtube_metadata(url)
    result = metadata.to_public_dict()
    transcript = None

    if options.enforce_recipe_content:
        ensure_recipe_related(metadata)

    # TODO: STT 임시 비활성화 - CPU 처리 속도 문제로 오디오 다운로드/STT 건너뜀
    #       재활성화 시 아래 두 줄을 원래대로 되돌린다:
    #         needs_audio = options.download_audio or options.with_stt or options.extract_recipe
    #         needs_stt = options.with_stt or options.extract_recipe
    needs_audio = options.download_audio or options.with_stt
    needs_stt = options.with_stt

    if needs_audio:
        audio = download_youtube_audio(
            url,
            options.audio_dir,
            youtube_client=options.youtube_client,
            cookies_from_browser=options.cookies_from_browser,
            cookies_file=options.cookies_file,
        )
        result["audio"] = audio.to_public_dict()

        if needs_stt:
            transcript = transcribe_audio(
                audio_path=audio.path,
                model_size=options.stt_model,
                language=options.stt_language,
                device=options.stt_device,
                compute_type=options.stt_compute_type,
            )
            result["transcript"] = transcript.to_public_dict()

    if options.extract_recipe:
        recipe = extract_recipe_draft(
            metadata=metadata,
            transcript=transcript,
            provider=options.recipe_provider,
            ollama_model=options.ollama_model,
            ollama_url=options.ollama_url,
        )
        result["recipe"] = recipe.to_public_dict()

    return result
