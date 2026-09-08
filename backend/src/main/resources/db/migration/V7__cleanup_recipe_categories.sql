-- 사용하지 않는 카테고리(파스타, 반찬, 빵)를 삭제한다.
-- 해당 카테고리에 연결된 레시피는 '기타' 카테고리로 재할당한다.
-- 해당 카테고리의 키워드도 함께 삭제한다. (CASCADE로 자동 삭제됨)

-- 1. 파스타/반찬/빵 카테고리에 연결된 레시피를 '기타'로 재할당
UPDATE recipes SET category_id = (SELECT id FROM recipe_categories WHERE name = '기타')
WHERE category_id IN (SELECT id FROM recipe_categories WHERE name IN ('파스타', '반찬', '빵'));

-- 2. 카테고리 삭제 (키워드는 ON DELETE CASCADE로 자동 삭제)
DELETE FROM recipe_categories WHERE name IN ('파스타', '반찬', '빵');

-- 3. 디저트 카테고리에 bread 썸네일 설정 (V6에서 빵으로 설정한 것을 보정)
UPDATE recipe_categories SET thumbnail_url = 'bread' WHERE name = '디저트';

-- 4. 기존 빵 카테고리의 키워드 중 유용한 것을 디저트로 이관
-- (빵 카테고리가 이미 삭제되었으므로, 디저트에 빵 관련 키워드를 추가)
INSERT INTO recipe_category_keywords (category_id, keyword)
SELECT c.id, kw
FROM recipe_categories c,
     UNNEST(ARRAY['빵', '토스트', '샌드위치', '베이글', '크루아상', '식빵',
                   '바게트', '머핀', '스콘', '브레드', '햄버거', '버거']) AS kw
WHERE c.name = '디저트'
  AND NOT EXISTS (
    SELECT 1 FROM recipe_category_keywords ck
    WHERE ck.category_id = c.id AND ck.keyword = kw
  );
