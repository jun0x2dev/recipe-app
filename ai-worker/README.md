# AI Worker

유튜브 쇼츠 URL에서 레시피 후보 정보를 추출하는 Python 워커입니다.

현재 범위는 유튜브 쇼츠 URL 검증, 영상 메타데이터 추출, STT, 레시피 초안 구조화 실험입니다. 개발용 API 서버는 FastAPI로 실행합니다.

## 빠른 실행

macOS/Linux 기준입니다.

```bash
cd ai-worker
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e ".[api,stt]"
python -m recipe_extractor.api
```

서버가 뜨면 Swagger UI에서 테스트할 수 있습니다.

```text
http://127.0.0.1:8001/docs
```

헬스체크:

```bash
curl http://127.0.0.1:8001/health
```

## Windows 설치 및 실행

### 1. Python 가상환경 준비

Windows PowerShell에서는 다음 순서로 설치합니다.

```powershell
cd E:\LEEJUN\LEEJUN\prj-workspace\recipe-app\ai-worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e ".[api,stt]"
```

실행 정책 때문에 가상환경 활성화가 막히면 현재 터미널에서만 다음 명령을 먼저 실행합니다.

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

이미 가상환경을 만든 뒤 다시 들어왔을 때:

```powershell
cd E:\LEEJUN\LEEJUN\prj-workspace\recipe-app\ai-worker
.\.venv\Scripts\Activate.ps1
```

### 2. Ollama 설치

winget을 사용할 수 있으면 다음 명령으로 설치합니다.

```powershell
winget install Ollama.Ollama
```

설치 후 새 PowerShell을 열고 확인합니다.

```powershell
ollama --version
```

`ollama` 명령을 찾지 못하면 설치 경로의 실행 파일을 직접 호출합니다.

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" --version
```

winget 설치가 어렵다면 공식 다운로드 페이지에서 Windows 설치 파일을 받아 설치합니다.

```text
https://ollama.com/download
```

### 3. AI 모델 설치

현재 기본 모델은 `gemma3:12b`입니다.

```powershell
ollama pull gemma3:12b
```

`ollama` 명령이 PATH에 잡히지 않았으면 다음처럼 실행합니다.

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull gemma3:12b
```

설치된 모델 목록 확인:

```powershell
ollama list
```

### 4. AI 모델 실행 테스트

```powershell
ollama run gemma3:12b "김치볶음밥 재료를 한국어로 간단히 알려줘"
```

PATH 문제가 있으면:

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" run gemma3:12b "김치볶음밥 재료를 한국어로 간단히 알려줘"
```

### 5. AI Worker 서버 실행

Ollama가 백그라운드에서 실행 중인 상태에서 AI Worker를 켭니다.

```powershell
cd E:\LEEJUN\LEEJUN\prj-workspace\recipe-app\ai-worker
.\.venv\Scripts\Activate.ps1
python -m recipe_extractor.api
```

서버 주소:

```text
http://127.0.0.1:8001
```

Swagger UI:

```text
http://127.0.0.1:8001/docs
```

PowerShell에서 음식명 기반 생성 API 테스트:

```powershell
curl -X POST http://127.0.0.1:8001/generate `
  -H "Content-Type: application/json" `
  -d "{\"query\":\"김치볶음밥\"}"
```

PowerShell에서 유튜브 쇼츠 추출 API 테스트:

```powershell
curl -X POST http://127.0.0.1:8001/extract `
  -H "Content-Type: application/json" `
  -d "{\"url\":\"https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv\"}"
```

### 6. AI 모델 삭제

설치된 모델을 확인합니다.

```powershell
ollama list
```

사용하지 않는 모델을 삭제합니다.

```powershell
ollama rm qwen2.5:7b
ollama rm qwen3:8b
ollama rm gemma3:12b
```

