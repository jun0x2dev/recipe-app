# Mobile 기술 선택 이유

## 결정 요약

모바일 앱은 React Native, Expo, TypeScript, Expo Router를 기준으로 개발한다.

## React Native

레시피 앱은 iOS 출시가 우선이지만, 추후 Android 확장 가능성을 열어두는 것이 좋다. React Native는 하나의 TypeScript 코드베이스로 iOS와 Android를 모두 지원할 수 있어 사이드 프로젝트의 개발 속도와 유지보수 부담 사이의 균형이 좋다.

## Expo

초기 MVP에서는 네이티브 설정보다 화면, 레시피 작성 흐름, 파일 첨부 정책, API 연동 검증이 더 중요하다. Expo는 개발 서버, Expo Go, 웹 미리보기, 빌드 설정을 빠르게 시작할 수 있게 해주므로 초기 생산성이 높다.

Expo를 사용하더라도 반드시 Expo 배포 서비스에만 묶이는 것은 아니다. 필요하면 `prebuild`를 통해 native 프로젝트를 생성하고 Xcode 또는 다른 배포 흐름으로 전환할 수 있다.

## TypeScript

레시피, 재료, 조리 단계, 공개 여부, 업로드 파일 같은 도메인 데이터는 구조가 명확해야 한다. TypeScript를 사용하면 화면과 API 연동 사이의 데이터 계약을 코드 레벨에서 관리할 수 있어 기능이 늘어날 때 실수를 줄일 수 있다.

## Expo Router

Expo Router는 Expo 프로젝트에서 화면 구조를 파일 기반으로 관리할 수 있게 해준다. 레시피 목록, 상세, 작성 화면처럼 URL/화면 경계가 명확한 앱 구조와 잘 맞는다.

예상 구조는 다음과 같다.

```text
app/
  _layout.tsx
  index.tsx
  recipes/
    [id].tsx
    new.tsx

src/
  components/
  features/
    recipes/
  theme/
  lib/
```

`app/`에는 라우팅 파일만 얇게 두고, 실제 UI와 비즈니스 로직은 `src/` 아래에 둔다. 이렇게 하면 나중에 React Navigation으로 직접 전환하거나 네이티브 빌드 전략을 바꾸더라도 변경 범위를 줄일 수 있다.

## 다크/라이트 모드

앱은 항상 라이트 모드와 다크 모드를 모두 지원해야 한다. Expo 설정의 `userInterfaceStyle`은 `automatic`으로 유지하고, 화면 컴포넌트는 시스템 컬러 스킴에 따라 테마 값을 사용한다.

## 현재 제외한 선택

초기 단계에서는 상태 관리 라이브러리, 서버 상태 라이브러리, UI 컴포넌트 프레임워크를 바로 도입하지 않는다. 화면 수와 API 연동 범위가 작을 때는 React 기본 상태와 기능별 모듈 구조만으로 충분하다.

필요성이 생기면 다음 단계에서 도입을 검토한다.

- 서버 상태 관리: TanStack Query
- 전역 클라이언트 상태: Zustand
- 폼 관리: React Hook Form
- 런타임 검증: Zod
