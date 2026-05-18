"""Data schemas for the recipe extraction pipeline.

- 외부 도구 결과를 앱 내부에서 다루기 쉬운 구조로 정리한다.
- 초기에는 유튜브 메타데이터만 다루고, 이후 STT/OCR/LLM 결과를 추가한다.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional


@dataclass(frozen=True)
class YouTubeMetadata:
    """유튜브 쇼츠 메타데이터.

    - 제목과 설명란은 레시피 제목/재료/조리 순서 추출의 1차 입력이다.
    - 원본 영상 파일은 저장하지 않고, 추출 판단에 필요한 메타데이터만 보관한다.
    - `raw`에는 디버깅에 유용하지만 출력 기본값에는 포함하지 않을 원본 일부를 담을 수 있다.
    """

    url: str
    video_id: Optional[str]
    title: str
    description: str
    duration_seconds: Optional[int]
    channel_name: Optional[str]
    thumbnail_url: Optional[str]
    tags: list[str] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict, repr=False)

    def to_public_dict(self) -> dict[str, Any]:
        """CLI와 백엔드 연동에서 사용할 공개 출력 형태를 반환한다.

        - `raw`는 크기가 크고 플랫폼 내부 필드가 섞일 수 있어 기본 출력에서 제외한다.
        - JSON 직렬화가 안정적으로 되도록 dataclass를 plain dict로 변환한다.
        """

        data = asdict(self)
        data.pop("raw", None)
        return data


@dataclass(frozen=True)
class DownloadedAudio:
    """STT 입력으로 사용할 다운로드된 오디오 정보.

    - 오디오 파일은 임시 작업 파일이며 영구 저장을 전제로 하지 않는다.
    - 백엔드 연동 전까지는 로컬 경로를 CLI 출력에 포함해 디버깅한다.
    """

    path: Path
    video_id: Optional[str]
    extension: Optional[str]
    format_id: Optional[str]

    def to_public_dict(self) -> dict[str, Any]:
        """JSON 직렬화 가능한 공개 출력 형태를 반환한다."""

        return {
            "path": str(self.path),
            "video_id": self.video_id,
            "extension": self.extension,
            "format_id": self.format_id,
        }


@dataclass(frozen=True)
class TranscriptSegment:
    """STT 세그먼트 단위 결과.

    - 시작/종료 시간을 함께 보관해 나중에 영상 구간 근거를 표시할 수 있게 한다.
    - 사용자가 잘못 추출된 조리 단계를 검토할 때 근거 데이터가 된다.
    """

    start: float
    end: float
    text: str


@dataclass(frozen=True)
class Transcript:
    """오디오 STT 결과.

    - `text`는 LLM에 전달할 전체 전사 문장이다.
    - `segments`는 디버깅과 근거 표시를 위한 시간대별 문장이다.
    """

    text: str
    language: Optional[str]
    language_probability: Optional[float]
    model_size: str
    segments: list[TranscriptSegment] = field(default_factory=list)

    def to_public_dict(self) -> dict[str, Any]:
        """JSON 직렬화 가능한 공개 출력 형태를 반환한다."""

        return asdict(self)


@dataclass(frozen=True)
class RecipeIngredientDraft:
    """AI 추출 레시피의 재료 초안.

    - `amount`는 영상에서 확인된 계량이 있으면 채운다.
    - `confidence`는 추출 근거의 강도를 나타내며 사용자 노출보다 내부 판단에 가깝다.
    """

    name: str
    amount: Optional[str]
    source: str
    confidence: float


@dataclass(frozen=True)
class RecipeStepDraft:
    """AI 추출 레시피의 조리 단계 초안."""

    order: int
    description: str
    source: str
    confidence: float


@dataclass(frozen=True)
class RecipeDraft:
    """사용자가 검토하고 저장할 수 있는 레시피 초안.

    - 외부 LLM 또는 규칙 기반 추출 결과를 동일한 형태로 표현한다.
    - `description`은 목록/상세 상단에서 보여줄 짧은 소개 문구다.
    - `servings`는 몇 인분인지 나타내며 명확한 근거가 없으면 AI가 재료량으로 추정한다.
    - `servings_source`는 몇 인분 값이 설명란/음성/AI 추정 중 어디서 왔는지 나타낸다.
    - `estimated_cooking_time_minutes`는 AI가 추정한 조리 시간이며 사용자가 수정할 수 있다.
    - `extraction_status`는 AI가 만든 값이 저장 전 검토 대상 초안임을 나타낸다.
    - 확정 데이터가 아니라 사용자가 수정할 초안임을 전제로 한다.
    """

    title: str
    title_source: str
    description: Optional[str] = None
    servings: Optional[int] = None
    servings_source: str = "unknown"
    estimated_cooking_time_minutes: Optional[int] = None
    extraction_status: str = "draft"
    ingredients: list[RecipeIngredientDraft] = field(default_factory=list)
    steps: list[RecipeStepDraft] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    provider: str = "heuristic"

    def to_public_dict(self) -> dict[str, Any]:
        """JSON 직렬화 가능한 공개 출력 형태를 반환한다."""

        return asdict(self)
