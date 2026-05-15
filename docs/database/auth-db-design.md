# 인증/권한 DB 설계

## 목적

이 문서는 Apple 로그인, 네이버 로그인, 구글 로그인, 관리자/사용자 권한 분리를 지원하기 위한 데이터베이스 설계안이다.

핵심 방향은 사용자 기본 정보와 로그인 수단을 분리하는 것이다. 이렇게 하면 한 사용자가 여러 소셜 계정을 함께 사용할 수 있고, 추후 이메일/비밀번호 로그인 같은 인증 방식을 추가해도 사용자 테이블을 크게 바꾸지 않아도 된다.

MVP에서는 자체 이메일/비밀번호 회원가입을 제외하고 Apple 로그인을 1순위로 둔다. 네이버 로그인은 한국 사용자 편의를 위해 우선 검토하고, 구글 로그인은 선택 기능으로 둔다.

## ERD 개요

```text
users
  1 ── N user_auth_providers
  1 ── N refresh_tokens
```

## users

앱 내부 사용자 계정의 기준 테이블이다.

| 컬럼 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | Y | 내부 사용자 ID |
| `email` | `VARCHAR(255)` | N | 대표 이메일. Apple 비공개 이메일 또는 제공자 이메일 저장 가능 |
| `password` | `VARCHAR(255)` | N | 이메일 로그인용 BCrypt 해시. MVP에서는 사용하지 않음 |
| `nickname` | `VARCHAR(50)` | Y | 앱 내 표시 이름 |
| `profile_image_url` | `TEXT` | N | 프로필 이미지 URL |
| `role` | `VARCHAR(20)` | Y | `USER`, `ADMIN` |
| `status` | `VARCHAR(20)` | Y | `ACTIVE`, `SUSPENDED`, `DELETED` |
| `created_at` | `TIMESTAMP` | Y | 생성일 |
| `updated_at` | `TIMESTAMP` | Y | 수정일 |
| `deleted_at` | `TIMESTAMP` | N | 탈퇴/삭제 처리일 |

### 제약 조건

- `users.email`은 값이 있을 때 unique로 둔다.
- `role` 기본값은 `USER`로 둔다.
- `status` 기본값은 `ACTIVE`로 둔다.
- `password`는 null을 허용한다.

### 비고

소셜 제공자가 이메일을 내려주지 않거나 사용자가 이메일 제공을 제한할 수 있으므로 `email`은 nullable로 둔다. 사용자 식별은 이메일이 아니라 내부 `users.id`와 `(provider, provider_user_id)` 조합을 기준으로 한다.

## user_auth_providers

사용자에게 연결된 로그인 수단을 저장한다.

| 컬럼 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | Y | 로그인 수단 ID |
| `user_id` | `BIGINT` | Y | `users.id` |
| `provider` | `VARCHAR(20)` | Y | `APPLE`, `NAVER`, `GOOGLE`, 추후 `EMAIL` |
| `provider_user_id` | `VARCHAR(255)` | Y | 제공자 내부 사용자 식별값 |
| `provider_email` | `VARCHAR(255)` | N | 제공자에서 받은 이메일 |
| `email_verified` | `BOOLEAN` | Y | 제공자 이메일 검증 여부 |
| `created_at` | `TIMESTAMP` | Y | 연결 생성일 |
| `updated_at` | `TIMESTAMP` | Y | 연결 수정일 |

### 제약 조건

- `(provider, provider_user_id)` unique
- `(user_id, provider)` unique
- `user_id`는 `users.id`를 참조한다.

### provider_user_id 정책

- `APPLE`: Apple의 고유 사용자 식별값을 사용한다.
- `NAVER`: 네이버의 고유 사용자 식별값을 사용한다.
- `GOOGLE`: 구글의 고유 사용자 식별값을 사용한다.
- `EMAIL`: 자체 이메일 로그인을 추후 도입할 때 내부 사용자 이메일 또는 `users.id` 기반 문자열을 사용한다.

