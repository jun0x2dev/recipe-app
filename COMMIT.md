# Commit & PR Convention

## 커밋 규칙

### 형식(커밋 메시지 예시)
```
type(scope): 검색 필터 기능 추가

- 설명
- 설명
```

### Type 종류

| type | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 추가 | `feat(search): 검색 필터 기능 추가` |
| `fix` | 버그 수정 | `fix(auth): 로그인 토큰 만료 오류 수정` |
| `refactor` | 코드 리팩토링 | `refactor(map): 지도 컴포넌트 분리` |
| `chore` | 설정, 환경 변경 | `chore: 개발 환경 프로파일로 변경` |
| `docs` | 문서 수정 | `docs: README 업데이트` |
| `style` | 코드 스타일 변경 | `style: 들여쓰기 정리` |
| `test` | 테스트 추가/수정 | `test(search): 검색 API 단위 테스트 추가` |

### 주의사항
- `main`, `master` 브랜치에서는 커밋하지 않는다
- 반드시 feature 브랜치에서 작업 후 PR로 머지
- 커밋 메시지에 `Co-Authored-By` 라인을 추가하지 않는다
- application.yml의 spring.profiles.active 값이 dev면 해당 부분은 커밋하지 않는다. (prod 유지)
- COMMIT.md와 plugin_guide.md는 같이 커밋하지 말아야한다.

---

## PR 규칙

### 제목 형식
```
[type] 한글 설명 (50자 이내)
```

예시:
```
[feat] 검색 필터 기능 추가
[fix] 로그인 토큰 만료 오류 수정
```

### 본문 형식
```markdown
## Summary
- 변경 이유와 내용을 한국어로 작성
- 핵심 변경사항 위주로 bullet points

## Test
변경사항을 확인한 방법 간단히 서술 (선택사항)
```

### 주의사항
- PR 제목과 본문은 한국어로 작성
- 하나의 PR은 하나의 기능/수정에 집중
- base 브랜치 확인 후 PR 생성