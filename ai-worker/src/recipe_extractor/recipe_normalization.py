"""Recipe text normalization helpers.

- STT 원문을 직접 수정하지 않고, 레시피 추출 입력과 후처리에만 보정본을 사용한다.
- 특정 영상에만 맞는 보정은 운영 전 검증된 사전 또는 사용자 수정 로그 기반 사전으로 분리해야 한다.
"""

from __future__ import annotations


# NOTE:
# - 이 보정 사전은 STT가 자주 틀리는 표현을 레시피 추출 입력에서만 보정하기 위한 임시 사전이다.
# - 원본 transcript는 수정하지 않고, LLM/heuristic에 전달하는 보정본에만 적용한다.
# - 특정 영상에만 맞는 보정은 다른 레시피에서 오탐을 만들 수 있으므로 운영 전 반드시 축소하거나
#   사용자 수정 로그 기반의 검증된 사전으로 분리해야 한다.
# - 예: "한킨" -> "1캔"은 비교적 일반화 가능성이 있지만, "3종" -> "3줌"은 현재 샘플에 강하게 의존한다.
# - 소스명처럼 문맥에 따라 달라지는 표현은 여기서 단정 보정하지 않는다.
DOMAIN_REPLACEMENTS = {
    "오코노미약기": "오코노미야끼",
    "채선": "채 썬",
    "한킨": "1캔",
    "1킨": "1캔",
    "3종": "3줌",
}


def normalize_transcript_text(text: str) -> str:
    """레시피 도메인에서 자주 보이는 STT 오류를 보정한다."""

    normalized = text
    for source, target in DOMAIN_REPLACEMENTS.items():
        normalized = normalized.replace(source, target)
    return normalized


def normalize_amount(value: str) -> str:
    """STT 오류가 섞인 계량 표현을 최소한으로 정리한다."""

    return normalize_transcript_text(value).strip()
