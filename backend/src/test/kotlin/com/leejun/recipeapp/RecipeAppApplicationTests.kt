package com.leejun.recipeapp

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles

/**
 * - Spring Boot 애플리케이션 컨텍스트가 정상적으로 로드되는지 확인한다.
 * - 테스트 프로필을 사용해 H2 기반 설정으로 실행한다.
 * - 컴포넌트 스캔, JPA 설정, 보안 설정의 기본 부트스트랩 오류를 조기에 잡는다.
 */
@SpringBootTest
@ActiveProfiles("test")
class RecipeAppApplicationTests {

    /**
     * - 컨텍스트 로딩 자체가 검증 목적이다.
     * - 별도 assertion 없이 애플리케이션 시작 실패 여부만 확인한다.
     */
    @Test
    fun contextLoads() {
    }
}
