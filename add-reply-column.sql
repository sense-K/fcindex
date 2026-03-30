-- 대댓글 기능: post_comments에 parent_comment_id 컬럼 추가
ALTER TABLE post_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE;
