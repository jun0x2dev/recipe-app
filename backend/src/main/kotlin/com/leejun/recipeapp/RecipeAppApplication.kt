package com.leejun.recipeapp

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaAuditing

/**
 * - 레시피 앱 백엔드의 Spring Boot 진입점이다.
 * - JPA Auditing을 활성화해 엔티티의 생성일과 수정일을 자동 기록한다.
 * - 애플리케이션 전역 컴포넌트 스캔의 기준 패키지를 제공한다.
 */
@EnableJpaAuditing
@SpringBootApplication
class RecipeAppApplication

/**
 * - JVM 프로세스에서 Spring Boot 애플리케이션을 시작한다.
 * - 실행 인자는 Spring Boot 런타임 옵션으로 그대로 전달한다.
 */
fun main(args: Array<String>) {
    runApplication<RecipeAppApplication>(*args)
}
