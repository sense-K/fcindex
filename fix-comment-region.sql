-- post_comments에 region 컬럼 추가
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS region text;

-- 기존 댓글에 작성자 지역 복사
UPDATE post_comments
SET region = (SELECT region FROM profiles WHERE profiles.id = post_comments.author_id)
WHERE region IS NULL;

-- 확인
SELECT region, count(*) FROM post_comments GROUP BY region ORDER BY count(*) DESC;
