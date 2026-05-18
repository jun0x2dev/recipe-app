"""Heuristic recipe draft extraction.

- 외부 LLM 없이 파이프라인 구조를 빠르게 확인하기 위한 임시 추출기다.
- 실제 서비스 품질 기준으로 사용하지 않는다.
"""

from __future__ import annotations

import re
from typing import Optional

from recipe_extractor.recipe_normalization import normalize_amount, normalize_transcript_text
from recipe_extractor.schemas import (
    RecipeDraft,
    RecipeIngredientDraft,
    RecipeStepDraft,
    Transcript,
    YouTubeMetadata,
)


# NOTE:
# - 이 목록은 `heuristic` provider에서만 사용하는 프로토타입용 재료 힌트다.
# - 특정 테스트 영상의 레시피 품질을 빠르게 확인하기 위한 임시 장치이며,
#   실제 서비스용 재료 추출 기준으로 사용하면 안 된다.
# - 운영 단계에서는 LLM 추출 결과, 표준 재료 사전, 사용자 수정 이력을 결합한
#   Entity Linking 구조로 대체해야 한다.
INGREDIENT_HINTS = [
    "부침가루",
    "물",
    "계란",
    "소금",
    "후추",
    "양배추",
    "참치",
    "기름",
    "오코노미야끼 소스",
    "마요네즈",
    "파슬리",
]


def extract_recipe_draft_heuristic(metadata: YouTubeMetadata, transcript: Optional[Transcript]) -> RecipeDraft:
    """간단한 규칙으로 레시피 초안을 만든다."""

    text = normalize_transcript_text(transcript.text if transcript else "")
    title = infer_title(metadata)
    ingredients = infer_ingredients(text, metadata)
    steps = infer_steps(text)
    notes = [
        "규칙 기반 초안입니다. 재료명, 계량, 조리 순서를 반드시 확인하세요.",
    ]

    if not transcript or not transcript.text:
        notes.append("STT 결과가 없어 제목, 설명란, 태그만으로 추정했습니다.")

    return RecipeDraft(
        title=title,
        title_source="metadata_title",
        description=infer_description(title, metadata),
        servings=None,
        servings_source="unknown",
        estimated_cooking_time_minutes=infer_estimated_cooking_time_minutes(metadata, steps),
        extraction_status="draft",
        ingredients=ingredients,
        steps=steps,
        notes=notes,
        provider="heuristic",
    )


def infer_title(metadata: YouTubeMetadata) -> str:
    """영상 제목과 태그에서 요리 제목을 추론한다."""

    candidates = [
        tag for tag in metadata.tags if "오코노미" in tag or "레시피" not in tag
    ]

    for candidate in candidates:
        if "오코노미" in candidate:
            return normalize_title(candidate)

    if "오코노미" in metadata.title:
        return "오코노미야끼"

    title = re.sub(r"#\S+", "", metadata.title).strip()
    return title or "요리 제목 확인 필요"


def normalize_title(value: str) -> str:
    """태그/제목에서 추출한 요리명을 저장용 제목에 가깝게 정리한다."""

    if "오코노미" in value or "오꼬노미" in value:
        return "오코노미야끼"
    return value.strip()


def infer_description(title: str, metadata: YouTubeMetadata) -> str:
    """제목과 설명란을 바탕으로 짧은 레시피 소개를 만든다."""

    if title and title != "요리 제목 확인 필요":
        return f"{title}를 만들기 위한 레시피 초안입니다."

    if metadata.description:
        return metadata.description.splitlines()[0][:120]

    return "영상 정보를 바탕으로 만든 레시피 초안입니다."


def infer_estimated_cooking_time_minutes(metadata: YouTubeMetadata, steps: list[RecipeStepDraft]) -> int:
    """영상 길이와 단계 수로 대략적인 조리 시간을 추정한다.

    - 규칙 기반 provider의 임시 추정치다.
    - 실제 서비스에서는 LLM 추정과 사용자 수정 이력을 함께 반영한다.
    """

    step_based_minutes = max(5, len(steps) * 3)
    duration_based_minutes = 5

    if metadata.duration_seconds:
        duration_based_minutes = max(5, round(metadata.duration_seconds / 60) * 5)

    return max(step_based_minutes, duration_based_minutes)


def infer_ingredients(text: str, metadata: YouTubeMetadata) -> list[RecipeIngredientDraft]:
    """STT 텍스트와 태그에서 재료 후보를 추출한다."""

    joined = " ".join([text, metadata.title, metadata.description, " ".join(metadata.tags)])
    ingredients: list[RecipeIngredientDraft] = []

    for ingredient in INGREDIENT_HINTS:
        if ingredient in joined:
            ingredients.append(
                RecipeIngredientDraft(
                    name=ingredient,
                    amount=find_amount_near_ingredient(text, ingredient),
                    source="speech" if ingredient in text else "metadata",
                    confidence=0.72 if ingredient in text else 0.55,
                )
            )

    return deduplicate_ingredients(ingredients)


def find_amount_near_ingredient(text: str, ingredient: str) -> Optional[str]:
    """재료명 주변의 간단한 계량 표현을 찾는다."""

    if not text:
        return None

    patterns = [
        rf"{re.escape(ingredient)}\s*(\d+\s*(?:컵|개|큰술|작은술|스푼|종|캔|킨))",
        rf"(\d+\s*(?:컵|개|큰술|작은술|스푼|종|캔|킨))\s*(?:의\s*)?{re.escape(ingredient)}",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return normalize_amount(match.group(1))

    return None


def deduplicate_ingredients(ingredients: list[RecipeIngredientDraft]) -> list[RecipeIngredientDraft]:
    """같은 재료명이 중복되면 한 번만 남긴다."""

    seen: set[str] = set()
    result: list[RecipeIngredientDraft] = []

    for ingredient in ingredients:
        if ingredient.name in seen:
            continue
        seen.add(ingredient.name)
        result.append(ingredient)

    return result


def infer_steps(text: str) -> list[RecipeStepDraft]:
    """STT 문장을 조리 단계 후보로 나눈다."""

    if not text:
        return []

    normalized = text
    split_markers = ["먼저", "그 다음", "이제", "마무리하면"]

    for marker in split_markers:
        normalized = normalized.replace(marker, f"\n{marker}")

    candidates = [line.strip() for line in normalized.splitlines() if line.strip()]
    steps: list[RecipeStepDraft] = []

    for candidate in candidates:
        if is_non_recipe_sentence(candidate):
            continue
        steps.append(
            RecipeStepDraft(
                order=len(steps) + 1,
                description=normalize_transcript_text(candidate).strip(),
                source="speech",
                confidence=0.68,
            )
        )

    return steps


def is_non_recipe_sentence(sentence: str) -> bool:
    """광고성/감상성 문장을 조리 단계에서 제외한다."""

    return any(keyword in sentence for keyword in ["맥주", "맛"]) and not any(
        keyword in sentence for keyword in ["넣", "섞", "굽", "발라", "반죽"]
    )
