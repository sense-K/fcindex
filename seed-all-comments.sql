-- 전체 게시판 댓글 재정비
-- 자유/사건사고: 기존 댓글 삭제 후 플레어별 적합한 댓글 5~7개 재생성
-- 언더커버: comment_count만 실제 댓글 수로 동기화
DO $$
DECLARE
  post_rec RECORD;
  commenter_rec RECORD;
  num_comments INT;
  k INT;
  comments_pool TEXT[];

  -- 자유게시판 플레어별 댓글 풀
  c_jayu TEXT[] := ARRAY[
    '저도 완전 공감해요. 힘든 날도 매장 들어서면 또 하게 되더라고요.',
    '이런 이야기 나눌 수 있어서 좋아요. 여기 있어서 다행이에요.',
    '저도 비슷한 상황 있었는데 지나고 보니 다 경험이 되더라고요.',
    '공감해요. 자영업 하면 다들 비슷한 감정선을 겪는 것 같아요.',
    '저도 그런 시기가 있었어요. 지금은 많이 나아졌어요. 파이팅!',
    '이런 거 공유해주셔서 감사해요. 나만 그런 게 아니구나 싶어요.',
    '힘드실 때 여기서 털어놓으세요. 다들 비슷한 상황이에요.',
    '저도 비슷한 고민 했어요. 결국 시간이 지나면서 해결됐어요.'
  ];
  c_maeul TEXT[] := ARRAY[
    '저도 비슷한 수치예요. 이번 달은 특히 배달 매출이 많이 빠졌어요.',
    '인건비율은 25% 이하로 잡는 게 목표인데 쉽지 않죠.',
    '시즌 메뉴 추가했을 때 꽤 효과가 있었어요. 시도해보세요.',
    '피크타임에 집중하는 방식으로 바꿨더니 수익이 나아졌어요.',
    '배달 비중 줄이고 홀 매출 늘리는 게 실질 수익에 확실히 도움됐어요.',
    '포스 통계로 일별 원가율 계산하기 시작했더니 낭비가 많이 줄었어요.',
    '임대료 협상은 계약 만료 3개월 전에 시작하는 게 좋아요.',
    '저도 같은 상황이에요. 원가율 관리가 제일 중요한 것 같아요.'
  ];
  c_bonsa TEXT[] := ARRAY[
    '저도 같은 경험이에요. 본사가 일방적으로 바꾸는 건 진짜 황당하죠.',
    '가맹사업법으로 이의 제기할 수 있는 부분이 있을 수 있어요.',
    '우리 브랜드도 비슷한 상황이에요. 다들 느끼는 문제인 것 같아요.',
    '협의회 통해서 공식 안건으로 올리는 게 제일 효과적이에요.',
    '저도 담당자 바뀔 때마다 힘들어요. 매번 처음부터 다시 설명해야 하죠.',
    '계약서에서 해당 조항 근거 확인하고 대응하세요.',
    '이런 문제들을 점주들끼리 공유하는 게 중요한 것 같아요.',
    '저도 교육이 현실과 너무 달라서 답답했어요. 공감합니다.'
  ];
  c_jikwon TEXT[] := ARRAY[
    '당근마켓 구인 효과 제일 좋았어요. 저도 거기서 구했어요.',
    '기존 직원 소개비 주고 데려오는 게 제일 잘 맞는 사람 구하는 방법이에요.',
    '인센티브 제도 도입했더니 장기 근무 비율이 올라갔어요.',
    '주방 보조는 요리학원 게시판에 올리면 지원자가 꽤 있어요.',
    '파트타임보다 풀타임으로 올리면 지원자 성향이 달라지더라고요.',
    '면접 때 체험 근무 하루 해보는 게 제일 정확한 방법이에요.',
    '저도 무단결근 당한 적 있어요. 항상 여유 인력 파악해두세요.',
    '최저임금보다 300~500원만 올려도 지원자 숫자가 확연히 달라져요.'
  ];
  c_changup TEXT[] := ARRAY[
    '저도 초반에 많이 힘들었어요. 보통 6개월이 고비더라고요.',
    '폐업 고민될 때 전문가 상담 먼저 받으세요. 방법이 있을 수 있어요.',
    '2호점은 1호점이 완전히 안정화된 후에 고민하는 게 맞는 것 같아요.',
    '창업 전에 미리 알았더라면 하는 게 많아요. 공유해주셔서 감사해요.',
    '처음 1년이 제일 힘들고 그 이후로는 조금씩 나아지더라고요.',
    '폐업은 최후의 수단이에요. 양도도 먼저 고려해보세요.',
    '저도 비슷한 시기에 같은 고민을 했어요. 버텼더니 나아졌어요.',
    '창업 경험담 공유해주셔서 도움이 됐어요. 저도 예비 창업자예요.'
  ];
  c_semu TEXT[] := ARRAY[
    '세무사 쓰는 게 처음엔 비용 아깝다 싶었는데 절세 효과로 오히려 이득이에요.',
    '부가세는 세무사한테 맡기는 게 낫고 소득세는 직접 해도 돼요.',
    '주휴수당 계산은 (주 소정근로시간÷40)×시급×8시간으로 하면 돼요.',
    '가맹사업법 위반 소지 있으면 공정거래위원회에 신고 가능해요.',
    '사업자 대출은 소상공인진흥공단 먼저 알아보세요. 조건이 훨씬 좋아요.',
    '홈택스에서 직접 신고하면 비용 아낄 수 있어요. 생각보다 어렵지 않아요.',
    '저도 처음엔 세금 신고 무서웠는데 세무사 써서 많이 편해졌어요.',
    '법적인 문제는 초기에 대응하는 게 중요해요. 늦으면 더 복잡해져요.'
  ];
  c_marketing TEXT[] := ARRAY[
    '배달앱 수수료 저도 너무 부담이에요. 자체 주문 채널도 고려해봤어요.',
    'SNS 마케팅은 6개월 이상 꾸준히 해야 효과가 보여요.',
    '배달앱 쿠폰은 신규 고객 유입용으로만 쓰는 게 수익에 좋아요.',
    '리뷰 관리가 배달앱 노출에 생각보다 큰 영향을 줘요.',
    '인스타그램으로 동네 손님 유입 효과가 꽤 있었어요.',
    '단건배달 도입 후 별점이 올라가긴 했는데 수수료 부담도 같이 올라갔어요.',
    '단골 손님한테 SNS 태그 부탁드리는 게 효과적인 마케팅이에요.',
    '자체 할인보다 배달앱 내 광고가 단기 효과는 더 좋았어요.'
  ];
  c_question TEXT[] := ARRAY[
    '저도 같은 질문 해봤는데 경험자분들 답변이 정말 도움됐어요.',
    '이런 정보 공유해주셔서 감사해요. 저도 같은 고민이었어요.',
    '직접 겪어보니 미리 알았으면 좋았을 것들이 많더라고요.',
    '전문가 상담도 좋지만 실제 운영하시는 분들 경험이 더 도움될 때가 많아요.',
    '저도 비슷한 상황에서 여기서 답을 찾았어요. 좋은 커뮤니티예요.',
    '댓글들 보면서 저도 몰랐던 내용을 많이 배워요.',
    '이런 실질적인 정보 나눌 수 있어서 가입 잘 했다는 생각이 들어요.',
    '저도 같은 질문 하려고 했는데 먼저 올려주셨네요. 감사합니다.'
  ];

  -- 사건사고 플레어별 댓글 풀
  c_jinsang TEXT[] := ARRAY[
    '저도 비슷한 경험이 있어요. 이런 손님 대처가 제일 힘들죠.',
    '블랙컨슈머는 단호하게 대응하는 게 맞아요. 한 번 물러서면 계속 당해요.',
    '이런 상황 직원들한테도 미리 공유해두면 당황하지 않아요.',
    '저도 같은 유형의 손님 때문에 스트레스받은 적 있어요. 공감해요.',
    'CCTV 영상 꼭 백업해두세요. 나중에 증거로 필요할 수 있어요.',
    '업종 특성상 이런 손님들이 꼭 있더라고요. 멘탈 관리가 중요해요.',
    '정중하지만 단호하게 대응했더니 효과가 있었어요.',
    '법적으로 대응 가능한 부분이 있으면 적극 활용하는 게 좋아요.'
  ];
  c_bonsa_gab TEXT[] := ARRAY[
    '공정거래위원회 가맹사업 분쟁 조정 신청 가능해요. 알아두세요.',
    '저도 비슷한 상황 있었는데 가맹주 협의회 통해서 해결했어요.',
    '이런 사례 문서화해두는 게 나중에 대응할 때 중요해요.',
    '가맹사업거래 분쟁조정협의회 활용해보세요.',
    '저도 같은 경험이에요. 점주들끼리 뭉쳐야 목소리가 나와요.',
    '계약서에 해당 조항 근거 있는지 꼭 확인하세요.',
    '이런 불합리한 상황은 혼자 감당하지 말고 공론화하는 게 맞아요.',
    '공동 대응이 혼자 싸우는 것보다 훨씬 효과적이에요.'
  ];
  c_sagi TEXT[] := ARRAY[
    '이런 경험 공유해주셔서 감사해요. 다른 점주분들한테 경각심이 될 것 같아요.',
    '저도 비슷한 피해 경험이 있어요. 증거 자료 반드시 챙겨두세요.',
    '경찰 신고랑 법적 대응 병행하는 게 좋아요. 포기하지 마세요.',
    '이런 수법이 있다는 걸 미리 알았더라면 좋았을 텐데 정보 공유 감사해요.',
    '피해 금액이 크면 변호사 선임도 고려해보세요.',
    '소비자원이나 분쟁조정 기관 활용도 고려해보세요.',
    '이런 피해 공유해주셔서 저도 조심해야겠다는 생각이 들었어요.',
    '힘드시겠지만 잘 해결되시길 진심으로 바랍니다.'
  ];
  c_review TEXT[] := ARRAY[
    '악성 리뷰는 플랫폼 측에 신고하면 삭제 가능한 경우가 있어요.',
    '저도 리뷰 테러 당한 경험이 있어요. 정말 억울하죠.',
    '진심으로 성의있게 답글 달면 다른 손님들이 알아서 판단해줘요.',
    '리뷰 테러범은 법적 대응이 가능해요. 고소 진행한 사례도 있어요.',
    '진정성 있는 답글로 오히려 별점이 회복된 경험이 있어요.',
    '긍정 리뷰를 꾸준히 늘리는 게 장기적으로 더 효과적이에요.',
    '플랫폼 고객센터 신고하면 실제로 처리해주는 경우가 있어요.',
    '이런 상황 공유해주셔서 다른 분들도 조심할 수 있을 것 같아요.'
  ];
  c_incident_etc TEXT[] := ARRAY[
    '이런 상황 공유해주셔서 감사해요. 저도 비슷한 경험 있어요.',
    '자영업하면서 이런 일들이 생기는 게 너무 힘들죠. 공감해요.',
    '법적 대응 전에 관련 기관 무료 상담 먼저 받아보세요.',
    '이런 경험담 공유가 다른 점주분들한테 정말 도움이 돼요.',
    '혼자 감당하려 하지 마세요. 도움받을 수 있는 곳이 있어요.',
    '저도 비슷한 상황에서 많이 힘들었어요. 잘 해결되시길 바랍니다.',
    '증거 자료 꼼꼼히 챙겨두는 게 제일 중요해요.',
    '이런 사례 공유해주셔서 우리 모두 미리 대비할 수 있게 됐어요.'
  ];

