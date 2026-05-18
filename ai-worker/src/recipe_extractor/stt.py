"""Speech-to-text utilities for recipe extraction.

- `faster-whisper`를 선택 의존성으로 사용한다.
- 오디오에서 말소리를 텍스트로 변환해 레시피 추출의 핵심 입력으로 제공한다.
- 기본값은 CPU에서도 실행 가능한 설정을 우선한다.
"""

from __future__ import annotations

from pathlib import Path

from recipe_extractor.errors import SpeechToTextError
from recipe_extractor.schemas import Transcript, TranscriptSegment


def transcribe_audio(
    audio_path: Path,
    model_size: str = "small",
    language: str = "ko",
    device: str = "cpu",
    compute_type: str = "int8",
) -> Transcript:
    """오디오 파일을 텍스트로 변환한다.

    - `small` 모델은 초기 테스트 속도와 품질의 균형을 위한 기본값이다.
    - 한국어 쇼츠를 우선하므로 기본 언어는 `ko`로 둔다.
    - 더 높은 품질이 필요하면 `medium`, `large-v3`를 별도 실험한다.
    """

    if not audio_path.exists():
        raise SpeechToTextError(f"audio file not found: {audio_path}")

    try:
        from faster_whisper import WhisperModel
    except ModuleNotFoundError as error:
        raise SpeechToTextError(
            "faster-whisper가 설치되어 있지 않습니다. "
            "`python -m pip install -e .[stt]`를 실행한 뒤 다시 시도하세요."
        ) from error

    try:
        model = WhisperModel(model_size, device=device, compute_type=compute_type)
        segments_iter, info = model.transcribe(str(audio_path), language=language)
        segments = [
            TranscriptSegment(start=segment.start, end=segment.end, text=segment.text.strip())
            for segment in segments_iter
        ]
    except Exception as error:  # noqa: BLE001 - STT backend raises several concrete exception types.
        raise SpeechToTextError(str(error)) from error

    text = " ".join(segment.text for segment in segments if segment.text).strip()
    detected_language = getattr(info, "language", None)
    language_probability = getattr(info, "language_probability", None)

    return Transcript(
        text=text,
        language=detected_language,
        language_probability=language_probability,
        model_size=model_size,
        segments=segments,
    )
