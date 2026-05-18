"""Command module for `python -m recipe_extractor`.

- 패키지를 모듈로 실행할 때 CLI 진입점으로 연결한다.
- 실제 명령 처리 로직은 `main.py`에 둔다.
"""

from recipe_extractor.main import main


if __name__ == "__main__":
    raise SystemExit(main())
