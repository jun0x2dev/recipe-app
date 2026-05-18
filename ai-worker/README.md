# AI Worker

유튜브 쇼츠 기반 레시피 추출을 실험하는 Python 워커입니다.

초기 범위는 유튜브 쇼츠 URL에서 영상 제목, 설명란, 길이, 채널명 등 메타데이터를 추출하고, 이후 STT, OCR, LLM 기반 레시피 구조화로 확장하는 것입니다.

## 역할

- 유튜브 쇼츠 URL 검증
- 유튜브 영상 메타데이터 추출
- 추출 결과를 JSON으로 출력
- 이후 STT, OCR, LLM 파이프라인의 진입점 제공

## 설치

Python 3.9 이상을 사용합니다.

```bash
cd ai-worker
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

Windows PowerShell에서는 다음처럼 활성화합니다.

```powershell
cd ai-worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
```

STT까지 테스트하려면 선택 의존성을 설치합니다.

```powershell
python -m pip install -e ".[stt]"
```

FastAPI 서버까지 실행하려면 API 선택 의존성을 함께 설치합니다.

```powershell
python -m pip install -e ".[api,stt]"
```

PowerShell 실행 정책 때문에 활성화가 막히면, 현재 터미널에서만 다음 명령을 먼저 실행합니다.

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

가상환경을 활성화하지 않고 실행할 수도 있습니다.

```powershell
.\.venv\Scripts\python.exe -m pip install -e .
.\.venv\Scripts\python.exe -m recipe_extractor "https://www.youtube.com/shorts/VIDEO_ID" --pretty
```

## 실행

```bash
python3 -m recipe_extractor "https://www.youtube.com/shorts/VIDEO_ID"
```

Windows PowerShell에서는 다음 명령을 사용할 수 있습니다.

```powershell
python -m recipe_extractor "https://www.youtube.com/shorts/VIDEO_ID" --pretty
```

오디오 파일까지 내려받으려면 다음 명령을 사용합니다.

```powershell
python -m recipe_extractor "https://youtube.com/shorts/zHMWRiJwrxA?si=twNT-jRrzQLvy2ib" --download-audio --pretty
```

YouTube가 오디오 다운로드를 `403 Forbidden`으로 막으면 브라우저 쿠키를 함께 전달합니다.

```powershell
python -m recipe_extractor "https://youtube.com/shorts/zHMWRiJwrxA?si=twNT-jRrzQLvy2ib" --download-audio --cookies-from-browser chrome --pretty
```

Chrome 대신 Edge를 사용 중이면 다음처럼 실행합니다.

```powershell
python -m recipe_extractor "https://youtube.com/shorts/zHMWRiJwrxA?si=twNT-jRrzQLvy2ib" --download-audio --cookies-from-browser edge --pretty
```

그래도 실패하면 YouTube client를 바꿔서 시도합니다.

```powershell
python -m recipe_extractor "https://youtube.com/shorts/zHMWRiJwrxA?si=twNT-jRrzQLvy2ib" --download-audio --youtube-client web --pretty
```

STT까지 실행하려면 `faster-whisper` 선택 의존성을 설치한 뒤 다음 명령을 사용합니다.

```powershell
python -m recipe_extractor "https://youtube.com/shorts/zHMWRiJwrxA?si=twNT-jRrzQLvy2ib" --with-stt --stt-model small --pretty
```

STT 결과로 레시피 초안까지 만들려면 다음 명령을 사용합니다.

```powershell
python -m recipe_extractor "https://youtube.com/shorts/zHMWRiJwrxA?si=twNT-jRrzQLvy2ib" --extract-recipe --stt-model small --pretty
```

로컬 Ollama를 사용하려면 Ollama 서버와 모델을 준비한 뒤 provider를 바꿉니다.

```powershell
python -m recipe_extractor "https://youtube.com/shorts/zHMWRiJwrxA?si=twNT-jRrzQLvy2ib" --extract-recipe --recipe-provider ollama --ollama-model llama3.1 --stt-model small --pretty
```

성공하면 다음 형태의 JSON을 출력합니다.

```json
{
  "url": "https://www.youtube.com/shorts/VIDEO_ID",
  "video_id": "VIDEO_ID",
  "title": "영상 제목",
  "description": "영상 설명란",
  "duration_seconds": 42,
  "channel_name": "채널명",
  "tags": ["recipe", "shorts"]
}
```

`--download-audio`, `--with-stt`, `--extract-recipe`를 사용하면 `audio`, `transcript`, `recipe` 필드가 추가됩니다. `recipe`에는 앱 표시용 `description`, 몇 인분인지 나타내는 `servings`, 몇 인분 값의 출처를 나타내는 `servings_source`, 분 단위 예상 조리시간 `estimated_cooking_time_minutes`, AI 초안 상태를 나타내는 `extraction_status`가 포함됩니다.

## API 서버 실행

개발용 FastAPI 서버는 다음 명령으로 실행합니다.

```powershell
python -m recipe_extractor.api
```

또는 설치된 스크립트를 사용할 수 있습니다.

```powershell
recipe-extractor-api
```

로컬 Expo Web에서 직접 호출할 수 있도록 AI Worker는 다음 origin의 CORS를 허용합니다.

```text
http://localhost:8080
http://localhost:8081
http://localhost:19006
http://127.0.0.1:8080
http://127.0.0.1:8081
http://127.0.0.1:19006
```

서버가 뜨면 Swagger UI에서 직접 테스트할 수 있습니다.

```text
http://127.0.0.1:8001/docs
```

헬스체크:

```powershell
curl http://127.0.0.1:8001/health
```

서비스용 레시피 추출 API 예시:

```powershell
curl -X POST http://127.0.0.1:8001/extract `
  -H "Content-Type: application/json" `
  -d "{\"url\":\"https://youtube.com/shorts/zHMWRiJwrxA?si=twNT-jRrzQLvy2ib\"}"
```

