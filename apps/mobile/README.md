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
    index.tsx                        - 레시피 목록 홈 라우트
    recipes/                         - 레시피 관련 라우트
      [id].tsx                       - 레시피 상세 라우트
      new.tsx                        - 레시피 작성 라우트
  src/                               - 실제 화면 구현, 공통 컴포넌트, 기능별 코드
    components/                      - 여러 기능에서 재사용하는 공통 UI
      AppButton.tsx                  - 공통 버튼 컴포넌트
      Screen.tsx                     - 공통 화면 래퍼 컴포넌트
    features/                        - 기능 단위 코드
      recipes/                       - 레시피 기능 모듈
        components/                  - 레시피 기능 전용 UI 컴포넌트
          RecipeCard.tsx             - 레시피 목록 카드
          VisibilityBadge.tsx        - 공개/비공개 배지
        data/                        - 백엔드 연동 전 mock 데이터
          mockRecipes.ts             - 레시피 mock 데이터
        screens/                     - 레시피 화면 컴포넌트
          RecipeCreateScreen.tsx     - 레시피 작성 화면
          RecipeDetailScreen.tsx     - 레시피 상세 화면
          RecipeListScreen.tsx       - 레시피 목록 화면
        types/                       - 레시피 도메인 타입
          recipe.ts                  - Recipe, RecipeDraft 타입
    theme/                           - 라이트/다크 모드 테마
      useAppTheme.ts                 - 앱 테마 hook
  AGENTS.md                          - 모바일 앱 작업 규칙
  app.json                           - Expo 앱 설정
  package.json                       - npm 스크립트와 의존성
  tsconfig.json                      - TypeScript 설정
```

## 현재 화면

- 레시피 목록
- 레시피 상세
- 레시피 작성
- 라이트/다크 모드 기본 대응
- mock 데이터 기반 화면 흐름

## 구조 원칙

- `app/`은 라우팅 파일만 둡니다.
- 화면 구현은 `src/features/*/screens`에 둡니다.
- 공통 UI는 `src/components`에 둡니다.
- 색상 등 테마 처리는 `src/theme`에 둡니다.
- 현재 UI는 구조 검증용이며, 추후 디자인 전면 교체 예정입니다.
