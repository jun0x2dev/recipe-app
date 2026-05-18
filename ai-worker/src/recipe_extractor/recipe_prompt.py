"""Prompt builders for recipe extraction models."""

from __future__ import annotations

from typing import Optional

from recipe_extractor.recipe_normalization import normalize_transcript_text
from recipe_extractor.schemas import Transcript, YouTubeMetadata


def build_ollama_prompt(metadata: YouTubeMetadata, transcript: Optional[Transcript]) -> str:
    """Ollama에 전달할 구조화 추출 프롬프트를 만든다."""

    raw_transcript_text = transcript.text if transcript else ""
    transcript_text = normalize_transcript_text(raw_transcript_text)
    tags = ", ".join(metadata.tags)

    return f"""
너는 유튜브 쇼츠 요리 영상에서 레시피 초안을 추출하는 도우미다.
반드시 JSON만 출력한다. 설명 문장을 JSON 밖에 쓰지 않는다.

우선순위:
1. 영상 설명란에 재료/계량/순서가 명확하면 우선한다.
2. 제목은 요리명 추론에 우선 사용한다.
3. STT는 조리 과정과 누락 재료 보완에 사용한다.
4. 확실하지 않은 항목은 notes에 짧게 남긴다.

주의:
- STT 원문에 오타가 있을 수 있다.
- "오코노미약기"는 "오코노미야끼"로 해석한다.
- "한킨"은 "1캔"으로 해석한다.
- "채선"은 "채 썬"으로 해석한다.
- 계량이 명확하지 않은 재료는 앞 재료의 계량을 가져오지 말고 null로 둔다.
- 소스명이 STT 오타처럼 보이면 단정하지 말고 원문 후보를 notes에 남긴다.
- 특히 "대기약기 소스"는 "데리야끼 소스" 또는 "오코노미야끼 소스" 가능성이 있으므로 확정하지 않는다.
- source는 실제 근거가 있는 입력만 사용한다.
- 영상 설명란에 없는 재료/단계는 source를 description으로 쓰지 않는다.
- STT에서 들린 정보는 source를 speech로 둔다.
- 영상 제목/태그로만 추론한 정보는 source를 metadata로 둔다.
- confidence는 확실한 항목도 0.95 이하로 둔다.
- description은 앱에서 보여줄 1문장 소개로 80자 이내로 쓴다.
- servings는 몇 인분인지 정수로 쓴다.
- 설명란이나 STT에 몇 인분 정보가 명확하면 그 값을 사용한다.
- 몇 인분 정보가 명확하지 않으면 재료량을 보고 일반적인 1회 섭취량 기준으로 추정한다.
- servings_source는 명확한 설명란 근거면 "description", 음성 근거면 "speech", 재료량 추정이면 "estimated"로 둔다.
- estimated_cooking_time_minutes는 재료 손질부터 완성까지 걸리는 시간을 분 단위 정수로 추정한다.
- 예상 조리시간은 영상 길이가 아니라 실제 조리 시간을 기준으로 한다.
- extraction_status는 항상 "draft"로 둔다.

출력 스키마:
{{
  "title": "요리 제목",
  "title_source": "metadata_title|description|speech|unknown",
  "description": "앱에 보여줄 짧은 레시피 설명",
  "servings": 2,
  "servings_source": "description|speech|estimated",
  "estimated_cooking_time_minutes": 10,
  "extraction_status": "draft",
  "ingredients": [
    {{"name": "재료명", "amount": "계량 또는 null", "source": "metadata|description|speech", "confidence": 0.0}}
  ],
  "steps": [
    {{"order": 1, "description": "조리 단계", "source": "speech|description", "confidence": 0.0}}
  ],
  "notes": ["주의사항"]
}}

영상 제목:
{metadata.title}

영상 설명란:
{metadata.description}

태그:
{tags}

STT:
{transcript_text}

STT 원문:
{raw_transcript_text}
""".strip()
