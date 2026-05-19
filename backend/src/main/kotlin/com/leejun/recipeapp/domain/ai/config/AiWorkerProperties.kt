package com.leejun.recipeapp.domain.ai.config

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * - AI Worker 연결 설정을 외부 설정 파일에서 주입받는다.
 * - `ai-worker.base-url` 키로 application.yml 또는 환경 변수에서 설정한다.
 * - connect-timeout과 read-timeout은 밀리초 단위이며 기본값을 포함한다.
 * - AI Worker `/extract`는 STT + LLM 파이프라인으로 시간이 오래 걸릴 수 있어 read-timeout을 넉넉히 잡는다.
 */
@ConfigurationProperties(prefix = "ai-worker")
data class AiWorkerProperties(
    val baseUrl: String = "http://localhost:8001",
    val connectTimeout: Long = 5000,
    val readTimeout: Long = 120000
)
