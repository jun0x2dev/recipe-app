"""Post-processing for LLM recipe extraction results."""

from __future__ import annotations

import re
from typing import Any, Optional

from recipe_extractor.recipe_normalization import normalize_amount, normalize_transcript_text
from recipe_extractor.schemas import (
    RecipeDraft,
    RecipeIngredientDraft,
    RecipeStepDraft,
    YouTubeMetadata,
)


def recipe_draft_from_mapping(
    data: dict[str, Any],
    provider: str,
    metadata: YouTubeMetadata,
    normalized_transcript: str,
) -> RecipeDraft:
    """LLM JSON dict를 내부 RecipeDraft로 변환한다."""

    ingredients = [
        normalize_ingredient_mapping(item, metadata, normalized_transcript)
        for item in data.get("ingredients", [])
        if str(item.get("name", "")).strip()
    ]
    steps = [
        normalize_step_mapping(item, index, metadata, normalized_transcript)
        for index, item in enumerate(data.get("steps", []))
        if str(item.get("description", "")).strip()
    ]

    return RecipeDraft(
        title=str(data.get("title") or "요리 제목 확인 필요"),
        title_source=str(data.get("title_source") or "unknown"),
        description=normalize_recipe_description(data.get("description"), metadata),
        servings=normalize_servings(data.get("servings")),
        servings_source=normalize_servings_source(
            data.get("servings_source"),
            data.get("servings"),
            metadata,
            normalized_transcript,
        ),
        estimated_cooking_time_minutes=normalize_estimated_time(data.get("estimated_cooking_time_minutes")),
        extraction_status="draft",
        ingredients=ingredients,
        steps=steps,
        notes=[str(note).strip() for note in data.get("notes", []) if str(note).strip()],
        provider=provider,
    )


def normalize_recipe_description(value: Any, metadata: YouTubeMetadata) -> Optional[str]:
    """LLM이 반환한 레시피 소개 문구를 앱 표시용으로 정리한다.

    - 너무 긴 설명은 카드 UI에서 쓰기 어렵기 때문에 짧게 제한한다.
    - 값이 없으면 영상 제목을 바탕으로 최소한의 설명을 만든다.
    """

    description = str(value or "").strip()
    if not description:
        title = metadata.title.strip()
        return f"{title} 레시피 초안입니다." if title else None

    return description[:120]


def normalize_servings(value: Any) -> Optional[int]:
    """몇 인분 값을 정수로 보정한다.

    - 설명란/LLM 결과에 `2인분`, `2 servings`처럼 문자열로 올 수 있어 숫자만 추출한다.
    - 근거가 없거나 비현실적인 값은 None으로 두어 사용자가 직접 입력하게 한다.
    """

    if value is None:
        return None

    match = re.search(r"\d+", str(value))
    if not match:
        return None

    servings = int(match.group())
    if servings <= 0 or servings > 30:
        return None

    return servings


def normalize_servings_source(
    value: Any,
    servings: Any,
    metadata: YouTubeMetadata,
    normalized_transcript: str,
) -> str:
    """몇 인분 값의 출처를 표준 문자열로 보정한다.

    - LLM이 명확한 설명란 근거 없이 재료량으로 추정한 경우 `estimated`로 둔다.
    - servings 값이 없으면 source도 `unknown`으로 맞춘다.
    - LLM이 source를 과신할 수 있어 실제 텍스트에 인분 표현이 있는지도 확인한다.
    """

    normalized_servings = normalize_servings(servings)
    if normalized_servings is None:
        return "unknown"

    source = str(value or "").lower().strip()
    if source == "description" and has_servings_evidence(metadata.description, normalized_servings):
        return "description"

    if source == "speech" and has_servings_evidence(normalized_transcript, normalized_servings):
        return "speech"

    if source in {"description", "speech", "estimated"}:
        return "estimated"

    return "estimated"


def has_servings_evidence(text: str, servings: int) -> bool:
    """텍스트에 실제 몇 인분 근거가 있는지 확인한다."""

    if not text:
        return False

    patterns = [
        rf"{servings}\s*인분",
        rf"{servings}\s*명",
        rf"{servings}\s*servings?",
    ]

    return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)


def normalize_estimated_time(value: Any) -> Optional[int]:
    """AI가 추정한 조리 시간을 분 단위 정수로 보정한다.

    - 쇼츠 기반 추정값이므로 과도하게 큰 값은 잘라낸다.
    - 알 수 없는 경우에는 None으로 두어 앱에서 직접 입력하게 한다.
    """

    if value is None:
        return None

    try:
        minutes = int(float(value))
    except (TypeError, ValueError):
        return None

    if minutes <= 0:
        return None

    return min(minutes, 240)


def normalize_ingredient_mapping(
    item: dict[str, Any],
    metadata: YouTubeMetadata,
    normalized_transcript: str,
) -> RecipeIngredientDraft:
    """LLM이 반환한 재료 항목의 출처와 신뢰도를 보정한다."""

    name = normalize_transcript_text(str(item.get("name", "")).strip())
    amount = normalize_amount(str(item.get("amount"))) if item.get("amount") is not None else None
    source = normalize_source(str(item.get("source", "unknown")), name, amount, metadata, normalized_transcript)
    confidence = normalize_confidence(float(item.get("confidence", 0.5)), source, amount)

    if is_ambiguous_sauce_name(name):
        confidence = min(confidence, 0.45)

    return RecipeIngredientDraft(
        name=name,
        amount=amount,
        source=source,
        confidence=confidence,
    )


def normalize_step_mapping(
    item: dict[str, Any],
    index: int,
    metadata: YouTubeMetadata,
    normalized_transcript: str,
) -> RecipeStepDraft:
    """LLM이 반환한 조리 단계의 출처와 신뢰도를 보정한다."""

    description = normalize_transcript_text(str(item.get("description", "")).strip())
    source = normalize_source(str(item.get("source", "unknown")), description, None, metadata, normalized_transcript)
    confidence = normalize_confidence(float(item.get("confidence", 0.5)), source, description)

    if is_ambiguous_sauce_name(description):
        confidence = min(confidence, 0.55)

    return RecipeStepDraft(
        order=int(item.get("order", index + 1)),
        description=description,
        source=source,
        confidence=confidence,
    )


def normalize_source(
    source: str,
    text: str,
    amount: Optional[str],
    metadata: YouTubeMetadata,
    normalized_transcript: str,
) -> str:
    """반환 source가 실제 근거와 맞는지 보정한다."""

    normalized_source = source.lower().strip()
    description = normalize_transcript_text(metadata.description)
    metadata_text = normalize_transcript_text(" ".join([metadata.title, " ".join(metadata.tags)]))

    if normalized_source in {"none", "null", ""}:
        normalized_source = "unknown"

    if text and text in description:
        return "description"

    if text and text in normalized_transcript:
        return "speech"

    if amount and amount in normalized_transcript:
        return "speech"

    if text and text in metadata_text:
        return "metadata"

    if normalized_source in {"speech", "metadata", "description"}:
        return normalized_source

    return "unknown"


def normalize_confidence(confidence: float, source: str, evidence_value: Optional[str]) -> float:
    """LLM의 과신을 줄이기 위해 confidence 범위를 보정한다."""

    bounded = max(0.0, min(confidence, 0.95))

    if source == "unknown":
        return min(bounded, 0.45)

    if source == "metadata":
        return min(bounded, 0.65)

    if not evidence_value:
        return min(bounded, 0.7)

    return bounded


def is_ambiguous_sauce_name(text: str) -> bool:
    """소스명이 STT 오타로 보이는지 확인한다."""

    return "대기약기" in text