BEGIN
  -- ① 자유/사건사고 기존 댓글 전체 삭제
  DELETE FROM public.post_comments
  WHERE post_id IN (SELECT id FROM public.posts WHERE board IN ('free','incident'));

  -- ② 자유게시판 댓글 재생성
  FOR post_rec IN
    SELECT id, flair FROM public.posts WHERE board = 'free'
  LOOP
    CASE COALESCE(post_rec.flair,'')
      WHEN '수익·매출'   THEN comments_pool := c_maeul;
      WHEN '본사 이야기' THEN comments_pool := c_bonsa;
      WHEN '직원·인력'   THEN comments_pool := c_jikwon;
      WHEN '창업·폐업'   THEN comments_pool := c_changup;
      WHEN '세무·법률'   THEN comments_pool := c_semu;
      WHEN '마케팅·배달' THEN comments_pool := c_marketing;
      WHEN '질문'        THEN comments_pool := c_question;
      ELSE                    comments_pool := c_jayu;
    END CASE;

    num_comments := floor(random() * 3 + 5)::int;

    FOR k IN 1..num_comments LOOP
      SELECT p.id, b.name AS nick
      INTO commenter_rec
      FROM public.profiles p
      JOIN public.brands b ON b.id = p.brand_id
      WHERE p.email LIKE '%@fcindex.dummy'
        AND p.id != post_rec.id
      ORDER BY random() LIMIT 1;

      CONTINUE WHEN commenter_rec.id IS NULL;

      INSERT INTO public.post_comments (post_id, author_id, content, nickname, created_at, is_dummy)
      VALUES (
        post_rec.id,
        commenter_rec.id,
        comments_pool[floor(random() * array_length(comments_pool,1)) + 1],
        commenter_rec.nick,
        now() - (random() * interval '30 days'),
        true
      );
    END LOOP;

    UPDATE public.posts SET comment_count = num_comments WHERE id = post_rec.id;
  END LOOP;

  -- ③ 사건사고 댓글 재생성
  FOR post_rec IN
    SELECT id, flair FROM public.posts WHERE board = 'incident'
  LOOP
    CASE COALESCE(post_rec.flair,'')
      WHEN '진상 손님'  THEN comments_pool := c_jinsang;
      WHEN '본사 갑질'  THEN comments_pool := c_bonsa_gab;
      WHEN '사기·피해'  THEN comments_pool := c_sagi;
      WHEN '리뷰 테러'  THEN comments_pool := c_review;
      ELSE                   comments_pool := c_incident_etc;
    END CASE;

    num_comments := floor(random() * 3 + 5)::int;

    FOR k IN 1..num_comments LOOP
      SELECT p.id, b.category AS nick
      INTO commenter_rec
      FROM public.profiles p
      JOIN public.brands b ON b.id = p.brand_id
      WHERE p.email LIKE '%@fcindex.dummy'
        AND p.id != post_rec.id
      ORDER BY random() LIMIT 1;

      CONTINUE WHEN commenter_rec.id IS NULL;

      INSERT INTO public.post_comments (post_id, author_id, content, nickname, created_at, is_dummy)
      VALUES (
        post_rec.id,
        commenter_rec.id,
        comments_pool[floor(random() * array_length(comments_pool,1)) + 1],
        commenter_rec.nick,
        now() - (random() * interval '30 days'),
        true
      );
    END LOOP;

    UPDATE public.posts SET comment_count = num_comments WHERE id = post_rec.id;
  END LOOP;

  -- ④ 언더커버 comment_count를 실제 댓글 수로 동기화
  UPDATE public.posts p
  SET comment_count = (
    SELECT COUNT(*) FROM public.post_comments c WHERE c.post_id = p.id
  )
  WHERE p.board = 'brand';

END $$;
