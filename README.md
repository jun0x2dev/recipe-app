# recipe-app

iOS 앱 출시를 목표로 하는 레시피 앱 사이드 프로젝트입니다.

사용자는 레시피를 직접 등록하고 관리할 수 있으며, 공개/비공개 설정을 통해 다른 사용자와 레시피를 공유할 수 있습니다. 이후에는 유튜브 요리 영상 등을 기반으로 식재료와 조리법을 추출하는 기능을 추가할 예정입니다.

## 주요 기능 예정

- 레시피 직접 등록
- 레시피 공개/비공개 설정
- 레시피 조회수, 좋아요, 공유 기능
- 글, 이미지, 동영상 첨부
- 영상 기반 식재료 및 조리법 추출
- 조리 중 화면 꺼짐 방지
- 음성으로 다음 조리 단계 안내

## 기술 스택 예정

- Mobile: React Native, Expo, TypeScript
- Backend: Spring Boot, Kotlin
- Database: PostgreSQL
- Storage: AWS S3
- AI: 추후 결정
- Infrastructure: 추후 구성

## 프로젝트 구조

```text
recipe-app/
  apps/
    mobile/
  backend/
  docs/
  infra/
```

## 개발 순서

1. 로컬 환경에서 모바일 앱 개발
2. 로컬 환경에서 백엔드 API 개발
3. 데이터베이스 및 파일 업로드 기능 추가
4. AI 기반 레시피 추출 기능 추가
5. 인프라 및 배포 환경 구성

