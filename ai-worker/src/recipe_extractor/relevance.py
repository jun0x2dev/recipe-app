"""Recipe relevance checks for extracted YouTube metadata.

- 요리/레시피와 무관한 영상에 AI 추출 자원을 쓰지 않기 위한 1차 필터다.
- MVP 단계에서는 제목, 설명란, 태그 기반의 보수적인 규칙 검사를 사용한다.
- OCR/STT/LLM 검증 단계가 붙으면 더 정교한 판별로 교체할 수 있다.
"""

from __future__ import annotations

from recipe_extractor.errors import RecipeRelevanceError
from recipe_extractor.schemas import YouTubeMetadata


RECIPE_KEYWORDS = [
    "레시피",
    "재료",
    "만드는 법",
    "만들기",
    "요리",
    "조리",
    "간단요리",
    "초간단",
    "먹기",
    "굽",
    "볶",
    "끓",
    "섞",
    "계량",
    "스푼",
    "컵",
    "큰술",
    "작은술",
]

FOOD_HINT_KEYWORDS = [
    "토스트",
    "프렌치토스트",
    "오코노미야끼",
    "김치",
    "볶음밥",
    "국",
    "찌개",
    "파스타",
    "라면",
    "샐러드",
    "빵",
    "식빵",
    "계란",
]


def ensure_recipe_related(metadata: YouTubeMetadata) -> None:
    """메타데이터만으로 요리 레시피 관련성을 1차 확인한다.

    - 설명란에 재료/만드는 법이 있으면 강하게 통과시킨다.
    - 제목/태그에 음식명 또는 레시피 키워드가 있으면 통과시킨다.
    - 관련성이 낮으면 STT/LLM 호출 전에 중단한다.
    """

    haystack = "\n".join(
        [
            metadata.title,
            metadata.description,
            " ".join(metadata.tags),
        ]
    ).lower()

    has_recipe_section = any(section in haystack for section in ["재료", "만드는 법", "만드는법", "recipe"])
    has_recipe_keyword = any(keyword.lower() in haystack for keyword in RECIPE_KEYWORDS)
    has_food_hint = any(keyword.lower() in haystack for keyword in FOOD_HINT_KEYWORDS)

    if has_recipe_section or (has_recipe_keyword and has_food_hint):
        return

    raise RecipeRelevanceError(f"title={metadata.title}")
