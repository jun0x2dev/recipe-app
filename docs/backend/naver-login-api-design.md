# 네이버 로그인 API 설계

## 목적

이 문서는 네이버 로그인을 백엔드 인증 체계에 연결하기 위한 API 설계안이다.

Apple 로그인은 Apple Developer Program 설정 이후로 미루고, 한국 사용자 편의를 위해 네이버 로그인을 우선 구현 대상으로 둔다.

## 기본 방향

- 모바일 앱은 네이버 SDK 또는 OAuth 흐름으로 네이버 access token을 획득한다.
- 백엔드는 클라이언트가 전달한 네이버 access token으로 네이버 사용자 프로필 조회 API를 호출한다.
- 내부 사용자 식별 기준은 네이버 이메일이 아니라 네이버 프로필의 `response.id`다.
- 앱 내부 인증은 기존 JWT access token과 refresh token을 그대로 사용한다.
- 네이버 access token과 refresh token은 DB에 저장하지 않는다.

## 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/oauth/naver` | 네이버 로그인 또는 최초 가입 | 불필요 |

## 요청

```json
{
  "accessToken": "NAVER_ACCESS_TOKEN"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `accessToken` | Y | 네이버 로그인으로 발급받은 access token |

## 응답

기존 인증 응답과 같은 `TokenResponse`를 사용한다.

```json
{
  "success": true,
  "data": {
    "accessToken": "APP_ACCESS_TOKEN",
    "refreshToken": "APP_REFRESH_TOKEN",
    "tokenType": "Bearer"
  },
  "error": null
}
```

## 서버 처리 흐름

1. 요청의 `accessToken`이 비어 있으면 validation 오류를 반환한다.
2. 백엔드가 네이버 회원 프로필 조회 API를 호출한다.
3. 네이버 API 응답의 `resultcode`가 성공인지 확인한다.
4. `response.id`를 네이버 사용자 고유 식별값으로 사용한다.
5. `(provider = NAVER, provider_user_id = response.id)`로 기존 연결 계정을 조회한다.
6. 기존 연결이 있으면 연결된 `users` 계정을 확인한다.
7. 사용자가 `ACTIVE` 상태가 아니면 접근을 거부한다.
8. 기존 연결이 없으면 신규 `users`와 `user_auth_providers`를 생성한다.
9. 앱 자체 JWT access token과 refresh token을 발급한다.
10. refresh token은 기존 정책대로 해시 저장한다.

## 네이버 프로필 조회

네이버 회원 프로필 조회 API를 사용한다.

```text
GET https://openapi.naver.com/v1/nid/me
Authorization: Bearer {accessToken}
```

응답에서 사용할 주요 필드는 다음과 같다.

| 필드 | 사용 여부 | 저장 위치 | 설명 |
| --- | --- | --- | --- |
| `response.id` | 필수 | `user_auth_providers.provider_user_id` | 네이버 동일인 식별 정보 |
| `response.email` | 선택 | `users.email`, `user_auth_providers.provider_email` | 사용자가 제공 동의한 이메일 |
| `response.nickname` | 선택 | `users.nickname` | 기본 닉네임 후보 |
| `response.profile_image` | 선택 | `users.profile_image_url` | 프로필 이미지 URL |

네이버 이메일은 사용자가 변경할 수 있고 동의 범위에 따라 제공되지 않을 수 있으므로 계정 매칭 기준으로 사용하지 않는다.

## DB 저장 정책

신규 네이버 로그인 사용자는 다음과 같이 저장한다.

`users`

- `email`: 네이버 프로필에 이메일이 있으면 저장, 없으면 null
- `password`: null
- `nickname`: 네이버 nickname이 있으면 사용, 없으면 `네이버 사용자`
- `profile_image_url`: 네이버 profile_image가 있으면 저장
- `role`: `USER`
- `status`: `ACTIVE`

`user_auth_providers`

- `provider`: `NAVER`
- `provider_user_id`: 네이버 `response.id`
- `provider_email`: 네이버 `response.email`이 있으면 저장
- `email_verified`: 네이버 응답 이메일은 별도 검증 claim이 없으므로 false로 저장

## 에러 정책

| 상황 | 에러 코드 | HTTP 상태 |
| --- | --- | --- |
| access token 누락 | `VALIDATION_ERROR` | 400 |
| 네이버 API 인증 실패 | `INVALID_OAUTH_TOKEN` | 401 |
| 네이버 API 호출 실패 | `OAUTH_PROVIDER_ERROR` | 502 |
| 네이버 응답에 `response.id` 없음 | `OAUTH_PROVIDER_ERROR` | 502 |
| 연결된 사용자가 비활성 상태 | `USER_NOT_ACTIVE` | 403 |

## 설정값

`application-local.yml`에는 실제 운영 secret을 넣지 않는다. 예시 파일에는 placeholder만 둔다.

```yaml
oauth:
  naver:
    profile-uri: https://openapi.naver.com/v1/nid/me
```

모바일 앱에서 네이버 SDK를 사용한다면 네이버 개발자센터의 Client ID, URL Scheme, 앱 패키지/번들 설정은 모바일 설정에 둔다. 백엔드는 사용자 프로필 조회에 필요한 access token만 받는다.

## 구현 단위

1. `NaverLoginRequest` DTO 추가
2. `OAuthProfile` 같은 공통 소셜 프로필 모델 추가
3. `NaverProfileClient` 추가
4. `UserAuthProviderRepository` 추가
5. `AuthProvider.NAVER` 기준 사용자 조회/생성 로직 추가
6. `POST /api/v1/auth/oauth/naver` 컨트롤러 추가
7. 네이버 로그인 성공/실패 테스트 추가

## 테스트 전략

- `NaverProfileClient`는 HTTP 호출을 mock server 또는 mock client로 검증한다.
- 서비스 테스트에서는 네이버 프로필 조회 결과를 fake로 주입해 사용자 생성/기존 사용자 로그인 흐름을 검증한다.
- 실패 케이스는 최소한 다음을 포함한다.
  - 빈 access token
  - 네이버 인증 실패
  - 네이버 응답에 id 없음
  - 비활성 사용자 연결

## 참고

- 네이버 로그인 개발가이드: https://developers.naver.com/docs/login/devguide/devguide.md
- 네이버 회원 프로필 조회 API 명세: https://developers.naver.com/docs/login/profile/profile.md

## 모바일 연동 메모

- 네이버 개발자센터 iOS URL Scheme은 `com.leejun.recipeapp`로 설정한다.
- 모바일 앱의 Expo scheme도 `com.leejun.recipeapp`로 맞춘다.
- 네이버 Client ID는 모바일 앱 설정에 둘 수 있지만 Client Secret은 저장소에 커밋하지 않는다.
- React Native 네이버 로그인 SDK는 Expo Go가 아니라 개발 빌드에서 검증한다.
