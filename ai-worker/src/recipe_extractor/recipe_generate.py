"""Recipe generation from a plain dish name or user prompt."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from recipe_extractor.errors import RecipeExtractionError
from recipe_extractor.recipe_postprocess import normalize_estimated_time
from recipe_extractor.recipe_postprocess import recipe_draft_from_mapping
from recipe_extractor.schemas import RecipeDraft, RecipeIngredientDraft, RecipeStepDraft, YouTubeMetadata


ONE_SERVING_KEYWORDS = [
    "볶음밥",
    "덮밥",
    "라면",
    "국수",
    "비빔면",
    "파스타",
    "토스트",
    "샌드위치",
    "샐러드",
    "오므라이스",
]

TWO_SERVING_KEYWORDS = [
    "찌개",
    "국",
    "탕",
    "전골",
    "수육",
    "찜",
    "볶음탕",
    "조림",
]

OPTIONAL_DEFAULT_INGREDIENT_KEYWORDS = [
    "멸치",
    "다시마",
    "육수팩",
    "다시팩",
    "팽이버섯",
    "표고버섯",
    "느타리버섯",
    "새우젓",
    "액젓",
    "쑥갓",
    "미나리",
]


def generate_recipe_draft_with_ollama(
    query: str,
    model: str,
    url: str,
) -> RecipeDraft:
    """음식명 또는 짧은 요청 문장으로 레시피 초안을 생성한다.

    - 유튜브 영상 근거가 없는 순수 생성 기능이다.
    - 결과는 저장 전 사용자가 검토할 draft로만 사용한다.
    - source는 실제 영상 근거가 없음을 나타내기 위해 generated를 사용한다.
    """

    normalized_query = query.strip()
    if not normalized_query:
        raise RecipeExtractionError("empty recipe generation query")

    payload = {
        "model": model,
        "prompt": build_generate_recipe_prompt(normalized_query),
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

    metadata = YouTubeMetadata(
        url="",
        video_id=None,
        title=normalized_query,
        description="",
        duration_seconds=None,
        channel_name=None,
        thumbnail_url=None,
        tags=[],
    )

    draft = recipe_draft_from_mapping(
        parsed,
        provider=f"ollama:{model}",
        metadata=metadata,
        normalized_transcript="",
    )
    return apply_generated_recipe_policy(draft, normalized_query)


def build_generate_recipe_prompt(query: str) -> str:
    """음식명 기반 레시피 생성 프롬프트를 만든다."""

    return f"""
너는 사용자가 입력한 음식명이나 요청 문장으로 저장 가능한 레시피 초안을 만드는 도우미다.
반드시 JSON만 출력한다. 설명 문장을 JSON 밖에 쓰지 않는다.
모든 응답 값은 반드시 한국어로 작성한다.
중국어, 일본어, 영어 단어를 섞지 않는다.
재료명, 계량, 조리 단계, notes도 모두 한국어로 작성한다.

입력:
{query}

생성 기준:
- 한국 가정식 기준으로 현실적인 재료와 조리 단계를 만든다.
- 사용자가 집에 흔히 가지고 있을 가능성이 높은 기본 재료만 ingredients에 넣는다.
- 맛을 더 좋게 하는 선택 재료, 육수 재료, 고명, 특수 재료는 ingredients에 넣지 말고 notes에만 적는다.
- 멸치, 다시마, 육수팩, 다시팩, 팽이버섯, 표고버섯, 느타리버섯, 새우젓, 액젓, 쑥갓, 미나리는 사용자가 직접 입력하지 않았다면 기본 재료로 넣지 않는다.
- 찌개나 국도 기본값은 물로 끓이는 간단한 버전으로 작성하고, 멸치/다시마 육수는 notes에 선택 팁으로만 적는다.
- ingredients는 5~8개 사이로 제한한다.
- steps는 3~5단계 사이로 제한한다.
- 사용자가 입력한 음식명을 title에 반영한다.
- title은 한국어 음식명으로 쓴다.
- description은 앱에서 보여줄 1문장 소개로 80자 이내로 쓴다.
- servings는 반드시 1 또는 2 중 하나로만 정한다.
- 볶음밥, 덮밥, 면, 파스타, 토스트, 샌드위치, 샐러드처럼 한 그릇 음식은 1인분 기준으로 작성한다.
- 찌개, 국, 탕, 전골, 수육, 찜, 볶음탕처럼 나눠 먹는 음식은 2인분 기준으로 작성한다.
- 재료 계량은 선택한 servings 기준으로 작성한다.
- servings_source는 항상 "estimated"로 둔다.
- estimated_cooking_time_minutes는 재료 손질부터 완성까지 걸리는 실제 조리 시간을 분 단위 정수로 추정한다.
- extraction_status는 항상 "draft"로 둔다.
- ingredients와 steps의 source는 모두 "generated"로 둔다.
- confidence는 순수 생성 결과이므로 0.55~0.65 사이 숫자로 둔다.
- 계량은 가능하면 실사용 가능한 단위로 쓴다.
- 확실하지 않은 대체 재료나 취향 조절은 notes에 짧게 남긴다.
- 대체 재료를 "돼지고기 또는 참치"처럼 한 재료명에 섞지 않는다. 선택지는 notes에 적는다.
- 김치볶음밥 예시라면 "밥", "김치", "달걀", "식용유"처럼 한국어 재료명을 사용한다.
- 김치볶음밥은 1인분, 김치찌개는 2인분 기준으로 작성한다.

