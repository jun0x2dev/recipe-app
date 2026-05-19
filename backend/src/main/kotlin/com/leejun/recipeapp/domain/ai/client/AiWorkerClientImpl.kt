package com.leejun.recipeapp.domain.ai.client

import com.leejun.recipeapp.domain.ai.config.AiWorkerProperties
import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.MediaType
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.ResourceAccessException
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientResponseException
import java.net.SocketTimeoutException

/**
 * - AI Worker HTTP 호출을 담당하는 구현체다.
 * - RestClient를 사용해 AI Worker의 `/generate`, `/extract` 엔드포인트를 호출한다.
 * - AI Worker 장애, 타임아웃, 오류 응답을 표준 ErrorCode로 변환한다.
 * - AI Worker 응답을 Map으로 투명하게 전달해 백엔드가 AI 응답 구조에 결합되지 않게 한다.
 */
@Component
@EnableConfigurationProperties(AiWorkerProperties::class)
class AiWorkerClientImpl(
    restClientBuilder: RestClient.Builder,
    private val properties: AiWorkerProperties
) : AiWorkerClient {

    /**
     * - AI Worker 전용 RestClient를 구성한다.
     * - SimpleClientHttpRequestFactory를 사용해 HTTP/1.1로 통신한다.
     *   - JDK HttpClient 기본값인 HTTP/2 업그레이드가 uvicorn과 호환되지 않기 때문이다.
     * - connect-timeout, read-timeout은 AiWorkerProperties에서 주입받는다.
     */
    private val restClient: RestClient = run {
        val requestFactory = SimpleClientHttpRequestFactory().apply {
            setConnectTimeout(properties.connectTimeout.toInt())
            setReadTimeout(properties.readTimeout.toInt())
        }
        restClientBuilder
            .baseUrl(properties.baseUrl)
            .requestFactory(requestFactory)
            .build()
    }

    private val mapType = object : ParameterizedTypeReference<Map<String, Any>>() {}

    /**
     * - AI Worker `/generate`를 호출해 음식명 기반 레시피를 생성한다.
     * - 요청 본문: `{ "query": "..." }`
     * - AI Worker 오류 시 CustomException으로 변환한다.
     */
    override fun generate(query: String): Map<String, Any> {
        return callAiWorker("/generate", AiGenerateBody(query))
    }

    /**
     * - AI Worker `/extract`를 호출해 유튜브 쇼츠에서 레시피를 추출한다.
     * - 요청 본문: `{ "url": "..." }`
     * - STT + LLM 파이프라인으로 응답이 느릴 수 있어 read-timeout을 넉넉히 설정한다.
     */
    override fun extract(url: String): Map<String, Any> {
        return callAiWorker("/extract", AiExtractBody(url))
    }

    /**
     * - AI Worker 공통 HTTP 호출 로직이다.
     * - 요청 본문은 Jackson이 직렬화할 수 있는 객체를 받는다.
     * - 성공 시 응답 JSON을 Map으로 반환한다.
     * - 타임아웃: AI_WORKER_TIMEOUT, 연결 실패: AI_WORKER_UNAVAILABLE, 기타: AI_WORKER_ERROR
     */
    private fun callAiWorker(path: String, body: Any): Map<String, Any> {
        return try {
            restClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus({ status -> status.is4xxClientError || status.is5xxServerError }) { _, _ ->
                    throw CustomException(ErrorCode.AI_WORKER_ERROR)
                }
                .body(mapType)
                ?: throw CustomException(ErrorCode.AI_WORKER_ERROR)
        } catch (exception: CustomException) {
            throw exception
        } catch (exception: ResourceAccessException) {
            if (exception.cause is SocketTimeoutException) {
                throw CustomException(ErrorCode.AI_WORKER_TIMEOUT)
            }
            throw CustomException(ErrorCode.AI_WORKER_UNAVAILABLE)
        } catch (exception: RestClientResponseException) {
            throw CustomException(ErrorCode.AI_WORKER_ERROR)
        } catch (exception: Exception) {
            throw CustomException(ErrorCode.AI_WORKER_UNAVAILABLE)
        }
    }
}

/**
 * - AI Worker `/generate` 요청 본문이다.
 * - Jackson이 `{ "query": "..." }` 형태로 직렬화한다.
 */
private data class AiGenerateBody(val query: String)

/**
 * - AI Worker `/extract` 요청 본문이다.
 * - Jackson이 `{ "url": "..." }` 형태로 직렬화한다.
 */
private data class AiExtractBody(val url: String)
