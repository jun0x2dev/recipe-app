# 인증 및 권한 설계

## 목적

이 문서는 Apple 로그인, 네이버 로그인, 구글 로그인을 같은 사용자 체계로 통합하고, 관리자와 일반 사용자 권한을 분리하기 위한 설계안이다.

현재 백엔드는 자체 회원가입/로그인과 JWT 발급 구조를 먼저 구현한 상태다. 다만 iOS 앱 출시와 MVP 범위를 고려해 자체 이메일/비밀번호 회원가입은 후순위로 두고, 소셜 로그인 중심으로 전환한다. 소셜 로그인은 기존 JWT 구조를 유지하되, 외부 OAuth 제공자 계정을 내부 사용자 계정에 연결하는 방식으로 확장한다.

## 설계 원칙

- 앱 내부의 최종 로그인 주체는 항상 `users` 테이블의 사용자다.
- Apple, 네이버, 구글, 이메일/비밀번호는 로그인 수단이며 사용자 그 자체가 아니다.
- 한 사용자는 여러 로그인 수단을 연결할 수 있다.
- 권한은 사용자 계정에 부여한다.
- MVP에서는 `USER`, `ADMIN` 두 권한만 사용한다.
- 관리자 권한은 API 요청이나 회원가입 요청값으로 직접 부여하지 않는다.
- 소셜 로그인 제공자 토큰은 장기 저장하지 않는다. 필요한 경우 최소 범위로만 임시 사용한다.
- iOS App Store 출시를 고려해 Apple 로그인을 MVP 인증의 1순위로 둔다.
- 자체 이메일/비밀번호 회원가입은 이메일 인증, 비밀번호 재설정, 계정 보안 운영이 준비된 뒤 재검토한다.

## 권장 인증 흐름

### MVP 인증 방식

MVP에서는 자체 회원가입 화면과 이메일/비밀번호 로그인을 제공하지 않는다.

우선순위는 다음과 같다.

1. Apple 로그인
2. 네이버 로그인
3. 구글 로그인
4. 이메일/비밀번호 회원가입 및 로그인은 후순위

### Apple/네이버/구글 로그인

1. 모바일 앱이 Apple, 네이버, 구글 SDK 또는 OAuth 흐름으로 로그인을 수행한다.
2. 클라이언트가 제공자 access token 또는 id token을 서버로 전송한다.
3. 서버가 제공자 API 또는 토큰 검증으로 사용자 식별값을 확인한다.
4. 서버가 `(provider, provider_user_id)` 조합으로 기존 연결 계정을 찾는다.
5. 연결 계정이 있으면 해당 `user_id`로 앱 자체 JWT를 발급한다.
6. 연결 계정이 없으면 이메일 기준으로 기존 사용자를 찾는다.
7. 같은 이메일 사용자가 있으면 정책에 따라 연결 확인 후 `user_auth_providers`를 추가한다.
8. 기존 사용자가 없으면 `users`와 `user_auth_providers`를 생성한 뒤 앱 자체 JWT를 발급한다.

### 이메일 회원가입/로그인

이메일/비밀번호 방식은 MVP에서 제외한다. 추후 도입 시에는 다음 기능을 함께 설계한다.

- 이메일 소유 인증
- 비밀번호 재설정
- 비밀번호 변경
- 비밀번호 정책
- 로그인 실패 제한
- 탈취 계정 복구 절차

## 계정 연결 정책

소셜 로그인에서 이메일이 내려오더라도 제공자별 이메일 신뢰도와 사용자 소유권 확인 수준이 다를 수 있다. 따라서 자동 연결 정책은 보수적으로 가져간다.

권장 정책은 다음과 같다.

- `(provider, provider_user_id)`가 이미 있으면 즉시 로그인 처리한다.
- 같은 이메일의 기존 사용자가 있고, 그 사용자가 이미 로그인된 상태에서 소셜 연결을 요청하면 연결한다.
- 같은 이메일의 기존 사용자가 있지만 비로그인 소셜 로그인 요청이라면 자동 연결하지 않고 `ACCOUNT_LINK_REQUIRED` 응답을 반환한다.
- 같은 이메일 사용자가 없으면 신규 사용자로 생성한다.

MVP에서는 UX 단순화를 위해 같은 이메일 사용자가 있으면 연결을 허용할 수도 있다. 다만 이 경우에도 제공자가 이메일 검증 여부를 제공하면 검증된 이메일일 때만 허용한다.

## 권한 모델

### 역할

| 역할 | 설명 |
| --- | --- |
| `USER` | 일반 사용자. 레시피 생성, 본인 레시피 수정/삭제, 공개 레시피 조회 가능 |
| `ADMIN` | 운영 관리자. 신고/부적절 콘텐츠 관리, 사용자 상태 변경, 관리자 API 접근 가능 |

### 권한 부여 방식

