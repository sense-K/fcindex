-- ============================================================
-- 프차인덱스 더미 데이터 삭제 스크립트
-- "더미 데이터 지워줘" 요청 시 이 파일을 실행하세요
-- Supabase > SQL Editor 에서 실행하세요
-- ============================================================

-- 1. 댓글 먼저 삭제 (FK 참조 순서)
DELETE FROM post_comments
WHERE is_dummy = true;

-- 2. 게시글 삭제
DELETE FROM posts
WHERE is_dummy = true;

-- 3. profiles 삭제
DELETE FROM profiles
WHERE is_dummy = true;

-- 4. auth 유저 삭제
DELETE FROM auth.users
WHERE raw_user_meta_data->>'is_dummy' = 'true';

-- 완료 확인
SELECT
  (SELECT count(*) FROM post_comments WHERE is_dummy = true) AS remaining_comments,
  (SELECT count(*) FROM posts         WHERE is_dummy = true) AS remaining_posts,
  (SELECT count(*) FROM profiles      WHERE is_dummy = true) AS remaining_profiles,
  (SELECT count(*) FROM auth.users    WHERE raw_user_meta_data->>'is_dummy' = 'true') AS remaining_users;
