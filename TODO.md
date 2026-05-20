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
- [x] 레시피 작성 화면 재료/단계 행 추가 입력 UI 적용
- [x] 레시피 작성 화면 카드형 UI 리디자인
- [x] 레시피 작성 화면 조리 시간 분 단위 표시
- [x] 레시피 작성 화면 생성 API 연결
- [x] 레시피 작성 화면 생성 API 빈 응답 파싱 오류 처리
- [x] 레시피 작성 화면 AI 초안 채우기 연결
- [x] 레시피 작성 화면 음식명 기반 AI 초안 생성 연결
- [x] 레시피 작성/조회 몇 인분 필드 연결
- [x] 모바일 AI 초안 호출을 Spring Boot 백엔드 경유 구조로 변경
- [x] 레시피 조회/수정/삭제 API 연동
- [x] 레시피 상세 화면 수정/삭제 기능 추가
- [x] 내 레시피 목록 API 연동 (검색, 페이징, 새로고침)
- [x] 둘러보기 공개 레시피 API 연동
- [x] 하단 탭 구조 추가 (내 레시피, 둘러보기, 설정)
- [x] 둘러보기 화면 추가
- [x] 설정 화면 추가
- [x] 설정 화면 라이트/다크/시스템 모드 선택 추가
- [x] 라이트/다크 모드 기본 테마 적용
- [x] 모바일 앱 작업 규칙 문서 추가
- [x] 모바일 기술 선택 이유 문서 추가
- [ ] 로딩(스플래시) 화면 구현
- [x] 로그인 화면 구현
- [ ] 소셜 로그인 버튼 브랜드 스타일 반영
- [ ] Apple 로그인 버튼/흐름 구현
- [x] 네이버 로그인 버튼/흐름 구현
- [x] 브라우저 개발 확인용 로그인 우회 버튼 추가
- [ ] 네이버 로그인 SDK 설치 및 개발 빌드 검증
- [x] 구글 로그인 버튼/흐름 검토
- [x] 구글 로그인 버튼/브라우저 흐름 구현
- [ ] 구글 iOS Client ID 추가 및 개발 빌드 검증
- [ ] 앱 내 계정 삭제 화면 구현
- [ ] 자체 회원가입 화면 후순위 전환
- [x] 모바일 UI 디자인 전면 교체
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
- [x] 레시피 생성 API 구현
- [x] 레시피 조회 API 구현
- [x] 레시피 수정 API 구현
- [x] 레시피 삭제 API 구현
- [x] 공개/비공개 설정 구현
- [x] 레시피 생성 DB 테이블 추가
- [x] 레시피 몇 인분 DB 컬럼 추가
- [x] AI 레시피 생성/추출 백엔드 프록시 API 구현 (모바일 → 백엔드 → AI Worker)
- [ ] 조회수, 좋아요, 공유 기능 설계
- [ ] Apple 로그인 API 구현 (후순위 - Apple Developer Program 가입하고 구현하기)
- [ ] 자체 이메일/비밀번호 회원가입 API (후순위)

## 파일 업로드

- [ ] 이미지 업로드 방식 설계
- [ ] 동영상 업로드 용량 제한 정책 정리
- [ ] Presigned URL 기반 업로드 방식 검토
- [ ] 로컬 개발용 파일 저장 방식 결정

## AI 기능

- [x] AI 레시피 추출 기능 개발 계획 문서 작성
- [x] Python AI Worker 기본 구조 추가
- [x] 유튜브 쇼츠 오디오 다운로드 옵션 추가
- [x] STT 기반 레시피 초안 추출 옵션 추가
- [x] AI Worker FastAPI 기본 서버 추가
- [x] AI Worker 에러 코드 및 모듈 구조 리팩터링
- [x] AI Worker Ollama 기본 모델 gemma3:12b 전환
- [x] 음식명 기반 생성 API 기본 재료 간소화 정책 추가
- [x] AI Worker Windows/macOS 설치 및 Ollama 모델 관리 가이드 작성
- [x] 유튜브 쇼츠 입력 방식 검토
- [ ] 유튜브 쇼츠 제목/설명란 메타데이터 활용 방식 검토
- [ ] 영상 길이 제한 정책 정리
- [ ] 자막 기반 레시피 추출 가능성 검토
- [ ] 음성 추출 및 STT 방식 검토
- [ ] 배경음악이 큰 영상의 보컬 분리 전처리 검토
- [ ] 프레임 OCR 기반 화면 텍스트 추출 검토
- [ ] AI 추출 작업 비동기 큐 구조 검토
- [ ] AI Worker URL/비레시피/영상 접근 실패 예외 처리 정책 검토
- [ ] AI 추출 결과 캐시 및 품질 상태 정책 설계
- [ ] 추출 결과 confidence UI 표시 방식 검토
- [ ] 표준 재료 ID 매핑 방식 검토
- [ ] 사용자 수정 diff 로그 저장 방식 검토
- [ ] 공개 레시피 전환 시 원본 출처 표시 정책 검토
- [ ] 사용할 AI API 후보 비교 (초기에는 API 사용하다 추후에 자체 모델로 개발할 수도)
- [ ] 레시피 추출 결과 포맷 설계

## 인프라 및 배포

- [x] Docker 구성 검토 (백엔드 컨테이너화)
- [x] Docker Compose 구성 검토 (PostgreSQL, 호스트 포트 5433)
- [x] Docker Compose에 backend + ai-worker 서비스 추가 (Ollama는 호스트 실행)
- [x] 백엔드 Dockerfile 추가 (멀티스테이지 빌드)
- [x] AI Worker Dockerfile 추가
- [x] application-docker.yml 추가 (Docker 전용 Spring 프로파일)
- [ ] AWS EC2 배포 구조 설계
- [ ] AWS RDS 사용 여부 결정
- [ ] AWS S3 버킷 정책 설계
- [ ] Nginx 및 HTTPS 구성 검토
- [ ] GitHub Actions CI/CD 구성 검토
- [ ] FCM 푸시 알림 도입 시점 검토


## 아이디어
- 친구랑 레시피 공유(보관함 공유)
- 레시피 url 카카오톡으로 공유 기능
- 레시피 임시 저장 기능

## 20260519
- AI 초기 설치 및 실행 가이드 재작성
- AI API 응답속도 개선해야할 거 같음
- backend 랑 ai-worker 서버를 계속 띄우기 불편한데 로컬에서 docker로 묶어서 올리기?