PATH 문제가 있으면:

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" rm qwen2.5:7b
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" rm qwen3:8b
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" rm gemma3:12b
```

## macOS 설치 및 실행

### 1. Python 가상환경 준비

```bash
cd /path/to/recipe-app/ai-worker
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e ".[api,stt]"
```

이미 가상환경을 만든 뒤 다시 들어왔을 때:

```bash
cd /path/to/recipe-app/ai-worker
source .venv/bin/activate
```

### 2. Ollama 설치

공식 macOS 설치 방식은 Ollama 앱을 설치한 뒤 Terminal에서 `ollama` CLI를 사용하는 방식입니다.

```text
https://ollama.com/download
```

Homebrew를 사용한다면 다음 명령도 사용할 수 있습니다.

```bash
brew install ollama
```

설치 확인:

```bash
ollama --version
```

공식 macOS 설치 문서는 다음 링크에서 확인할 수 있습니다.

```text
https://docs.ollama.com/macos
```

### 3. AI 모델 설치

현재 기본 모델은 `gemma3:12b`입니다.

```bash
ollama pull gemma3:12b
```

설치된 모델 목록 확인:

```bash
ollama list
```

### 4. AI 모델 실행 테스트

```bash
ollama run gemma3:12b "김치볶음밥 재료를 한국어로 간단히 알려줘"
```

### 5. AI Worker 서버 실행

Ollama가 실행 중인 상태에서 AI Worker를 켭니다.

```bash
cd /path/to/recipe-app/ai-worker
source .venv/bin/activate
python -m recipe_extractor.api
```

서버 주소:

```text
http://127.0.0.1:8001
```

Swagger UI:

```text
http://127.0.0.1:8001/docs
```

음식명 기반 생성 API 테스트:

```bash
curl -X POST http://127.0.0.1:8001/generate \
  -H "Content-Type: application/json" \
  -d '{"query":"김치볶음밥"}'
```

유튜브 쇼츠 추출 API 테스트:

```bash
curl -X POST http://127.0.0.1:8001/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv"}'
```

### 6. AI 모델 삭제

설치된 모델을 확인합니다.

```bash
ollama list
```

사용하지 않는 모델을 삭제합니다.

```bash
ollama rm qwen2.5:7b
ollama rm qwen3:8b
ollama rm gemma3:12b
```

## Ollama 참고 링크

- 공식 다운로드: `https://ollama.com/download`
- macOS 공식 문서: `https://docs.ollama.com/macos`
- 모델 라이브러리: `https://ollama.com/library`

## 설치

Python 3.9 이상을 사용합니다.

처음 실행할 때:

```bash
cd ai-worker
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e ".[api,stt]"
```

이미 가상환경을 만든 뒤 다시 들어왔을 때:

```bash
cd ai-worker
source .venv/bin/activate
```

가상환경을 활성화하지 않고 실행할 수도 있습니다.

```bash
cd ai-worker
.venv/bin/python -m recipe_extractor.api
```

## 선택 의존성

기본 메타데이터 추출만 사용할 때:

```bash
python -m pip install -e .
```

STT까지 사용할 때:

```bash
python -m pip install -e ".[stt]"
```

FastAPI 서버와 STT를 함께 사용할 때:

```bash
python -m pip install -e ".[api,stt]"
```

## API 서버 실행

개발용 FastAPI 서버:

```bash
python -m recipe_extractor.api
```

설치된 스크립트로도 실행할 수 있습니다.

```bash
recipe-extractor-api
```

기본 주소:

```text
http://127.0.0.1:8001
```

Swagger UI:

```text
http://127.0.0.1:8001/docs
```

서비스용 추출 API 테스트:

```bash
curl -X POST http://127.0.0.1:8001/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv"}'
```

음식명 기반 레시피 생성 API 테스트:

기본 Ollama 모델은 `gemma3:12b`입니다.

```bash
curl -X POST http://127.0.0.1:8001/generate \
  -H "Content-Type: application/json" \
  -d '{"query":"김치볶음밥"}'
```

개발자용 추출 API 테스트:

```bash
curl -X POST http://127.0.0.1:8001/debug/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv","extract_recipe":true,"stt_model":"small"}'
```

## CLI 실행

