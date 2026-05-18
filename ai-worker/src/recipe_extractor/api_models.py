"""FastAPI request and response models.

- API 입출력 DTO를 라우팅 코드에서 분리한다.
- 서비스용 요청은 URL만 받고, 디버그 요청만 튜닝 옵션을 노출한다.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class SimpleExtractRequest(BaseModel):
    """서비스용 유튜브 쇼츠 레시피 추출 요청."""

    url: str = Field(..., description="YouTube Shorts URL")


class DebugExtractRequest(BaseModel):
    """개발자용 유튜브 쇼츠 레시피 추출 요청."""

    url: str = Field(..., description="YouTube Shorts URL")
    download_audio: bool = Field(False, description="Download temporary audio file")
    with_stt: bool = Field(False, description="Transcribe audio with faster-whisper")
    extract_recipe: bool = Field(False, description="Extract recipe draft")
    audio_dir: str = Field("tmp/audio", description="Temporary audio output directory")
    youtube_client: str = Field("android", description="yt-dlp YouTube player client")
    cookies_from_browser: Optional[str] = Field(None, description="Browser name for yt-dlp cookies")
    cookies_file: Optional[str] = Field(None, description="Path to cookies.txt")
    stt_model: str = Field("small", description="faster-whisper model size")
    stt_language: str = Field("ko", description="STT language")
    stt_device: str = Field("cpu", description="STT device")
    stt_compute_type: str = Field("int8", description="STT compute type")
    recipe_provider: Literal["heuristic", "ollama"] = Field("heuristic", description="Recipe extraction provider")
    ollama_model: str = Field("llama3.1", description="Ollama model name")
    ollama_url: str = Field("http://localhost:11434/api/generate", description="Ollama generate API URL")
    enforce_recipe_content: bool = Field(False, description="Reject non-recipe-looking videos before heavy processing")


class HealthResponse(BaseModel):
    """헬스체크 응답."""

    status: str
