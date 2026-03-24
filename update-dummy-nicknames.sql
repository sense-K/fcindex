-- ============================================================
-- 더미 프로필 닉네임을 자연스러운 닉네임으로 교체
-- Supabase > SQL Editor 에서 실행하세요
-- ============================================================

DO $$
DECLARE
  bases text[] := ARRAY[
    '커피사랑', '치킨마스터', '새벽사장님', '열정점주', '알뜰사장',
    '단골만들기', '오늘도영업', '배달달인', '맛집도전중', '아메리카노러버',
    '따뜻한라떼', '황금손사장', '꼼꼼한점주', '성실한사장', '파이팅사장님',
    '수익극대화', '직원사랑해', '친절한매장', '아침여는가게', '월세뚝딱',
    '흑자도전기', '단골왕', '서비스최고', '청결달인', '비용절감중',
    '매출쑥쑥', '점심타임왕', '야간사장님', '계절메뉴달인', '가맹점주',
    '식재료달인', '인건비최적화', '포장달인', '홀매출왕', '리뷰관리왕',
    '마케팅달인', '손님미소', '재방문왕', '매장청결왕', '위생철저',
    '발주달인', '스케줄왕', '임대협상왕', '세금절약', '배달수수료',
    '원두향기', '카페인중독', '브랜드충성', '점주생활', '매출올리자'
  ];
  rec    RECORD;
  idx    int := 0;
  suffix int;
  new_nick text;
BEGIN
  FOR rec IN SELECT id FROM profiles WHERE is_dummy = true ORDER BY created_at LOOP
    idx    := idx + 1;
    suffix := 10 + (idx / array_length(bases, 1));
    new_nick := bases[((idx - 1) % array_length(bases, 1)) + 1] || suffix::text;

    UPDATE profiles SET nickname = new_nick WHERE id = rec.id;
  END LOOP;
END $$;

-- posts, post_comments 닉네임 동기화
UPDATE posts
SET nickname = (SELECT nickname FROM profiles WHERE profiles.id = posts.author_id)
WHERE author_id IN (SELECT id FROM profiles WHERE is_dummy = true);

UPDATE post_comments
SET nickname = (SELECT nickname FROM profiles WHERE profiles.id = post_comments.author_id)
WHERE author_id IN (SELECT id FROM profiles WHERE is_dummy = true);

-- 확인
SELECT nickname FROM profiles WHERE is_dummy = true ORDER BY random() LIMIT 20;
