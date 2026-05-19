package com.leejun.recipeapp.domain.ai.client

/**
 * - AI Worker HTTP 호출을 추상화한 인터페이스다.
 * - 컨트롤러/서비스는 이 인터페이스에만 의존하므로 테스트에서 mock으로 대체할 수 있다.
 * - 반환 타입은 AI Worker의 JSON 응답을 그대로 Map으로 전달한다.
 *   - 백엔드가 AI Worker 응답 구조 변경에 영향받지 않도록 투명 프록시 방식을 사용한다.
 */
interface AiWorkerClient {

    /**
     * - AI Worker `/generate` 엔드포인트를 호출한다.
     * - query: 음식명 또는 짧은 요청 문장
     * - 반환값: AI Worker 응답 JSON을 Map으로 역직렬화한 결과
     */
    fun generate(query: String): Map<String, Any>

    /**
     * - AI Worker `/extract` 엔드포인트를 호출한다.
     * - url: 유튜브 쇼츠 링크
     * - 반환값: AI Worker 응답 JSON을 Map으로 역직렬화한 결과
     */
    fun extract(url: String): Map<String, Any>
}
