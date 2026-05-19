"""Recipe draft extraction facade.

- 외부 모듈은 이 파일의 `extract_recipe_draft`만 호출한다.
- 실제 구현은 heuristic, Ollama, prompt, postprocess 모듈로 분리한다.
"""

from __future__ import annotations

from typing import Optional

from recipe_extractor.errors import RecipeExtractionError
from recipe_extractor.recipe_heuristic import extract_recipe_draft_heuristic
from recipe_extractor.recipe_ollama import extract_recipe_draft_with_ollama
from recipe_extractor.schemas import RecipeDraft, Transcript, YouTubeMetadata


def extract_recipe_draft(
    metadata: YouTubeMetadata,
    transcript: Optional[Transcript],
    provider: str = "heuristic",
    ollama_model: str = "gemma3:12b",
    ollama_url: str = "http://localhost:11434/api/generate",
) -> RecipeDraft:
    """메타데이터와 STT 결과로 레시피 초안을 만든다."""

    if provider == "heuristic":
        return extract_recipe_draft_heuristic(metadata, transcript)

    if provider == "ollama":
        return extract_recipe_draft_with_ollama(metadata, transcript, ollama_model, ollama_url)

    raise RecipeExtractionError(f"unsupported_provider={provider}")
