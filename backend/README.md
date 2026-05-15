# Backend

Spring Boot + Kotlin 기반 백엔드 API 서버입니다.

레시피, 사용자, 파일 업로드, 좋아요/조회수 등의 서버 기능을 담당합니다.

## 로컬 DB

PostgreSQL은 `infra/docker-compose.yml`로 실행합니다.

```bash
docker compose -f ../infra/docker-compose.yml up -d postgres
```

테이블은 Docker 빌드 시 생성되지 않습니다. 백엔드 애플리케이션 시작 시 Flyway가 `src/main/resources/db/migration` 아래 SQL 파일을 실행해 생성합니다.

로컬 설정은 `src/main/resources/application-local.example.yml`을 참고해 `application-local.yml`로 복사해서 사용합니다. `application-local.yml`은 커밋하지 않습니다.
