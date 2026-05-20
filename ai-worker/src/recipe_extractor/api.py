"""FastAPI server for the recipe extraction worker.

- Spring Boot 백엔드가 호출할 수 있는 HTTP API를 제공한다.
- 초기 구현은 동기 처리이며, 긴 작업은 추후 큐 기반 비동기로 전환한다.
- Swagger UI는 `/docs`에서 확인한다.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

# OLLAMA_BASE_URL 환경변수로 컨테이너 환경에서 호스트 Ollama 주소를 지정한다.
_OLLAMA_GENERATE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") + "/api/generate"

from recipe_extractor.errors import (
    AppError,
)
from recipe_extractor.pipeline import ExtractionOptions, run_extraction
from recipe_extractor.recipe_generate import generate_recipe_draft_with_ollama

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from recipe_extractor.api_models import (
        DebugExtractRequest,
        GenerateRecipeRequest,
        HealthResponse,
        SimpleExtractRequest,
    )
except ModuleNotFoundError as error:  # pragma: no cover - dependency 안내용 분기
    raise RuntimeError(
        "FastAPI 의존성이 설치되어 있지 않습니다. "
        "`python -m pip install -e \".[api,stt]\"`를 실행하세요."
    ) from error


app = FastAPI(
    title="Recipe AI Worker",
    description="YouTube Shorts recipe extraction worker API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:19006",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """서버 상태를 확인한다."""

    return HealthResponse(status="ok")


@app.post("/extract", tags=["service"])
def extract(request: SimpleExtractRequest) -> dict[str, Any]:
    """유튜브 쇼츠 URL만 받아 레시피 초안을 반환한다.

    - 사용자-facing 서비스 API다.
    - 내부 기본값으로 오디오 다운로드, STT, Ollama 레시피 추출을 수행한다.
    - 현재는 동기 처리이며, 앱 연동 전 비동기 작업 큐 전환을 검토한다.
    """

    options = ExtractionOptions(
        extract_recipe=True,
        stt_model="small",
        stt_language="ko",
        stt_device="cpu",
        stt_compute_type="int8",
        recipe_provider="ollama",
        ollama_model="gemma3:4b",
        ollama_url=_OLLAMA_GENERATE_URL,
        enforce_recipe_content=True,
    )

    return run_extraction_or_raise(request.url, options, include_debug=False)


@app.post("/generate", tags=["service"])
def generate_recipe(request: GenerateRecipeRequest) -> dict[str, Any]:
    """음식명 또는 짧은 요청 문장으로 레시피 초안을 생성한다.

    - 유튜브 링크 없이 사용자가 입력한 음식명만으로 동작한다.
    - 결과는 근거 기반 추출이 아니라 AI 생성 초안이므로 저장 전 사용자 검토가 필요하다.
    """

    try:
        recipe = generate_recipe_draft_with_ollama(
            query=request.query,
            model=request.ollama_model,
            url=request.ollama_url,
        )
    except AppError as error:
        detail = {
            "code": error.code.value,
            "message": error.message,
        }
        raise HTTPException(status_code=error.status_code, detail=detail) from error

    return {
        "query": request.query,
        "recipe": recipe.to_public_dict(),
    }


@app.post("/debug/extract", tags=["debug"])
def debug_extract(request: DebugExtractRequest) -> dict[str, Any]:
    """튜닝 옵션을 직접 지정해 추출 파이프라인을 실행한다.

    - Swagger에서 STT/LLM 옵션을 실험하기 위한 개발자용 엔드포인트다.
    - Spring Boot 또는 모바일 앱에서는 `/extract`를 사용한다.
    """

    options = ExtractionOptions(
        download_audio=request.download_audio,
        with_stt=request.with_stt,
        extract_recipe=request.extract_recipe,
        audio_dir=Path(request.audio_dir),
        youtube_client=request.youtube_client,
        cookies_from_browser=request.cookies_from_browser,
        cookies_file=Path(request.cookies_file) if request.cookies_file else None,
        stt_model=request.stt_model,
        stt_language=request.stt_language,
        stt_device=request.stt_device,
        stt_compute_type=request.stt_compute_type,
        recipe_provider=request.recipe_provider,
        ollama_model=request.ollama_model,
        ollama_url=request.ollama_url,
        enforce_recipe_content=request.enforce_recipe_content,
    )

    return run_extraction_or_raise(request.url, options, include_debug=True)


def run_extraction_or_raise(url: str, options: ExtractionOptions, include_debug: bool = False) -> dict[str, Any]:
    """파이프라인 예외를 HTTP 응답으로 변환한다.

    - 서비스 API는 클라이언트 노출용 code/message만 반환한다.
    - 디버그 API는 원인 분석을 위해 내부 debug_message를 함께 반환한다.
    """

    try:
        return run_extraction(url, options)
    except AppError as error:
        detail = {
            "code": error.code.value,
            "message": error.message,
        }
        if include_debug and error.debug_message:
            detail["debug_message"] = error.debug_message

        raise HTTPException(
            status_code=error.status_code,
            detail=detail,
        ) from error


def main() -> None:
    """개발용 API 서버를 실행한다."""

    try:
        import uvicorn
    except ModuleNotFoundError as error:
        raise RuntimeError(
            "uvicorn이 설치되어 있지 않습니다. `python -m pip install -e \".[api,stt]\"`를 실행하세요."
        ) from error

    uvicorn.run("recipe_extractor.api:app", host="0.0.0.0", port=8001, reload=False)


if __name__ == "__main__":
    main()
