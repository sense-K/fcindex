-- ============================================================
-- 지역 기능 추가 스크립트
-- Supabase > SQL Editor 에서 실행하세요
-- ============================================================

-- 1. 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS region text;

-- 2. 더미 프로필에 랜덤 지역 배정
UPDATE profiles
SET region = (ARRAY[
  '서울 동부','서울 서부','서울 남부','서울 북부','서울 중부',
  '경기 북부','경기 남부','경기 동부','경기 서부','인천',
  '충청 북부','충청 남부','대전·세종',
  '전라 북부','전라 남부','광주',
  '경상 북부','경상 남부','부산','대구','울산',
  '강원','제주'
])[1 + floor(random() * 23)::int]
WHERE is_dummy = true;

-- 3. 더미 게시글에 작성자 지역 복사
UPDATE posts
SET region = (
  SELECT region FROM profiles WHERE profiles.id = posts.author_id
)
WHERE is_dummy = true;

-- 완료 확인
SELECT region, count(*) FROM profiles WHERE is_dummy = true GROUP BY region ORDER BY count(*) DESC;