이 값은 사용자가 이메일을 바꿔도 변하지 않는 제공자 고유 ID여야 한다. 소셜 로그인 매칭 기준으로 이메일만 사용하면 안 된다.

## refresh_tokens

앱 자체 refresh token을 관리한다.

| 컬럼 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | Y | refresh token ID |
| `user_id` | `BIGINT` | Y | `users.id` |
| `token_hash` | `VARCHAR(255)` | Y | refresh token 해시 |
| `device_id` | `VARCHAR(100)` | N | 기기 식별값 |
| `expires_at` | `TIMESTAMP` | Y | 만료일 |
| `revoked_at` | `TIMESTAMP` | N | 폐기일 |
| `created_at` | `TIMESTAMP` | Y | 생성일 |

### 제약 조건

- `token_hash` unique
- `user_id`는 `users.id`를 참조한다.
- 로그아웃, 비밀번호 변경, 계정 정지, 탈퇴 시 관련 토큰을 폐기한다.

## 권장 DDL 초안

```sql
create table users (
    id bigserial primary key,
    email varchar(255),
    password varchar(255),
    nickname varchar(50) not null,
    profile_image_url text,
    role varchar(20) not null default 'USER',
    status varchar(20) not null default 'ACTIVE',
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    deleted_at timestamp
);

create unique index uk_users_email_not_null on users(email) where email is not null;

create table user_auth_providers (
    id bigserial primary key,
    user_id bigint not null references users(id),
    provider varchar(20) not null,
    provider_user_id varchar(255) not null,
    provider_email varchar(255),
    email_verified boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now(),
    constraint uk_auth_provider_user unique (provider, provider_user_id),
    constraint uk_user_provider unique (user_id, provider)
);

create table refresh_tokens (
    id bigserial primary key,
    user_id bigint not null references users(id),
    token_hash varchar(255) not null unique,
    device_id varchar(100),
    expires_at timestamp not null,
    revoked_at timestamp,
    created_at timestamp not null default now()
);
```

## JPA 엔티티 반영 방향

### User

- `role: UserRole`
- `status: UserStatus`
- `password: String?`
- `profileImageUrl: String?`
- `deletedAt: LocalDateTime?`
- `authProviders: MutableList<UserAuthProvider>`는 필요 시 양방향으로 둔다.

### UserAuthProvider

- `user: User`
- `provider: AuthProvider`
- `providerUserId: String`
- `providerEmail: String?`
- `emailVerified: Boolean`

### RefreshToken

- `user: User`
- `tokenHash: String`
- `deviceId: String?`
- `expiresAt: LocalDateTime`
- `revokedAt: LocalDateTime?`

## 마이그레이션 정책

DB 구조 변경은 Flyway SQL 마이그레이션으로 관리한다.

- 모든 테이블 변경은 `backend/src/main/resources/db/migration` 아래 SQL 파일로 남긴다.
- 로컬 개발 DB도 앱 시작 시 Flyway가 마이그레이션을 실행한다.
- JPA Hibernate `ddl-auto`는 로컬에서 `validate`로 두어 엔티티와 DB 스키마 차이를 확인한다.
- 테스트 환경은 H2와 JPA `create-drop`을 우선 사용하고 Flyway는 비활성화한다.

## 인덱스

권장 인덱스는 다음과 같다.

```sql
create index idx_users_role on users(role);
create index idx_users_status on users(status);
create index idx_auth_providers_user_id on user_auth_providers(user_id);
create index idx_refresh_tokens_user_id on refresh_tokens(user_id);
create index idx_refresh_tokens_expires_at on refresh_tokens(expires_at);
```

## 보안 메모

- 소셜 제공자 access token과 refresh token은 기본적으로 저장하지 않는다.
- 앱 refresh token은 원문 저장하지 않고 해시 저장한다.
- 관리자 권한 변경 이력은 추후 별도 감사 로그 테이블로 분리한다.
- 탈퇴 사용자의 개인정보 보관/삭제 정책은 별도 문서에서 확정한다.
