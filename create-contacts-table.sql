-- ============================================================
-- 문의하기 테이블 생성
-- Supabase > SQL Editor 에서 실행하세요
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  nickname text,
  email text,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 로그인한 유저만 문의 등록 가능
CREATE POLICY "authenticated can insert contacts" ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (true);

-- 로그인한 유저는 읽기 가능 (관리자 체크는 JS에서 처리)
CREATE POLICY "authenticated can read contacts" ON public.contacts
  FOR SELECT TO authenticated USING (true);

-- 읽음 처리 업데이트 허용
CREATE POLICY "authenticated can update contacts" ON public.contacts
  FOR UPDATE TO authenticated USING (true);