- 신규 가입자는 항상 `USER`로 생성한다.
- `ADMIN` 권한은 DB 마이그레이션, 운영자 전용 API, 또는 직접 운영 절차로만 부여한다.
- 클라이언트 요청값으로 `role`을 받지 않는다.
- JWT에는 `userId`, `role`을 포함하는 방향을 권장한다.
- 서버는 JWT의 role만 믿지 말고, 민감한 관리자 작업에서는 필요 시 DB의 최신 사용자 상태를 확인한다.

### 사용자 상태

권한과 별도로 사용자 계정 상태를 둔다.

| 상태 | 설명 |
| --- | --- |
| `ACTIVE` | 정상 사용 가능 |
| `SUSPENDED` | 운영자에 의해 일시 정지 |
| `DELETED` | 탈퇴 또는 삭제 처리 |

`SUSPENDED`, `DELETED` 사용자는 토큰이 유효하더라도 주요 API 접근을 차단한다.

## JWT 정책

- Access token은 짧게 유지한다.
- Refresh token은 DB에 해시로 저장해 재발급과 폐기를 관리한다.
- 로그아웃 시 refresh token을 폐기한다.
- 비밀번호 변경, 계정 정지, 탈퇴 시 기존 refresh token을 폐기한다.
- Access token에는 최소 클레임만 넣는다.

권장 access token 클레임:

```json
{
  "sub": "user@example.com",
  "userId": 1,
  "role": "USER",
  "type": "ACCESS"
}
```

## API 설계안

| 메서드 | 경로 | 설명 | 인증 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/oauth/apple` | Apple 로그인 | 불필요 |
| `POST` | `/api/v1/auth/oauth/naver` | 네이버 로그인 | 불필요 |
| `POST` | `/api/v1/auth/oauth/google` | 구글 로그인 | 불필요 |
| `POST` | `/api/v1/auth/oauth/link/apple` | 로그인된 사용자에 Apple 계정 연결 | 필요 |
| `POST` | `/api/v1/auth/oauth/link/naver` | 로그인된 사용자에 네이버 계정 연결 | 필요 |
| `POST` | `/api/v1/auth/oauth/link/google` | 로그인된 사용자에 구글 계정 연결 | 필요 |
| `POST` | `/api/v1/auth/refresh` | access token 재발급 | refresh token 필요 |
| `POST` | `/api/v1/auth/logout` | refresh token 폐기 | 필요 |
| `GET` | `/api/v1/users/me` | 내 정보 조회 | 필요 |
| `DELETE` | `/api/v1/users/me` | 계정 삭제 요청 | 필요 |

## Apple 로그인 API 설계

### 목적

Apple 로그인을 앱 MVP의 1순위 인증 수단으로 사용한다. 클라이언트는 Apple SDK로 로그인한 뒤 Apple이 발급한 `identityToken`을 백엔드로 전달하고, 백엔드는 토큰 검증 후 내부 사용자와 로그인 제공자 연결 정보를 생성하거나 조회한다.

### 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/oauth/apple` | Apple 로그인 또는 최초 가입 | 불필요 |

### 요청

```json
{
  "identityToken": "APPLE_IDENTITY_TOKEN",
  "authorizationCode": "APPLE_AUTHORIZATION_CODE",
  "nonce": "OPTIONAL_NONCE",
  "fullName": "홍길동"
}
```

필드 정책은 다음과 같다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `identityToken` | Y | Apple이 발급한 JWT. 서버 검증의 핵심 입력값 |
| `authorizationCode` | N | 추후 Apple token endpoint 연동이나 계정 삭제 revoke 대응을 위해 받을 수 있음 |
| `nonce` | N | 클라이언트가 Apple 요청에 nonce를 사용한 경우 서버에서 일치 여부 검증 |
| `fullName` | N | Apple 최초 승인 시에만 내려올 수 있는 이름 정보. 없으면 기본 닉네임 생성 |

MVP 서버 구현의 최소 필수값은 `identityToken`이다. `authorizationCode`는 Apple 계정 연결 해제나 revoke 정책을 강화할 때 사용할 수 있으므로 모바일에서 받을 수 있으면 함께 전달한다.

### 응답

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

### 서버 검증 절차

1. 요청의 `identityToken`이 비어 있으면 validation 오류를 반환한다.
2. Apple 공개키 목록을 조회하거나 캐시한다.
3. `identityToken` 헤더의 `kid`와 일치하는 Apple 공개키를 선택한다.
4. 선택한 공개키로 JWT 서명을 검증한다.
5. `iss`가 Apple issuer인지 검증한다.
6. `aud`가 앱의 Apple client id 또는 iOS bundle id와 일치하는지 검증한다.
7. `exp`가 만료되지 않았는지 검증한다.
8. nonce를 사용한 경우 토큰의 nonce claim과 요청 nonce를 비교한다.
9. `sub` claim을 Apple 사용자 고유 식별값으로 사용한다.
10. `(provider = APPLE, provider_user_id = sub)`로 기존 연결 계정을 조회한다.
11. 기존 연결이 있으면 해당 사용자로 앱 자체 JWT와 refresh token을 발급한다.
12. 기존 연결이 없으면 신규 `users`와 `user_auth_providers`를 생성한 뒤 앱 자체 JWT와 refresh token을 발급한다.