출력 스키마:
{{
  "title": "요리 제목",
  "title_source": "generated",
  "description": "앱에 보여줄 짧은 레시피 설명",
  "servings": 2,
  "servings_source": "estimated",
  "estimated_cooking_time_minutes": 15,
  "extraction_status": "draft",
  "ingredients": [
    {{"name": "재료명", "amount": "계량 또는 null", "source": "generated", "confidence": 0.0}}
  ],
  "steps": [
    {{"order": 1, "description": "조리 단계", "source": "generated", "confidence": 0.0}}
  ],
  "notes": ["주의사항"]
}}
""".strip()


def apply_generated_recipe_policy(draft: RecipeDraft, query: str) -> RecipeDraft:
    """음식명 기반 생성 API의 서비스 정책을 코드로 최종 보정한다.

    - 키워드 규칙이 있으면 AI가 준 servings보다 우선한다.
    - 규칙이 없는 음식은 AI가 준 1 또는 2를 사용하고, 그 외 값은 1로 둔다.
    - 집에 없을 가능성이 큰 선택 재료는 기본 재료에서 제외하고 notes로 보낸다.
    - 재료 계량은 프롬프트에서 맞추게 하고, 이 함수는 응답 필드의 일관성을 보장한다.
    """

    ingredients, removed_names = simplify_generated_ingredients(draft.ingredients, query)
    steps = simplify_generated_steps(draft.steps, removed_names)
    notes = list(draft.notes)
    if removed_names:
        notes.append(f"다음 재료는 기본 재료에서 제외했습니다: {', '.join(removed_names)}. 있으면 취향에 따라 추가하세요.")

    return RecipeDraft(
        title=draft.title,
        title_source=draft.title_source,
        description=draft.description,
        servings=infer_generated_servings(query, draft.servings),
        servings_source="estimated",
        estimated_cooking_time_minutes=normalize_estimated_time(draft.estimated_cooking_time_minutes),
        extraction_status="draft",
        ingredients=[
            RecipeIngredientDraft(
                name=ingredient.name,
                amount=ingredient.amount,
                source="generated",
                confidence=ingredient.confidence,
            )
            for ingredient in ingredients[:8]
        ],
        steps=[
            RecipeStepDraft(
                order=index + 1,
                description=step.description,
                source="generated",
                confidence=step.confidence,
            )
            for index, step in enumerate(steps[:5])
        ],
        notes=dedupe_notes(notes[:4]),
        provider=draft.provider,
    )


def simplify_generated_ingredients(
    ingredients: list[RecipeIngredientDraft],
    query: str,
) -> tuple[list[RecipeIngredientDraft], list[str]]:
    """생성 레시피의 재료 목록을 가정식 기본 재료 중심으로 줄인다.

    - 사용자가 직접 입력한 재료명은 존중한다.
    - 그렇지 않은 선택/육수/고명 성격 재료는 notes로 이동할 후보로 제외한다.
    """

    kept: list[RecipeIngredientDraft] = []
    removed: list[str] = []
    for ingredient in ingredients:
        if is_optional_default_ingredient(ingredient.name, query):
            removed.append(ingredient.name)
            continue
        kept.append(ingredient)

    return kept, dedupe_names(removed)


def simplify_generated_steps(
    steps: list[RecipeStepDraft],
    removed_names: list[str],
) -> list[RecipeStepDraft]:
    """제외된 선택 재료가 조리 단계에 남지 않도록 단계 문장을 정리한다."""

    simplified: list[RecipeStepDraft] = []
    for step in steps:
        if any(name and name in step.description for name in removed_names):
            continue

        description = step.description
        if any(name in removed_names for name in ["멸치", "다시마", "육수팩", "다시팩"]):
            description = description.replace("육수", "물")

        simplified.append(
            RecipeStepDraft(
                order=step.order,
                description=description,
                source=step.source,
                confidence=step.confidence,
            )
        )

    return simplified or steps


def is_optional_default_ingredient(name: str, query: str) -> bool:
    """사용자 요청에 없는 비상비 재료인지 판단한다."""

    return any(keyword in name and keyword not in query for keyword in OPTIONAL_DEFAULT_INGREDIENT_KEYWORDS)


def dedupe_names(values: list[str]) -> list[str]:
    """문자열 리스트의 순서를 유지하면서 중복을 제거한다."""

    deduped: list[str] = []
    for value in values:
        if value not in deduped:
            deduped.append(value)
    return deduped


def dedupe_notes(values: list[str]) -> list[str]:
    """notes 중복을 제거하고 빈 값을 제외한다."""

    return dedupe_names([value.strip() for value in values if value.strip()])


def infer_generated_servings(query: str, model_value: int | None) -> int:
    """음식명 키워드와 모델 값을 조합해 1 또는 2인분을 결정한다."""

    if any(keyword in query for keyword in TWO_SERVING_KEYWORDS):
        return 2

    if any(keyword in query for keyword in ONE_SERVING_KEYWORDS):
        return 1

    if model_value in {1, 2}:
        return model_value

    return 1
