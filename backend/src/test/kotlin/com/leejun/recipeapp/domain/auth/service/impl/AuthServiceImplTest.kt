package com.leejun.recipeapp.domain.auth.service.impl

import com.leejun.recipeapp.domain.auth.dto.LoginRequest
import com.leejun.recipeapp.domain.auth.dto.NaverLoginRequest
import com.leejun.recipeapp.domain.auth.dto.RefreshTokenRequest
import com.leejun.recipeapp.domain.auth.dto.SignUpRequest
import com.leejun.recipeapp.domain.auth.entity.AuthProvider
import com.leejun.recipeapp.domain.auth.entity.RefreshToken
import com.leejun.recipeapp.domain.auth.entity.User
import com.leejun.recipeapp.domain.auth.entity.UserAuthProvider
import com.leejun.recipeapp.domain.auth.entity.UserStatus
import com.leejun.recipeapp.domain.auth.oauth.NaverProfile
import com.leejun.recipeapp.domain.auth.oauth.NaverProfileClient
import com.leejun.recipeapp.domain.auth.repository.RefreshTokenRepository
import com.leejun.recipeapp.domain.auth.repository.UserAuthProviderRepository
import com.leejun.recipeapp.domain.auth.repository.UserRepository
import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import com.leejun.recipeapp.global.security.JwtProvider
import com.leejun.recipeapp.global.security.RefreshTokenHasher
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import java.time.LocalDateTime
import java.util.Optional

/**
 * - AuthServiceImpl의 핵심 인증 흐름을 단위 테스트로 검증한다.
 * - Repository는 mock으로 대체하고 비밀번호 암호화와 JWT 발급은 실제 구현을 사용한다.
 * - 이메일 로그인 유지 구간에서 회귀를 막기 위한 테스트다.
 */
class AuthServiceImplTest {

    private lateinit var userRepository: UserRepository
    private lateinit var refreshTokenRepository: RefreshTokenRepository
    private lateinit var userAuthProviderRepository: UserAuthProviderRepository
    private lateinit var naverProfileClient: NaverProfileClient
    private lateinit var authService: AuthServiceImpl

    private val passwordEncoder = BCryptPasswordEncoder()
    private val refreshTokenHasher = RefreshTokenHasher()
    private val jwtProvider = JwtProvider(
        secret = "test-secret-key-must-be-at-least-256-bits-for-hs256-algorithm",
        accessTokenExpiry = 3_600_000,
        refreshTokenExpiry = 604_800_000
    )

    /**
     * - 각 테스트마다 독립적인 Repository mock과 서비스 인스턴스를 준비한다.
     * - 테스트 간 mock 호출 이력이 섞이지 않도록 한다.
     */
    @BeforeEach
    fun setUp() {
        userRepository = mockk()
        refreshTokenRepository = mockk()
        userAuthProviderRepository = mockk()
        naverProfileClient = mockk()
        every { refreshTokenRepository.save(any<RefreshToken>()) } answers { firstArg<RefreshToken>() }
        authService = AuthServiceImpl(
            userRepository = userRepository,
            refreshTokenRepository = refreshTokenRepository,
            userAuthProviderRepository = userAuthProviderRepository,
            naverProfileClient = naverProfileClient,
            passwordEncoder = passwordEncoder,
            jwtProvider = jwtProvider,
            refreshTokenHasher = refreshTokenHasher
        )
    }

    /**
     * - 회원가입 성공 시 비밀번호가 암호화되어 저장되는지 검증한다.
     * - 발급된 access token에 기본 USER 권한이 포함되는지 확인한다.
     */
    @Test
    fun `sign up saves encoded password and returns tokens`() {
        val request = SignUpRequest(
            email = "new@example.com",
            password = "password123",
            nickname = "new-user"
        )

        every { userRepository.existsByEmail(request.email) } returns false
        every { userRepository.save(any()) } answers { firstArg<User>() }

        val response = authService.signUp(request)

        assertThat(response.accessToken).isNotBlank()
        assertThat(response.refreshToken).isNotBlank()
        assertThat(jwtProvider.getRole(response.accessToken)).isEqualTo("USER")
        verify { refreshTokenRepository.save(any<RefreshToken>()) }
        verify {
            userRepository.save(match {
                it.email == request.email &&
                    it.nickname == request.nickname &&
                    it.password != request.password
            })
        }
    }