유튜브 URL은 터미널에 단독으로 입력하지 않고, 아래 명령의 인자로 넣습니다.

메타데이터만 추출:

```bash
python -m recipe_extractor "https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv" --pretty
```

오디오 다운로드:

```bash
python -m recipe_extractor "https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv" --download-audio --pretty
```

STT 실행:

```bash
python -m recipe_extractor "https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv" --with-stt --stt-model small --pretty
```

STT 결과로 레시피 초안 생성:

```bash
python -m recipe_extractor "https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv" --extract-recipe --stt-model small --pretty
```

로컬 Ollama를 사용할 때:

```bash
python -m recipe_extractor "https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv" --extract-recipe --recipe-provider ollama --ollama-model gemma3:12b --stt-model small --pretty
```

YouTube가 오디오 다운로드를 `403 Forbidden`으로 막으면 브라우저 쿠키를 함께 전달합니다.

```bash
python -m recipe_extractor "https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv" --download-audio --cookies-from-browser chrome --pretty
```

## 모바일 앱 연동

로컬 Expo Web에서 직접 호출할 수 있도록 AI Worker는 다음 origin의 CORS를 허용합니다.

```text
http://localhost:8080
http://localhost:8081
http://localhost:19006
http://127.0.0.1:8080
http://127.0.0.1:8081
http://127.0.0.1:19006
```

모바일 앱에서 AI Worker 주소를 명시하려면 `apps/mobile/.env`에 설정합니다.

```env
EXPO_PUBLIC_AI_WORKER_BASE_URL=http://localhost:8001
```

iOS 시뮬레이터는 일반적으로 `localhost`로 접근할 수 있습니다. Android 에뮬레이터에서는 필요하면 `http://10.0.2.2:8001` 사용을 검토합니다.

## Windows PowerShell curl 참고

PowerShell에서 `curl` 줄바꿈을 사용할 때:

```powershell
curl -X POST http://127.0.0.1:8001/extract `
  -H "Content-Type: application/json" `
  -d "{\"url\":\"https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv\"}"
```

```powershell
curl -X POST http://127.0.0.1:8001/generate `
  -H "Content-Type: application/json" `
  -d "{\"query\":\"김치볶음밥\"}"
```

## 자주 나는 오류

### `setup.py` 또는 `setup.cfg`를 찾을 수 없음

다음 오류는 `pip` 또는 `setuptools`가 오래된 상태에서 발생할 수 있습니다.

```text
ERROR: File "setup.py" or "setup.cfg" not found.
(A "pyproject.toml" file was found, but editable mode currently requires a setuptools-based build.)
```

해결:

```bash
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e ".[api,stt]"
```

### `No module named 'recipe_extractor'`

패키지 설치가 실패했거나 가상환경이 활성화되지 않은 상태입니다.

```bash
source .venv/bin/activate
python -m pip install -e ".[api,stt]"
python -m recipe_extractor.api
```

### `zsh: command not found: ptrhon`

명령어 오타입니다. `ptrhon`이 아니라 `python`입니다.

```bash
python -m pip install --upgrade pip setuptools wheel
```

### URL만 입력했는데 아무 일도 안 일어남

유튜브 URL은 실행 명령이 아닙니다. CLI나 API 요청의 인자로 넣어야 합니다.

```bash
python -m recipe_extractor "https://youtube.com/shorts/ldsIYEb1t5o?si=A42NBH2ug9pPv" --pretty
```

## 오류 응답

오류 응답은 `detail.code`와 `detail.message`로 구분합니다. 서비스용 `/extract`는 사용자에게 노출 가능한 표준 메시지를 반환하고, 개발자용 `/debug/extract`는 `detail.debug_message`를 추가로 반환할 수 있습니다.

```json
{
  "detail": {
    "code": "NOT_RECIPE_CONTENT",
    "message": "요리 레시피 영상으로 판단하기 어렵습니다."
  }
}
```

주요 오류 코드:

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
- 현재 API는 동기 처리입니다. Spring Boot와 모바일 앱 연동 전 비동기 작업 큐 전환을 검토합니다.
