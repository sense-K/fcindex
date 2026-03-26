-- ============================================================
-- 문의 스레드 시스템 (대화형 문의)
-- 기존 contacts 테이블을 대체합니다
-- Supabase > SQL Editor 에서 실행하세요
-- ============================================================

-- 기존 테이블 정리
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.contact_threads CASCADE;

-- 문의 스레드 (각 문의 건)
CREATE TABLE public.contact_threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  subject text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 스레드 내 메시지
CREATE TABLE public.contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid NOT NULL REFERENCES public.contact_threads(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 새 메시지 삽입 시 스레드 updated_at 자동 갱신 (트리거)
CREATE OR REPLACE FUNCTION update_contact_thread_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.contact_threads SET updated_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contact_thread_timestamp
AFTER INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION update_contact_thread_timestamp();

-- RLS 활성화
ALTER TABLE public.contact_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- === contact_threads 정책 ===

-- 본인 스레드 조회
CREATE POLICY "users see own threads" ON public.contact_threads
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 관리자 전체 조회
CREATE POLICY "admin sees all threads" ON public.contact_threads
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'zzabhm@gmail.com')
  );

-- 스레드 생성 (본인만)
CREATE POLICY "users insert threads" ON public.contact_threads
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 관리자 상태 변경 (open/closed)
CREATE POLICY "admin updates thread status" ON public.contact_threads
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'zzabhm@gmail.com')
  );

-- === contact_messages 정책 ===

-- 본인 스레드 메시지 조회
CREATE POLICY "users see own messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contact_threads WHERE id = thread_id AND user_id = auth.uid())
  );

-- 관리자 전체 메시지 조회
CREATE POLICY "admin sees all messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'zzabhm@gmail.com')
  );

-- 사용자 메시지 작성 (진행중인 본인 스레드만)
CREATE POLICY "users insert messages" ON public.contact_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_type = 'user' AND
    EXISTS (
      SELECT 1 FROM public.contact_threads
      WHERE id = thread_id AND user_id = auth.uid() AND status = 'open'
    )
  );

-- 관리자 메시지 작성
CREATE POLICY "admin inserts messages" ON public.contact_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'zzabhm@gmail.com')
  );

-- 사용자 읽음 처리 (관리자 메시지만)
CREATE POLICY "users mark admin messages read" ON public.contact_messages
  FOR UPDATE TO authenticated USING (
    sender_type = 'admin' AND
    EXISTS (SELECT 1 FROM public.contact_threads WHERE id = thread_id AND user_id = auth.uid())
  );

-- 관리자 읽음 처리
CREATE POLICY "admin marks messages read" ON public.contact_messages
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND email = 'zzabhm@gmail.com')
  );