    /**
     * - 이미 존재하는 이메일로 회원가입할 수 없음을 검증한다.
     * - 서비스는 EMAIL_ALREADY_EXISTS 에러 코드를 반환해야 한다.
     */
    @Test
    fun `sign up rejects duplicate email`() {
        val request = SignUpRequest(
            email = "exists@example.com",
            password = "password123",
            nickname = "exists-user"
        )

        every { userRepository.existsByEmail(request.email) } returns true

        val exception = assertThrows(CustomException::class.java) {
            authService.signUp(request)
        }

        assertThat(exception.errorCode).isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS)
    }

    /**
     * - 올바른 이메일과 비밀번호로 로그인하면 토큰이 발급되는지 검증한다.
     * - 발급된 토큰에는 USER 권한이 포함되어야 한다.
     */
    @Test
    fun `login returns tokens when password matches`() {
        val rawPassword = "password123"
        val user = User.create(
            email = "user@example.com",
            encodedPassword = passwordEncoder.encode(rawPassword),
            nickname = "user"
        )

        every { userRepository.findByEmail(user.email!!) } returns Optional.of(user)

        val response = authService.login(LoginRequest(user.email!!, rawPassword))

        assertThat(response.accessToken).isNotBlank()
        assertThat(response.refreshToken).isNotBlank()
        assertThat(jwtProvider.getRole(response.accessToken)).isEqualTo("USER")
        verify { refreshTokenRepository.save(any<RefreshToken>()) }
    }

    /**
     * - 비밀번호가 일치하지 않으면 로그인 실패로 처리하는지 검증한다.
     * - 실패 사유는 계정 존재 여부를 노출하지 않는 INVALID_CREDENTIALS를 사용한다.
     */
    @Test
    fun `login rejects wrong password`() {
        val user = User.create(
            email = "user@example.com",
            encodedPassword = passwordEncoder.encode("password123"),
            nickname = "user"
        )

        every { userRepository.findByEmail(user.email!!) } returns Optional.of(user)

        val exception = assertThrows(CustomException::class.java) {
            authService.login(LoginRequest(user.email!!, "wrong-password"))
        }

        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_CREDENTIALS)
    }

    /**
     * - 소셜 전용 계정처럼 password가 null인 사용자는 이메일 로그인을 할 수 없다.
     * - NullPointerException이 아니라 표준 인증 실패로 처리되는지 검증한다.
     */
    @Test
    fun `login rejects social only account without password`() {
        val user = User.createSocialUser(
            email = "social@example.com",
            nickname = "social-user"
        )

        every { userRepository.findByEmail(user.email!!) } returns Optional.of(user)

        val exception = assertThrows(CustomException::class.java) {
            authService.login(LoginRequest(user.email!!, "password123"))
        }

        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_CREDENTIALS)
    }

    /**
     * - 네이버 제공자 연결이 이미 있으면 새 사용자를 만들지 않고 기존 사용자로 로그인한다.
     * - providerUserId는 네이버 response.id이며 이메일보다 우선하는 매칭 기준이다.
     */
    @Test
    fun `naver login returns tokens for existing linked user`() {
        val profile = NaverProfile(
            providerUserId = "naver-user-id",
            email = "naver@example.com",
            nickname = "naver-user",
            profileImageUrl = "https://example.com/profile.png"
        )
        val user = User.createSocialUser(
            email = profile.email,
            nickname = profile.nickname,
            profileImageUrl = profile.profileImageUrl
        )
        val provider = UserAuthProvider.create(
            user = user,
            provider = AuthProvider.NAVER,
            providerUserId = profile.providerUserId,
            providerEmail = profile.email,
            emailVerified = false
        )

        every { naverProfileClient.getProfile("naver-access-token") } returns profile
        every {
            userAuthProviderRepository.findByProviderAndProviderUserId(AuthProvider.NAVER, profile.providerUserId)
        } returns Optional.of(provider)

        val response = authService.loginWithNaver(NaverLoginRequest("naver-access-token"))

        assertThat(response.accessToken).isNotBlank()
        assertThat(response.refreshToken).isNotBlank()
        assertThat(jwtProvider.getRole(response.accessToken)).isEqualTo("USER")
        verify(exactly = 0) { userRepository.save(any<User>()) }
        verify(exactly = 0) { userAuthProviderRepository.save(any<UserAuthProvider>()) }
        verify { refreshTokenRepository.save(any<RefreshToken>()) }
    }

    /**
     * - 네이버 제공자 연결이 없으면 내부 사용자와 NAVER 연결 정보를 함께 생성한다.
     * - 네이버 이메일은 저장하되 같은 이메일 자동 연결은 별도 정책으로 남겨둔다.
     */
    @Test
    fun `naver login creates user and provider link when first login`() {
        val profile = NaverProfile(
            providerUserId = "new-naver-id",
            email = "new-naver@example.com",
            nickname = "new-naver-user",
            profileImageUrl = null
        )

        every { naverProfileClient.getProfile("new-naver-token") } returns profile
        every {
            userAuthProviderRepository.findByProviderAndProviderUserId(AuthProvider.NAVER, profile.providerUserId)
        } returns Optional.empty()
        every { userRepository.save(any<User>()) } answers { firstArg<User>() }
        every { userAuthProviderRepository.save(any<UserAuthProvider>()) } answers { firstArg<UserAuthProvider>() }

        val response = authService.loginWithNaver(NaverLoginRequest("new-naver-token"))

        assertThat(response.accessToken).isNotBlank()
        assertThat(response.refreshToken).isNotBlank()
        verify {
            userRepository.save(match {
                it.email == profile.email &&
                    it.nickname == profile.nickname &&
                    it.password == null
            })
        }
        verify {
            userAuthProviderRepository.save(match {
                it.provider == AuthProvider.NAVER &&
                    it.providerUserId == profile.providerUserId &&
                    it.providerEmail == profile.email &&
                    !it.emailVerified
            })
        }
    }

    /**
     * - 네이버 provider 연결이 있더라도 내부 사용자 상태가 ACTIVE가 아니면 로그인을 막는다.
     * - 정지 또는 삭제 계정은 새 JWT를 발급받을 수 없어야 한다.
     */
    @Test
    fun `naver login rejects inactive linked user`() {
        val profile = NaverProfile(
            providerUserId = "suspended-naver-id",
            email = "suspended@example.com",
            nickname = "suspended-user",
            profileImageUrl = null
        )
        val user = User.createSocialUser(
            email = profile.email,
            nickname = profile.nickname,
            status = UserStatus.SUSPENDED
        )
        val provider = UserAuthProvider.create(
            user = user,
            provider = AuthProvider.NAVER,
            providerUserId = profile.providerUserId,
            providerEmail = profile.email,
            emailVerified = false
        )

        every { naverProfileClient.getProfile("suspended-token") } returns profile
        every {
            userAuthProviderRepository.findByProviderAndProviderUserId(AuthProvider.NAVER, profile.providerUserId)
        } returns Optional.of(provider)

        val exception = assertThrows(CustomException::class.java) {
            authService.loginWithNaver(NaverLoginRequest("suspended-token"))
        }

        assertThat(exception.errorCode).isEqualTo(ErrorCode.USER_NOT_ACTIVE)
        verify(exactly = 0) { refreshTokenRepository.save(any<RefreshToken>()) }
    }

    /**
     * - 활성 refresh token으로 새 토큰 쌍을 발급할 수 있는지 검증한다.
     * - 기존 refresh token은 즉시 revokedAt이 설정되어 재사용을 막아야 한다.
     * - 새 refresh token은 해시 저장소에 다시 저장되어야 한다.
     */
    @Test
    fun `refresh rotates refresh token and returns new tokens`() {
        val user = User.create(
            email = "user@example.com",
            encodedPassword = passwordEncoder.encode("password123"),
            nickname = "user"
        )
        val refreshToken = jwtProvider.generateRefreshToken(user.id, user.email, user.role.name)
        val storedToken = RefreshToken.create(
            user = user,
            tokenHash = refreshTokenHasher.hash(refreshToken),
            expiresAt = LocalDateTime.now().plusDays(1)
        )

        every {
            refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(refreshTokenHasher.hash(refreshToken))
        } returns Optional.of(storedToken)

        val response = authService.refresh(RefreshTokenRequest(refreshToken))

        assertThat(response.accessToken).isNotBlank()
        assertThat(response.refreshToken).isNotBlank()
        assertThat(storedToken.revokedAt).isNotNull()
        verify(exactly = 1) {
            refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(refreshTokenHasher.hash(refreshToken))
        }
        verify(exactly = 1) { refreshTokenRepository.save(any<RefreshToken>()) }
    }

    /**
     * - 저장소에 없는 refresh token은 재발급에 사용할 수 없어야 한다.
     * - 서명이 유효하더라도 서버 저장소에서 찾지 못하면 INVALID_REFRESH_TOKEN을 반환한다.
     */
    @Test
    fun `refresh rejects token not found in store`() {
        val refreshToken = jwtProvider.generateRefreshToken(1L, "user@example.com", "USER")

        every {
            refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(refreshTokenHasher.hash(refreshToken))
        } returns Optional.empty()

        val exception = assertThrows(CustomException::class.java) {
            authService.refresh(RefreshTokenRequest(refreshToken))
        }

        assertThat(exception.errorCode).isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN)
    }

    /**
     * - logout 요청은 활성 refresh token을 폐기 처리해야 한다.
     * - 폐기 후 같은 토큰은 재발급에 사용할 수 없다.
     */
    @Test
    fun `logout revokes active refresh token`() {
        val user = User.create(
            email = "user@example.com",
            encodedPassword = passwordEncoder.encode("password123"),
            nickname = "user"
        )
        val refreshToken = jwtProvider.generateRefreshToken(user.id, user.email, user.role.name)
        val storedToken = RefreshToken.create(
            user = user,
            tokenHash = refreshTokenHasher.hash(refreshToken),
            expiresAt = LocalDateTime.now().plusDays(1)
        )

        every {
            refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(refreshTokenHasher.hash(refreshToken))
        } returns Optional.of(storedToken)

        authService.logout(RefreshTokenRequest(refreshToken))

        assertThat(storedToken.revokedAt).isNotNull()
    }
}
