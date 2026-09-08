-- 카테고리 썸네일을 이모지+색상에서 이미지 URL 방식으로 전환한다.
-- thumbnail_url이 NULL이면 모바일에서 썸네일을 표시하지 않는다.

ALTER TABLE recipe_categories DROP COLUMN emoji;
ALTER TABLE recipe_categories DROP COLUMN color;
ALTER TABLE recipe_categories ADD COLUMN thumbnail_url VARCHAR(500);

-- 현재 이미지가 준비된 카테고리만 thumbnail_url을 설정한다.
-- 값은 모바일 앱에서 로컬 에셋 매핑 키로 사용한다.
UPDATE recipe_categories SET thumbnail_url = 'rice' WHERE name = '밥';
UPDATE recipe_categories SET thumbnail_url = 'bread' WHERE name = '디저트';
