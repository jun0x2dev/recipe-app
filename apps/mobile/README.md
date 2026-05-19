# Recipe App Mobile

React Native + Expo + TypeScript 기반 iOS 우선 레시피 앱입니다.

화면 라우팅은 Expo Router를 사용하고, 실제 화면/도메인 코드는 `src` 아래 기능 단위로 분리합니다.

## 실행

```bash
npm install
npm run start
```

웹에서 확인할 때는 다음 명령을 사용합니다.

```bash
npm run web
```

Expo Router 의존성이 설치되어 있지 않다면 다음 명령을 먼저 실행합니다.

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants
```

## 스크립트

```bash
npm run start
npm run ios
npm run android
npm run web
npm run typecheck
```

## 프로젝트 구조

```text
apps/mobile/                         - 모바일 앱 루트
  app/                               - Expo Router 라우트 디렉터리
    _layout.tsx                      - 앱 전체 Stack 네비게이션, 헤더, StatusBar 설정
    (tabs)/                          - 로그인 후 하단 탭 라우트 그룹
      _layout.tsx                    - 내 레시피, 둘러보기, 설정 탭 구성
      index.tsx                      - 내 레시피 탭 라우트
      explore.tsx                    - 둘러보기 탭 라우트
      settings.tsx                   - 설정 탭 라우트
    login.tsx                        - 로그인 라우트
    recipes/                         - 레시피 관련 라우트
      [id].tsx                       - 레시피 상세 라우트
      new.tsx                        - 레시피 작성 라우트
  src/                               - 실제 화면 구현, 공통 컴포넌트, 기능별 코드
    components/                      - 여러 기능에서 재사용하는 공통 UI
      AppButton.tsx                  - 공통 버튼 컴포넌트
      Screen.tsx                     - 공통 화면 래퍼 컴포넌트
    features/                        - 기능 단위 코드
      auth/                          - 인증 기능 모듈
        AuthContext.tsx              - 로그인 토큰 상태 Context
        components/SocialLoginButton.tsx - 소셜 로그인 브랜드 버튼
        screens/LoginScreen.tsx      - 소셜 로그인 화면
        services/authApi.ts          - 백엔드 인증 API 호출
        services/authConfig.ts       - 인증 런타임 설정
        services/googleLogin.ts      - Google 웹 로그인 어댑터
        services/naverLogin.ts       - 네이버 로그인 SDK 어댑터
      explore/                       - 공개 레시피 둘러보기 기능 모듈
        screens/ExploreRecipeScreen.tsx - 다른 사용자 공개 레시피 화면
      recipes/                       - 레시피 기능 모듈
        components/                  - 레시피 기능 전용 UI 컴포넌트
          RecipeCard.tsx             - 레시피 목록 카드
          VisibilityBadge.tsx        - 공개/비공개 배지
        data/                        - 백엔드 연동 전 mock 데이터
          mockRecipes.ts             - 레시피 mock 데이터
        services/                    - 레시피 백엔드 API 호출
          aiRecipeApi.ts             - AI Worker 유튜브 추출/음식명 생성 API 클라이언트
          recipeApi.ts               - 레시피 생성 API 클라이언트
        screens/                     - 레시피 화면 컴포넌트
          RecipeCreateScreen.tsx     - 레시피 작성 화면
          RecipeDetailScreen.tsx     - 레시피 상세 화면
          RecipeListScreen.tsx       - 레시피 목록 화면
        types/                       - 레시피 도메인 타입
          recipe.ts                  - Recipe, RecipeDraft 타입
      settings/                      - 설정 기능 모듈
        screens/SettingsScreen.tsx   - 계정, 화면 모드, 앱 정보 설정 화면
    theme/                           - 라이트/다크 모드 테마
      useAppTheme.tsx                - 앱 테마 Provider와 hook
  AGENTS.md                          - 모바일 앱 작업 규칙
  app.json                           - Expo 앱 설정
  package.json                       - npm 스크립트와 의존성
  tsconfig.json                      - TypeScript 설정
```

## 현재 화면

- 로그인
- 하단 탭
- 레시피 목록
- 공개 레시피 둘러보기
- 설정
- 레시피 상세
- 레시피 작성, 몇 인분/재료/단계 행 추가 입력, 음식명/유튜브 링크 기반 AI 초안 채우기, 생성 API 호출
- 라이트/다크/시스템 화면 모드 선택
- mock 데이터 기반 화면 흐름

## 네이버 로그인 개발 설정

네이버 로그인 화면과 백엔드 토큰 교환 흐름은 구현되어 있습니다.

실제 네이버 SDK 로그인을 실행하려면 Expo Go가 아니라 개발 빌드가 필요합니다.

```bash
npx expo install @react-native-seoul/naver-login
```

패키지가 설치되면 `app.config.js`가 네이버 로그인 config plugin을 자동 등록합니다.
SDK가 설치되지 않은 브라우저 확인 환경에서는 plugin 등록을 건너뛰어 `npm run start`가 실패하지 않게 합니다.

네이버 Client Secret은 저장소에 커밋하지 말고 로컬 환경 변수로 주입합니다.

```bash
EXPO_PUBLIC_NAVER_CLIENT_SECRET=네이버_클라이언트_시크릿
EXPO_PUBLIC_API_BASE_URL=http://localhost:8089
```

실기기에서 로컬 백엔드에 접근할 때는 `EXPO_PUBLIC_API_BASE_URL`을 PC의 LAN IP로 지정합니다.

## Google 로그인 개발 설정

브라우저에서는 Web Client ID 기반 Google OAuth 흐름을 먼저 확인합니다.

Google Console의 승인된 리디렉션 URI에 아래 값을 추가합니다.

```text
http://localhost:8081/login
http://localhost:19006/login
```

로컬 환경 변수에는 Web Client ID만 넣습니다.

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=구글_WEB_CLIENT_ID
```

Google Client Secret은 모바일 앱에 넣지 않습니다.

## 구조 원칙

- `app/`은 라우팅 파일만 둡니다.
- 화면 구현은 `src/features/*/screens`에 둡니다.
- 공통 UI는 `src/components`에 둡니다.
- 색상 등 테마 처리는 `src/theme`에 둡니다.
- 현재 UI는 구조 검증용이며, 추후 디자인 전면 교체 예정입니다.
