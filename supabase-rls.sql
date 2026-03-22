-- ============================================================
-- 프차인덱스 Supabase 완전 설정 스크립트
-- Supabase > SQL Editor 에서 실행하세요 (전체 선택 후 Run)
-- ============================================================

-- ── 1. post_comments 테이블 ────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid REFERENCES posts(id) ON DELETE CASCADE,
  author_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL,
  is_dummy   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "댓글 전체 조회" ON post_comments;
CREATE POLICY "댓글 전체 조회"
  ON post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "본인 댓글 작성" ON post_comments;
CREATE POLICY "본인 댓글 작성"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "본인 댓글 삭제" ON post_comments;
CREATE POLICY "본인 댓글 삭제"
  ON post_comments FOR DELETE
  USING (auth.uid() = author_id);

-- ── 2. post_likes 테이블 (좋아요 DB 추적) ─────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  post_id  uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "좋아요 전체 조회" ON post_likes;
CREATE POLICY "좋아요 전체 조회"
  ON post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "본인 좋아요 추가" ON post_likes;
CREATE POLICY "본인 좋아요 추가"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "본인 좋아요 취소" ON post_likes;
CREATE POLICY "본인 좋아요 취소"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ── 3. posts RLS ───────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "게시글 전체 조회" ON posts;
CREATE POLICY "게시글 전체 조회"
  ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "인증 유저 게시글 작성" ON posts;
CREATE POLICY "인증 유저 게시글 작성"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 좋아요·댓글수 업데이트는 인증 유저 누구나 가능
DROP POLICY IF EXISTS "인증 유저 게시글 업데이트" ON posts;
CREATE POLICY "인증 유저 게시글 업데이트"
  ON posts FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 삭제: 작성자 본인 또는 관리자
DROP POLICY IF EXISTS "본인 또는 관리자 게시글 삭제" ON posts;
CREATE POLICY "본인 또는 관리자 게시글 삭제"
  ON posts FOR DELETE
  USING (
    auth.uid() = author_id
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'zzabhm@gmail.com'
  );

-- ── 4. is_dummy 컬럼 (없으면 추가) ───────────────────────
ALTER TABLE posts         ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;
ALTER TABLE profiles      ADD COLUMN IF NOT EXISTS is_dummy boolean DEFAULT false;

-- ── 완료 확인 ─────────────────────────────────────────────
SELECT 'post_comments' AS 테이블, count(*) AS 행수 FROM post_comments
UNION ALL
SELECT 'post_likes',              count(*)       FROM post_likes
UNION ALL
SELECT 'posts',                   count(*)       FROM posts;
