-- 레시피 카테고리 테이블
-- 카테고리 목록과 썸네일(이모지 + 배경색)을 관리한다.
CREATE TABLE recipe_categories (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(30)  NOT NULL UNIQUE,
    emoji      VARCHAR(10)  NOT NULL,
    color      VARCHAR(7)   NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 카테고리별 키워드 매칭 테이블
-- 레시피 제목에 키워드가 포함되면 해당 카테고리로 자동 분류한다.
CREATE TABLE recipe_category_keywords (
    id          BIGSERIAL   PRIMARY KEY,
    category_id BIGINT      NOT NULL REFERENCES recipe_categories(id) ON DELETE CASCADE,
    keyword     VARCHAR(50) NOT NULL
);

CREATE INDEX idx_category_keywords_category_id ON recipe_category_keywords(category_id);

-- recipes 테이블에 카테고리 FK 추가 (nullable)
ALTER TABLE recipes ADD COLUMN category_id BIGINT REFERENCES recipe_categories(id);

-- 초기 카테고리 시드 데이터
INSERT INTO recipe_categories (name, emoji, color, sort_order) VALUES
    ('밥',      '🍚', '#FF8C42', 1),
    ('면',      '🍜', '#E85D75', 2),
    ('파스타',  '🍝', '#D4A843', 3),
    ('국/찌개', '🍲', '#C75B39', 4),
    ('반찬',    '🥗', '#6BAE75', 5),
    ('디저트',  '🍰', '#E091B8', 6),
    ('음료',    '🥤', '#5DA4D9', 7),
    ('빵',      '🍞', '#D4955A', 8),
    ('샐러드',  '🥬', '#7BC67E', 9),
    ('기타',    '🍽️', '#9E9E9E', 10);

-- 카테고리별 키워드 시드 데이터
-- 밥
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT id, keyword FROM recipe_categories, UNNEST(ARRAY[
    '밥', '볶음밥', '덮밥', '비빔밥', '주먹밥', '리조또', '카레', '오므라이스',
    '김밥', '초밥', '규동', '필라프', '잡채밥', '영양밥'
]) AS keyword WHERE name = '밥';

-- 면
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT id, keyword FROM recipe_categories, UNNEST(ARRAY[
    '면', '라면', '국수', '냉면', '우동', '소바', '쌀국수', '짜장면', '짬뽕',
    '잔치국수', '칼국수', '비빔면', '막국수', '라멘', '쫄면', '밀면'
]) AS keyword WHERE name = '면';

-- 파스타
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT id, keyword FROM recipe_categories, UNNEST(ARRAY[
    '파스타', '스파게티', '펜네', '뇨끼', '라자냐', '카르보나라',
    '알리오올리오', '봉골레', '아라비아따'
]) AS keyword WHERE name = '파스타';

-- 국/찌개
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT id, keyword FROM recipe_categories, UNNEST(ARRAY[
    '국', '찌개', '탕', '전골', '스프', '수프', '된장국', '미역국',
    '김치찌개', '된장찌개', '순두부찌개', '부대찌개', '감자탕', '갈비탕',
    '설렁탕', '삼계탕', '곰탕', '육개장', '해장국', '떡국', '만두국'
]) AS keyword WHERE name = '국/찌개';

-- 반찬
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT id, keyword FROM recipe_categories, UNNEST(ARRAY[
    '볶음', '조림', '무침', '나물', '전', '구이', '튀김', '장아찌',
    '김치', '깍두기', '젓갈', '쌈', '갈비', '불고기', '제육', '닭갈비',
    '탕수육', '깐풍기', '양념치킨', '치킨', '돈까스', '스테이크'
]) AS keyword WHERE name = '반찬';

-- 디저트
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT id, keyword FROM recipe_categories, UNNEST(ARRAY[
    '케이크', '쿠키', '마카롱', '푸딩', '떡', '빙수', '아이스크림',
    '타르트', '파이', '브라우니', '초콜릿', '젤리', '양갱', '호떡',
    '와플', '팬케이크', '크레이프', '도넛', '약과', '경단'
]) AS keyword WHERE name = '디저트';

-- 음료
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT id, keyword FROM recipe_categories, UNNEST(ARRAY[
    '주스', '스무디', '라떼', '차', '에이드', '커피', '음료',
    '밀크셰이크', '식혜', '수정과', '매실차', '레모네이드'
]) AS keyword WHERE name = '음료';

-- 빵
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT id, keyword FROM recipe_categories, UNNEST(ARRAY[
    '빵', '토스트', '샌드위치', '베이글', '크루아상', '식빵',
    '바게트', '머핀', '스콘', '브레드', '햄버거', '버거'
]) AS keyword WHERE name = '빵';

-- 샐러드
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT id, keyword FROM recipe_categories, UNNEST(ARRAY[
    '샐러드', '샐럿', '포케', '보울'
]) AS keyword WHERE name = '샐러드';
