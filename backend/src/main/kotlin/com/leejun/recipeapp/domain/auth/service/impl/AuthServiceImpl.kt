package com.leejun.recipeapp.domain.auth.service.impl

import com.leejun.recipeapp.domain.auth.dto.LoginRequest
import com.leejun.recipeapp.domain.auth.dto.NaverLoginRequest
import com.leejun.recipeapp.domain.auth.dto.RefreshTokenRequest
import com.leejun.recipeapp.domain.auth.dto.SignUpRequest
import com.leejun.recipeapp.domain.auth.dto.TokenResponse
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
import com.leejun.recipeapp.domain.auth.service.AuthService
import com.leejun.recipeapp.global.exception.CustomException
import com.leejun.recipeapp.global.exception.ErrorCode
import com.leejun.recipeapp.global.security.JwtProvider
import com.leejun.recipeapp.global.security.RefreshTokenHasher
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * - 이메일/비밀번호 기반 인증 흐름을 구현한다.
 * - 자체 회원가입은 MVP 후순위지만 기존 API와 테스트 유지를 위해 동작시킨다.
 * - 성공한 인증 결과는 앱 자체 access token과 refresh token으로 변환한다.
 */
@Service
@Transactional(readOnly = true)
class AuthServiceImpl(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val userAuthProviderRepository: UserAuthProviderRepository,
    private val naverProfileClient: NaverProfileClient,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider,
    private val refreshTokenHasher: RefreshTokenHasher
) : AuthService {

    private val log = LoggerFactory.getLogger(javaClass)

    /**
     * - 이메일 중복을 확인한 뒤 신규 사용자를 저장한다.
     * - 비밀번호는 BCrypt 등 PasswordEncoder로 암호화한 뒤 저장한다.
     * - 저장된 사용자의 기본 권한은 USER다.
     */
    @Transactional
    override fun signUp(request: SignUpRequest): TokenResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw CustomException(ErrorCode.EMAIL_ALREADY_EXISTS)
        }

        val user = User.create(
            email = request.email,
            encodedPassword = passwordEncoder.encode(request.password),
            nickname = request.nickname
        )
        val saved = userRepository.save(user)

        log.info("New user registered: {}", saved.email)
        return issueTokens(saved)
    }

    /**
     * - 이메일로 사용자를 조회하고 비밀번호를 검증한다.
     * - 소셜 전용 계정처럼 password가 null이면 인증 실패로 처리한다.
     * - 검증 성공 시 사용자 권한을 포함한 JWT를 발급한다.
     */
    override fun login(request: LoginRequest): TokenResponse {
        val user = userRepository.findByEmail(request.email)
            .orElseThrow { CustomException(ErrorCode.INVALID_CREDENTIALS) }

        val encodedPassword = user.password
            ?: throw CustomException(ErrorCode.INVALID_CREDENTIALS)

        if (!passwordEncoder.matches(request.password, encodedPassword)) {
            throw CustomException(ErrorCode.INVALID_CREDENTIALS)
        }

        log.info("User logged in: {}", user.email)
        return issueTokens(user)
    }

    /**
     * - 네이버 access token으로 네이버 프로필을 조회한다.
     * - 기존 provider 연결이 있으면 연결된 내부 사용자로 앱 JWT를 발급한다.
     * - 연결이 없으면 내부 사용자와 NAVER provider 연결을 새로 생성한다.
     */
    @Transactional
    override fun loginWithNaver(request: NaverLoginRequest): TokenResponse {
        val profile = naverProfileClient.getProfile(request.accessToken)
        val linkedProvider = userAuthProviderRepository
            .findByProviderAndProviderUserId(AuthProvider.NAVER, profile.providerUserId)
            .orElse(null)

        if (linkedProvider != null) {
            val user = linkedProvider.user
            if (user.status != UserStatus.ACTIVE) {
                throw CustomException(ErrorCode.USER_NOT_ACTIVE)
            }

            log.info("Naver user logged in: {}", profile.providerUserId)
            return issueTokens(user)
        }

        val savedUser = createNaverUser(profile)
        userAuthProviderRepository.save(
            UserAuthProvider.create(
                user = savedUser,
                provider = AuthProvider.NAVER,
                providerUserId = profile.providerUserId,
                providerEmail = profile.email,
                emailVerified = false
            )
        )

        log.info("New Naver user registered: {}", profile.providerUserId)
        return issueTokens(savedUser)
    }

    /**
     * - refresh token을 검증하고 새 토큰 쌍을 발급한다.
     * - 기존 refresh token은 즉시 폐기해 재사용을 막는다.
     * - 저장소에 없는 토큰이나 만료된 토큰은 INVALID_REFRESH_TOKEN으로 처리한다.
     */
    @Transactional
    override fun refresh(request: RefreshTokenRequest): TokenResponse {
        jwtProvider.validate(request.refreshToken)

        val storedToken = findActiveRefreshToken(request.refreshToken)
        if (storedToken.expiresAt.isBefore(LocalDateTime.now())) {
            storedToken.revoke(LocalDateTime.now())
            throw CustomException(ErrorCode.INVALID_REFRESH_TOKEN)
        }

        storedToken.revoke(LocalDateTime.now())
        return issueTokens(storedToken.user)
    }

    /**
     * - refresh token을 폐기해 로그아웃을 처리한다.
     * - 유효하지 않거나 이미 폐기된 토큰은 INVALID_REFRESH_TOKEN으로 처리한다.
     * - access token은 stateless라 만료 전 강제 폐기 대상에서 제외한다.
     */
    @Transactional
    override fun logout(request: RefreshTokenRequest) {
        jwtProvider.validate(request.refreshToken)

        val storedToken = findActiveRefreshToken(request.refreshToken)
        storedToken.revoke(LocalDateTime.now())
    }

    /**
     * - 원문 refresh token을 해시한 뒤 활성 저장 레코드를 조회한다.
     * - 원문 토큰은 DB에 저장하지 않는다.
     */
    private fun findActiveRefreshToken(refreshToken: String): RefreshToken {
        val tokenHash = refreshTokenHasher.hash(refreshToken)
        return refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(tokenHash)
            .orElseThrow { CustomException(ErrorCode.INVALID_REFRESH_TOKEN) }
    }

    /**
     * - 네이버 프로필 기반으로 비밀번호 없는 소셜 사용자를 생성한다.
     * - 이메일은 사용자 식별 기준이 아니므로 중복 여부로 계정을 자동 연결하지 않는다.
     * - 자동 계정 연결 정책은 별도 기능으로 분리해 명시적으로 구현한다.
     */
    private fun createNaverUser(profile: NaverProfile): User =
        userRepository.save(
            User.createSocialUser(
                email = profile.email,
                nickname = profile.nickname,
                profileImageUrl = profile.profileImageUrl
            )
        )

    /**
     * - 사용자 식별자, 이메일, 권한을 JWT 클레임으로 포함한다.
     * - refresh token 원문은 응답으로만 전달하고 DB에는 해시값과 만료 시각만 저장한다.
     */
    private fun issueTokens(user: User): TokenResponse {
        val accessToken = jwtProvider.generateAccessToken(user.id, user.email, user.role.name)
        val refreshToken = jwtProvider.generateRefreshToken(user.id, user.email, user.role.name)

        refreshTokenRepository.save(
            RefreshToken.create(
                user = user,
                tokenHash = refreshTokenHasher.hash(refreshToken),
                expiresAt = LocalDateTime.now().plusSeconds(jwtProvider.getRefreshTokenExpiryMillis() / 1000)
            )
        )

        return TokenResponse(accessToken = accessToken, refreshToken = refreshToken)
    }
}
