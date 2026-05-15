# TODO

## 초기 세팅

- [x] Git 저장소 초기화
- [x] `.gitignore` 추가
- [x] 모바일 앱 프로젝트 생성
- [x] 백엔드 프로젝트 생성
- [x] 로컬 개발용 환경 변수 파일 구성 (application-local.yml)
- [x] 기본 개발 문서 정리
- [x] application-local.yml .gitignore 처리 및 example 파일 추가
- [x] 코드 주석 작성 규칙 추가 및 기존 코드 주석 정리

## 모바일 앱

- [x] React Native + Expo + TypeScript 프로젝트 생성
- [x] Expo Router 기반 라우팅 구조 추가
- [x] 기본 화면 구조 설계
- [x] 레시피 목록 화면 추가
- [x] 레시피 상세 화면 추가
- [x] 레시피 작성 화면 추가
- [x] 라이트/다크 모드 기본 테마 적용
- [x] 모바일 앱 작업 규칙 문서 추가
- [x] 모바일 기술 선택 이유 문서 추가
- [ ] 로딩(스플래시) 화면 구현
- [x] 로그인 화면 구현
- [ ] Apple 로그인 버튼/흐름 구현
- [x] 네이버 로그인 버튼/흐름 구현
- [x] 브라우저 개발 확인용 로그인 우회 버튼 추가
- [ ] 네이버 로그인 SDK 설치 및 개발 빌드 검증
- [x] 구글 로그인 버튼/흐름 검토
- [x] 구글 로그인 버튼/브라우저 흐름 구현
- [ ] 구글 iOS Client ID 추가 및 개발 빌드 검증
- [ ] 앱 내 계정 삭제 화면 구현
- [ ] 자체 회원가입 화면 후순위 전환
- [ ] 모바일 UI 디자인 전면 교체
- [ ] 이미지 첨부 기능 검토
- [ ] 동영상 첨부 기능 검토
- [ ] 화면 꺼짐 방지 기능 검토
- [ ] 음성 안내 기능 검토

## 백엔드

- [x] Spring Boot + Kotlin 프로젝트 생성 (Gradle Kotlin DSL)
- [x] PostgreSQL 로컬 연결 설정 (application-local.yml, 포트 5433)
- [x] JWT 인증 구조 구현 (JwtProvider, JwtAuthenticationFilter, SecurityConfig)
- [x] 회원가입 API 구현 (POST /api/v1/auth/signup)
- [x] 로그인 API 구현 (POST /api/v1/auth/login)
- [x] 전역 예외 처리 구조 구현 (GlobalExceptionHandler, ErrorCode)
- [x] 인증/권한 설계 문서 작성
- [x] 인증/권한 DB 설계 문서 작성
- [x] Flyway 기반 인증/권한 초기 마이그레이션 추가
- [x] 인증/권한 DB 설계 반영
- [x] 관리자/사용자 권한 분리 구현
- [x] JWT role 클레임 및 권한 매핑 구현
- [x] Refresh Token 저장/폐기 구조 구현
- [x] Apple 로그인 API 설계
- [x] 네이버 로그인 API 설계
- [x] 네이버 로그인 API 구현
- [x] 구글 로그인 API 설계
- [x] 구글 로그인 API 구현
- [x] 구글 로그인 DB 저장 흐름 검증
- [ ] 소셜 계정 연결 정책 구현
- [ ] 앱 내 계정 삭제 API 구현
- [x] Gradle Wrapper 생성
- [x] Java 17 환경에서 백엔드 테스트 실행
- [x] 인증/권한 핵심 테스트 작성
- [ ] Swagger / SpringDoc 설정
- [ ] 레시피 API 설계
- [ ] 레시피 생성 API 구현
- [ ] 레시피 조회 API 구현
- [ ] 레시피 수정 API 구현
- [ ] 레시피 삭제 API 구현
- [ ] 공개/비공개 설정 구현
- [ ] 조회수, 좋아요, 공유 기능 설계
- [ ] Apple 로그인 API 구현 (후순위 - Apple Developer Program 가입하고 구현하기)
- [ ] 자체 이메일/비밀번호 회원가입 API (후순위)

## 파일 업로드

- [ ] 이미지 업로드 방식 설계
- [ ] 동영상 업로드 용량 제한 정책 정리
- [ ] Presigned URL 기반 업로드 방식 검토
- [ ] 로컬 개발용 파일 저장 방식 결정

## AI 기능

- [ ] 유튜브 영상 입력 방식 검토
- [ ] 영상 길이 제한 정책 정리
- [ ] 자막 기반 레시피 추출 가능성 검토
- [ ] 음성 추출 및 STT 방식 검토
- [ ] 사용할 AI API 후보 비교 (초기에는 API 사용하다 추후에 자체 모델로 개발할 수도)
- [ ] 레시피 추출 결과 포맷 설계

## 인프라 및 배포

- [ ] Docker 구성 검토 (백엔드 컨테이너화)
- [x] Docker Compose 구성 검토 (PostgreSQL, 호스트 포트 5433)
- [ ] AWS EC2 배포 구조 설계
- [ ] AWS RDS 사용 여부 결정
- [ ] AWS S3 버킷 정책 설계
- [ ] Nginx 및 HTTPS 구성 검토
- [ ] GitHub Actions CI/CD 구성 검토
- [ ] FCM 푸시 알림 도입 시점 검토