### Apple identity token claim 사용 정책

| Claim | 사용 여부 | 설명 |
| --- | --- | --- |
| `sub` | 필수 | Apple 사용자 고유 식별값. `provider_user_id`로 저장 |
| `email` | 선택 | 제공되는 경우 `users.email`, `provider_email`에 저장 |
| `email_verified` | 선택 | 제공되는 경우 `user_auth_providers.email_verified`에 반영 |
| `iss` | 필수 검증 | Apple issuer인지 확인 |
| `aud` | 필수 검증 | 앱 client id 또는 bundle id와 일치하는지 확인 |
| `exp` | 필수 검증 | 만료 토큰 차단 |
| `nonce` | 조건부 검증 | 클라이언트가 nonce를 사용한 경우 replay 방지에 사용 |

Apple 이메일은 사용자가 비공개 릴레이 이메일을 선택할 수 있으므로 계정 매칭의 기준으로 사용하지 않는다. 계정 매칭의 기준은 항상 Apple `sub`다.

### DB 저장 정책

신규 Apple 로그인 사용자는 다음과 같이 저장한다.

`users`

- `email`: identity token에 email이 있으면 저장, 없으면 null
- `password`: null
- `nickname`: `fullName`이 있으면 사용, 없으면 `Apple 사용자` 같은 기본값 사용
- `role`: `USER`
- `status`: `ACTIVE`

`user_auth_providers`

- `provider`: `APPLE`
- `provider_user_id`: Apple `sub`
- `provider_email`: identity token email이 있으면 저장
- `email_verified`: identity token 값이 있으면 반영, 없으면 false

### 에러 정책

| 상황 | 에러 코드 | HTTP 상태 |
| --- | --- | --- |
| identity token 누락 | `VALIDATION_ERROR` | 400 |
| Apple 토큰 서명 검증 실패 | `INVALID_OAUTH_TOKEN` | 401 |
| issuer 불일치 | `INVALID_OAUTH_TOKEN` | 401 |
| audience 불일치 | `INVALID_OAUTH_TOKEN` | 401 |
| 만료된 Apple 토큰 | `INVALID_OAUTH_TOKEN` | 401 |
| nonce 불일치 | `INVALID_OAUTH_TOKEN` | 401 |
| 같은 Apple 계정이 비활성 사용자에 연결됨 | `USER_NOT_ACTIVE` | 403 |

### 설정값

`application-local.yml`에는 실제 운영 secret을 넣지 않는다. 예시 파일에는 placeholder만 둔다.

```yaml
oauth:
  apple:
    issuer: https://appleid.apple.com
    audience: com.leejun.recipeapp
    jwks-uri: https://appleid.apple.com/auth/keys
```

`audience`는 iOS 네이티브 앱 흐름에서는 bundle id를 기준으로 검토한다. 웹/서비스 ID 흐름을 추가하면 Services ID와 분리해서 관리한다.

### 구현 단위

1. `AppleLoginRequest` DTO 추가
2. `OAuthProvider` 또는 `AppleIdentityTokenVerifier` 추가
3. Apple JWKS 조회 client 추가
4. Apple identity token 서명/claim 검증 구현
5. `UserAuthProviderRepository` 추가
6. `(APPLE, sub)` 기준 사용자 조회/생성 구현
7. 기존 `TokenResponse` 발급 흐름 재사용
8. Apple 로그인 성공/실패 테스트 추가

## 구현 우선순위

1. `users` 테이블에 `role`, `status`를 명확히 둔다.
2. `user_auth_providers` 테이블을 추가해 Apple/네이버/구글 로그인 수단을 분리한다.
3. JWT에 `role` 클레임을 포함하고 Spring Security 권한으로 변환한다.
4. refresh token 저장소를 추가한다.
5. Apple 로그인 API를 먼저 구현한다.
6. 네이버 로그인 API를 같은 인터페이스로 추가한다.
7. 구글 로그인 API는 사용자 수요와 운영 필요성을 보고 추가한다.
8. 앱 내 계정 삭제 API와 화면을 MVP 출시 전 구현한다.
9. 계정 연결 API는 MVP 이후 사용자 경험을 보면서 추가한다.

## 검토 필요 사항

- 소셜 로그인에서 같은 이메일 계정을 자동 연결할지 여부
- refresh token을 기기별로 여러 개 유지할지 여부
- 관리자 API를 별도 경로(`/api/v1/admin/**`)로 분리할지 여부
- 탈퇴 사용자의 이메일 재가입 허용 정책
- 이메일/비밀번호 로그인을 다시 도입할 시점과 인증 방식

## 참고

- Apple Developer Documentation, Verifying a user: https://developer.apple.com/documentation/signinwithapple/verifying-a-user
- Apple Developer Documentation, Fetch Apple public keys: https://developer.apple.com/documentation/signinwithapplerestapi/fetch_apple_s_public_key_for_verifying_token_signature
