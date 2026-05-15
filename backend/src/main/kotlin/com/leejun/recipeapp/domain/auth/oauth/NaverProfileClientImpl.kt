package com.leejun.recipeapp.domain.auth.oauth

import com.fasterxml.jackson.annotation.JsonProperty
import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException

/**
 * - 네이버 회원 프로필 조회 API를 호출하는 HTTP 클라이언트다.
 * - 네이버 access token은 Authorization 헤더로만 전달하고 서버에 저장하지 않는다.
 * - 네이버 장애와 응답 형식 문제는 OAUTH_PROVIDER_ERROR로 표준화한다.
 */
@Component
class NaverProfileClientImpl(
    restClientBuilder: RestClient.Builder,
    @Value("\${oauth.naver.profile-uri}") private val profileUri: String
) : NaverProfileClient {

    private val restClient: RestClient = restClientBuilder.build()

    /**
     * - 네이버 프로필 조회 API를 호출하고 앱에서 필요한 필드만 추출한다.
     * - HTTP 401 또는 403은 사용자가 전달한 네이버 토큰 문제로 간주한다.
     * - resultcode 실패 또는 필수 id 누락은 제공자 응답 오류로 처리한다.
     */
    override fun getProfile(accessToken: String): NaverProfile {
        val response = try {
            restClient.get()
                .uri(profileUri)
                .header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken")
                .retrieve()
                .onStatus({ status -> status.value() == 401 || status.value() == 403 }) { _, _ ->
                    throw CustomException(ErrorCode.INVALID_OAUTH_TOKEN)
                }
                .body(NaverProfileResponse::class.java)
        } catch (exception: CustomException) {
            throw exception
        } catch (exception: RestClientException) {
            throw CustomException(ErrorCode.OAUTH_PROVIDER_ERROR)
        }

        if (response?.resultCode != "00") {
            throw CustomException(ErrorCode.OAUTH_PROVIDER_ERROR)
        }

        val body = response.response ?: throw CustomException(ErrorCode.OAUTH_PROVIDER_ERROR)
        val providerUserId = body.id?.takeIf { it.isNotBlank() }
            ?: throw CustomException(ErrorCode.OAUTH_PROVIDER_ERROR)

        return NaverProfile(
            providerUserId = providerUserId,
            email = body.email?.takeIf { it.isNotBlank() },
            nickname = body.nickname?.takeIf { it.isNotBlank() } ?: DEFAULT_NICKNAME,
            profileImageUrl = body.profileImage?.takeIf { it.isNotBlank() }
        )
    }

    companion object {
        private const val DEFAULT_NICKNAME = "네이버 사용자"
    }
}

/**
 * - 네이버 회원 프로필 조회 API의 최상위 응답 구조다.
 * - 네이버 문서의 resultcode 필드를 Kotlin 네이밍으로 매핑한다.
 */
data class NaverProfileResponse(
    @JsonProperty("resultcode")
    val resultCode: String? = null,
    val message: String? = null,
    val response: NaverProfileBody? = null
)

/**
 * - 네이버 응답의 response 객체 중 앱에서 사용하는 필드만 선언한다.
 * - profile_image는 JSON snake case를 Kotlin camel case로 매핑한다.
 */
data class NaverProfileBody(
    val id: String? = null,
    val email: String? = null,
    val nickname: String? = null,
    @JsonProperty("profile_image")
    val profileImage: String? = null
)
