package com.leejun.recipeapp.domain.auth.oauth

import com.fasterxml.jackson.annotation.JsonProperty
import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException

/**
 * - Google tokeninfo API로 id token을 검증하는 구현체다.
 * - 응답의 aud claim을 허용된 Client ID 목록과 비교한다.
 * - sub claim을 Google 사용자 고유 식별자로 사용한다.
 */
@Component
class GoogleTokenVerifierImpl(
    restClientBuilder: RestClient.Builder,
    private val properties: GoogleOAuthProperties
) : GoogleTokenVerifier {

    private val restClient: RestClient = restClientBuilder.build()

    /**
     * - Google id token을 검증하고 내부 프로필 모델로 변환한다.
     * - Google API 인증 실패 또는 통신 실패는 INVALID_OAUTH_TOKEN으로 처리한다.
     * - audience 불일치와 필수 claim 누락은 위조 또는 잘못된 토큰으로 간주한다.
     */
    override fun verify(idToken: String): GoogleProfile {
        val response = try {
            restClient.get()
                .uri("${properties.tokenInfoUri}?id_token={idToken}", idToken)
                .retrieve()
                .onStatus({ status -> status.is4xxClientError }) { _, _ ->
                    throw CustomException(ErrorCode.INVALID_OAUTH_TOKEN)
                }
                .body(GoogleTokenInfoResponse::class.java)
        } catch (exception: CustomException) {
            throw exception
        } catch (exception: RestClientException) {
            throw CustomException(ErrorCode.OAUTH_PROVIDER_ERROR)
        }

        val tokenInfo = response ?: throw CustomException(ErrorCode.OAUTH_PROVIDER_ERROR)
        validateAudience(tokenInfo.audience)

        val providerUserId = tokenInfo.subject?.takeIf { it.isNotBlank() }
            ?: throw CustomException(ErrorCode.INVALID_OAUTH_TOKEN)

        return GoogleProfile(
            providerUserId = providerUserId,
            email = tokenInfo.email?.takeIf { it.isNotBlank() },
            emailVerified = tokenInfo.emailVerified == "true",
            nickname = tokenInfo.name?.takeIf { it.isNotBlank() }
                ?: tokenInfo.email?.substringBefore("@")?.takeIf { it.isNotBlank() }
                ?: DEFAULT_NICKNAME,
            profileImageUrl = tokenInfo.picture?.takeIf { it.isNotBlank() }
        )
    }

    /**
     * - token audience가 현재 앱에서 허용한 Google Client ID인지 확인한다.
     * - Web Client ID로 개발하고 추후 iOS Client ID를 목록에 추가하는 구조다.
     * - 허용 목록이 비어 있으면 설정 오류로 보고 provider error를 반환한다.
     */
    private fun validateAudience(audience: String?) {
        if (properties.allowedAudiences.isEmpty()) {
            throw CustomException(ErrorCode.OAUTH_PROVIDER_ERROR)
        }

        if (audience.isNullOrBlank() || audience !in properties.allowedAudiences) {
            throw CustomException(ErrorCode.INVALID_OAUTH_TOKEN)
        }
    }

    companion object {
        private const val DEFAULT_NICKNAME = "Google 사용자"
    }
}

/**
 * - Google tokeninfo API 응답 중 로그인에 필요한 claim만 선언한다.
 * - JSON 표준 claim 이름을 Kotlin 이름으로 매핑한다.
 */
data class GoogleTokenInfoResponse(
    @JsonProperty("sub")
    val subject: String? = null,
    @JsonProperty("aud")
    val audience: String? = null,
    val email: String? = null,
    @JsonProperty("email_verified")
    val emailVerified: String? = null,
    val name: String? = null,
    val picture: String? = null
)
