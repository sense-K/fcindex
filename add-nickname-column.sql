-- posts, post_comments에 nickname 컬럼 추가
ALTER TABLE posts         ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS nickname text;

-- 기존 데이터 백필: profiles에서 닉네임 복사
UPDATE posts
SET nickname = (SELECT nickname FROM profiles WHERE profiles.id = posts.author_id)
WHERE nickname IS NULL;

UPDATE post_comments
SET nickname = (SELECT nickname FROM profiles WHERE profiles.id = post_comments.author_id)
WHERE nickname IS NULL;

-- profiles 닉네임 유니크 제약
ALTER TABLE profiles ADD CONSTRAINT profiles_nickname_unique UNIQUE (nickname);

-- 확인
SELECT nickname, count(*) FROM posts GROUP BY nickname ORDER BY count(*) DESC LIMIT 10;