STT 모델, Ollama 모델, 쿠키 등을 직접 바꿔 실험하려면 개발자용 API를 사용합니다.

```powershell
curl -X POST http://127.0.0.1:8001/debug/extract `
  -H "Content-Type: application/json" `
  -d "{\"url\":\"https://youtube.com/shorts/zHMWRiJwrxA?si=twNT-jRrzQLvy2ib\",\"extract_recipe\":true,\"recipe_provider\":\"ollama\",\"ollama_model\":\"qwen2.5:7b\",\"stt_model\":\"small\"}"
```

오류 응답은 `detail.code`와 `detail.message`로 구분합니다. 서비스용 `/extract`는 사용자에게 노출 가능한 표준 메시지만 반환하고, 개발자용 `/debug/extract`는 원인 분석을 위해 `detail.debug_message`를 추가로 반환할 수 있습니다.

```json
{
  "detail": {
    "code": "NOT_RECIPE_CONTENT",
    "message": "요리 레시피 영상으로 판단하기 어렵습니다."
  }
}
```

주요 오류 코드는 다음과 같습니다.

- `INVALID_YOUTUBE_URL`: URL 형식이 아니거나 유튜브 URL이 아님
- `UNSUPPORTED_YOUTUBE_URL`: 유튜브 URL이지만 Shorts가 아님
- `YOUTUBE_VIDEO_UNAVAILABLE`: 삭제, 비공개, 존재하지 않는 영상
- `YOUTUBE_ACCESS_DENIED`: 인증 필요 또는 유튜브 접근 차단
- `NOT_RECIPE_CONTENT`: 요리 레시피 영상으로 보기 어려움
- `YOUTUBE_DEPENDENCY_MISSING`: yt-dlp 등 의존성 누락

## 주의사항

- 운영 반영 전 유튜브 약관과 저작권 정책을 별도로 검토합니다.
- 원본 영상 파일은 기본적으로 저장하지 않습니다.
- 오디오 파일은 `tmp/audio` 아래 임시 파일로 저장합니다.
- 메타데이터만으로 부족한 경우에만 STT, OCR, VLM 단계를 추가합니다.
- 현재 API는 동기 처리입니다. Spring Boot와 모바일 앱 연동 전 비동기 작업 큐 전환을 검토합니다.
