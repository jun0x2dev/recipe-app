FROM python:3.11-slim
WORKDIR /app

COPY pyproject.toml ./
COPY src/ src/

# api + stt extras 설치 (faster-whisper 포함)
RUN pip install --no-cache-dir -e ".[api,stt]"

CMD ["recipe-extractor-api"]
