"""Ollama-backed recipe extraction."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Optional

from recipe_extractor.errors import RecipeExtractionError
from recipe_extractor.recipe_normalization import normalize_transcript_text
from recipe_extractor.recipe_postprocess import recipe_draft_from_mapping
from recipe_extractor.recipe_prompt import build_ollama_prompt
from recipe_extractor.schemas import RecipeDraft, Transcript, YouTubeMetadata


def extract_recipe_draft_with_ollama(
    metadata: YouTubeMetadata,
    transcript: Optional[Transcript],
    model: str,
    url: str,
) -> RecipeDraft:
    """Ollama 로컬 LLM으로 레시피 초안을 추출한다."""

    prompt = build_ollama_prompt(metadata, transcript)
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }

    try:
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=120) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RecipeExtractionError(str(error)) from error

    response_text = data.get("response")
    if not response_text:
        raise RecipeExtractionError("missing response field from Ollama response")

    try:
        parsed = json.loads(response_text)
    except json.JSONDecodeError as error:
        raise RecipeExtractionError(str(error)) from error

    return recipe_draft_from_mapping(
        parsed,
        provider=f"ollama:{model}",
        metadata=metadata,
        normalized_transcript=normalize_transcript_text(transcript.text if transcript else ""),
    )
