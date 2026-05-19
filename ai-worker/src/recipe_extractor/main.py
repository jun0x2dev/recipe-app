"""CLI entry point for the recipe extraction worker prototype.

- 현재 단계에서는 유튜브 쇼츠 메타데이터만 추출한다.
- 이후 STT, OCR, LLM 기반 레시피 JSON 생성 단계를 같은 CLI 옵션으로 확장한다.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

from recipe_extractor.errors import (
    AppError,
)
from recipe_extractor.pipeline import ExtractionOptions, run_extraction


def build_parser() -> argparse.ArgumentParser:
    """명령행 인자를 정의한다.

    - 첫 번째 인자는 유튜브 쇼츠 URL이다.
    - `--pretty`는 사람이 읽기 쉬운 JSON 출력에 사용한다.
    """

    parser = argparse.ArgumentParser(
        prog="recipe-extractor",
        description="Extract recipe-related metadata from a YouTube Shorts URL.",
    )
    parser.add_argument("url", help="YouTube Shorts URL")
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Print indented JSON output.",
    )
    parser.add_argument(
        "--download-audio",
        action="store_true",
        help="Download a temporary audio file for STT.",
    )
    parser.add_argument(
        "--audio-dir",
        default="tmp/audio",
        help="Directory for temporary audio downloads. Defaults to tmp/audio.",
    )
    parser.add_argument(
        "--youtube-client",
        default="android",
        help="YouTube player client for yt-dlp downloads. Defaults to android.",
    )
    parser.add_argument(
        "--cookies-from-browser",
        default=None,
        help="Browser name for yt-dlp cookies-from-browser, for example chrome or edge.",
    )
    parser.add_argument(
        "--cookies-file",
        default=None,
        help="Path to a cookies.txt file for yt-dlp.",
    )
    parser.add_argument(
        "--with-stt",
        action="store_true",
        help="Download audio and transcribe it with faster-whisper.",
    )
    parser.add_argument(
        "--stt-model",
        default="small",
        help="faster-whisper model size. Defaults to small.",
    )
    parser.add_argument(
        "--stt-language",
        default="ko",
        help="STT language code. Defaults to ko.",
    )
    parser.add_argument(
        "--stt-device",
        default="cpu",
        help="STT device for faster-whisper. Defaults to cpu.",
    )
    parser.add_argument(
        "--stt-compute-type",
        default="int8",
        help="STT compute type for faster-whisper. Defaults to int8.",
    )
    parser.add_argument(
        "--extract-recipe",
        action="store_true",
        help="Build a recipe draft from metadata and transcript.",
    )
    parser.add_argument(
        "--recipe-provider",
        choices=["heuristic", "ollama"],
        default="heuristic",
        help="Recipe extraction provider. Defaults to heuristic.",
    )
    parser.add_argument(
        "--ollama-model",
        default="gemma3:12b",
        help="Ollama model name for recipe extraction. Defaults to gemma3:12b.",
    )
    parser.add_argument(
        "--ollama-url",
        default="http://localhost:11434/api/generate",
        help="Ollama generate API URL.",
    )
    parser.add_argument(
        "--enforce-recipe-content",
        action="store_true",
        help="Reject videos that do not look recipe-related before heavy processing.",
    )
    return parser


def main(argv: Optional[list[str]] = None) -> int:
    """CLI 실행 함수.

    - 성공 시 메타데이터 JSON을 표준 출력으로 내보낸다.
    - 실패 시 오류 메시지를 표준 오류로 내보내고 non-zero status를 반환한다.
    """

    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        result = run_extraction(
            args.url,
            ExtractionOptions(
                download_audio=args.download_audio,
                with_stt=args.with_stt,
                extract_recipe=args.extract_recipe,
                audio_dir=Path(args.audio_dir),
                youtube_client=args.youtube_client,
                cookies_from_browser=args.cookies_from_browser,
                cookies_file=Path(args.cookies_file) if args.cookies_file else None,
                stt_model=args.stt_model,
                stt_language=args.stt_language,
                stt_device=args.stt_device,
                stt_compute_type=args.stt_compute_type,
                recipe_provider=args.recipe_provider,
                ollama_model=args.ollama_model,
                ollama_url=args.ollama_url,
                enforce_recipe_content=args.enforce_recipe_content,
            ),
        )
    except AppError as error:
        print(str(error), file=sys.stderr)
        return 1

    indent = 2 if args.pretty else None
    print(json.dumps(result, ensure_ascii=False, indent=indent))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
