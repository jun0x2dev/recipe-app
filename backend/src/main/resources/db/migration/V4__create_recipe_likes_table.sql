-- 레시피 좋아요 테이블
-- - 사용자별 레시피 좋아요 상태를 저장한다.
-- - UNIQUE 제약으로 동일 사용자가 같은 레시피에 중복 좋아요를 방지한다.
CREATE TABLE recipe_likes (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id),
    recipe_id   BIGINT       NOT NULL REFERENCES recipes (id),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_recipe_likes_user_recipe UNIQUE (user_id, recipe_id)
);

CREATE INDEX idx_recipe_likes_recipe_id ON recipe_likes (recipe_id);
