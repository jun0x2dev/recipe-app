package com.leejun.recipeapp.domain.auth.oauth

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

/**
 * - Google OAuth 검증에 필요한 설정값을 보관한다.
 * - allowedAudiences에는 Web Client ID와 추후 iOS Client ID를 함께 넣을 수 있다.
 * - tokenInfoUri는 로컬 테스트와 장애 대응을 위해 설정으로 분리한다.
 */
@Component
@ConfigurationProperties(prefix = "oauth.google")
class GoogleOAuthProperties {
    var tokenInfoUri: String = "https://oauth2.googleapis.com/tokeninfo"
    var allowedAudiences: List<String> = emptyList()
}
