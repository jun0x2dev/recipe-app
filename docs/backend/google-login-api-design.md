# Google 로그인 API 설계

## 목적

이 문서는 Google 로그인을 백엔드 인증 체계에 연결하기 위한 API 설계안이다.

Windows 브라우저 개발 환경에서는 Web Client ID로 먼저 검증하고, iOS 앱 출시 준비 시 iOS Client ID를 추가하는 방향으로 둔다.

## 기본 방향

- 모바일 웹은 Google OAuth에서 `id_token`을 획득한다.
- 백엔드는 클라이언트가 전달한 `id_token`을 Google tokeninfo API로 검증한다.
- 내부 사용자 식별 기준은 Google 이메일이 아니라 `sub` claim이다.
- Google token의 `aud`는 허용된 Client ID 목록에 있어야 한다.
- 앱 내부 인증은 기존 JWT access token과 refresh token을 그대로 사용한다.
- Google Client Secret은 모바일 앱에 넣지 않는다.

## 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/oauth/google` | Google 로그인 또는 최초 가입 | 불필요 |

## 요청

```json
{
  "idToken": "GOOGLE_ID_TOKEN"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `idToken` | Y | Google OpenID Connect id token |

## 서버 처리 흐름

1. 요청의 `idToken`이 비어 있으면 validation 오류를 반환한다.
2. 백엔드가 Google tokeninfo API를 호출한다.
3. `aud`가 `oauth.google.allowed-audiences`에 포함되는지 확인한다.
4. `sub`를 Google 사용자 고유 식별값으로 사용한다.
5. `(provider = GOOGLE, provider_user_id = sub)`로 기존 연결 계정을 조회한다.
6. 기존 연결이 있으면 연결된 `users` 계정을 확인한다.
7. 사용자가 `ACTIVE` 상태가 아니면 접근을 거부한다.
8. 기존 연결이 없으면 신규 `users`와 `user_auth_providers`를 생성한다.
9. 앱 자체 JWT access token과 refresh token을 발급한다.
10. refresh token은 기존 정책대로 해시 저장한다.

## Google tokeninfo 검증

```text
GET https://oauth2.googleapis.com/tokeninfo?id_token={idToken}
```

| 필드 | 사용 여부 | 저장 위치 | 설명 |
| --- | --- | --- | --- |
| `sub` | 필수 | `user_auth_providers.provider_user_id` | Google 동일인 식별 정보 |
| `aud` | 필수 | 저장하지 않음 | 발급 대상 Client ID 검증 |
| `email` | 선택 | `users.email`, `user_auth_providers.provider_email` | Google 이메일 |
| `email_verified` | 선택 | `user_auth_providers.email_verified` | Google 이메일 검증 여부 |
| `name` | 선택 | `users.nickname` | 기본 닉네임 후보 |
| `picture` | 선택 | `users.profile_image_url` | 프로필 이미지 URL |

Google 이메일은 변경될 수 있으므로 계정 매칭 기준으로 사용하지 않는다.

## 설정값

```yaml
oauth:
  google:
    token-info-uri: https://oauth2.googleapis.com/tokeninfo
    allowed-audiences:
      - WEB_CLIENT_ID
      - IOS_CLIENT_ID_LATER
```

현재 개발 단계에서는 Web Client ID만 넣고, iOS 앱 검증 시 iOS Client ID를 같은 목록에 추가한다.

## 모바일 연동 메모

- 브라우저 개발 검증은 Web Client ID를 사용한다.
- Google Console의 승인된 리디렉션 URI에는 로그인 화면 주소를 등록해야 한다.
- 로컬 Expo 웹 기본 예시는 `http://localhost:8081/login`이다.
- iOS 앱 출시 검증 시 Bundle ID `com.leejun.recipeapp`로 iOS Client ID를 추가한다.
- 모바일 앱에는 Google Client Secret을 넣지 않는다.

## 에러 정책

| 상황 | 에러 코드 | HTTP 상태 |
| --- | --- | --- |
| id token 누락 | `VALIDATION_ERROR` | 400 |
| Google token 검증 실패 | `INVALID_OAUTH_TOKEN` | 401 |
| audience 불일치 | `INVALID_OAUTH_TOKEN` | 401 |
| Google API 호출 실패 | `OAUTH_PROVIDER_ERROR` | 502 |
| 연결된 사용자가 비활성 상태 | `USER_NOT_ACTIVE` | 403 |
