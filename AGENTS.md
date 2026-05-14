# AGENTS.md

## 적용 범위

이 문서는 프로젝트 루트 전체에 적용한다.

하위 디렉터리에 별도 `AGENTS.md`가 있으면 더 가까운 문서의 규칙을 우선한다. 모바일 앱 작업은 `apps/mobile/AGENTS.md`를 함께 따른다.

## 프로젝트 개요

이 프로젝트는 iOS 앱 출시를 목표로 하는 레시피 앱이다.

주요 기능 방향은 다음과 같다.

- 사용자가 직접 레시피를 등록하고 관리한다.
- 레시피는 공개/비공개로 설정할 수 있다.
- 레시피에는 글, 이미지, 동영상 첨부를 고려한다.
- 추후 유튜브 요리 영상 기반 식재료/조리법 추출 기능을 추가한다.
- 조리 중 화면 꺼짐 방지와 음성 안내 기능을 검토한다.

## 기술 스택 방향

- Mobile: React Native, Expo, TypeScript
- Backend: Spring Boot, Kotlin, Swagger
- Database: PostgreSQL
- Storage: AWS S3
- AI: 추후 결정
- Infrastructure: AWS EC2, Docker, Docker Compose, Nginx, Let's Encrypt
- CI/CD: GitHub Actions

## 디렉터리 역할

```text
recipe-app/          - 프로젝트 루트
  apps/              - 클라이언트 앱 모음
    mobile/          - React Native + Expo 모바일 앱
  backend/           - Spring Boot + Kotlin 백엔드 API 서버
  docs/              - 기획, 기술 선택 이유, API/DB/정책 문서
  infra/             - Docker, 배포, 인프라 설정
  TODO.md            - 작업 현황 체크리스트
  README.md          - 프로젝트 개요
```

## 작업 규칙

- 작업을 완료하거나 범위가 바뀌면 `TODO.md`를 함께 갱신한다.
- 새 구조나 중요한 의사결정이 생기면 관련 README 또는 `docs/` 문서를 함께 갱신한다.
- 실제 구현 없이 문서만 있는 항목은 완료로 체크하지 않는다.
- MVP에서는 레시피 목록, 상세, 작성, 공개/비공개 흐름을 우선한다.
- 회원가입, AI 추출, 동영상 업로드, FCM, 배포 자동화는 후순위로 둔다.
- 비밀키, 토큰, 실제 운영 환경 변수는 커밋하지 않는다.
- `.env.example`처럼 예시 파일만 커밋한다.

## 문서 규칙

- 프로젝트 결정 이유는 `docs/` 아래에 남긴다.
- 기능별 정책은 구현 전에 짧게라도 문서화한다.
- 문서는 한국어로 작성한다.
- 불확실한 결정은 확정처럼 쓰지 말고 검토 상태로 표시한다.

## Git 규칙

- 커밋 규칙은 `COMMIT.md`를 따른다.
- 사용자가 만든 변경사항은 명시 요청 없이 되돌리지 않는다.
