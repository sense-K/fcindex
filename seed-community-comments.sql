-- ============================================================
-- 커뮤니티 더미 댓글 생성
-- seed-community.sql 실행 후 실행하세요
-- Supabase > SQL Editor 에서 실행하세요
-- ============================================================

DO $$
DECLARE
  post_rec RECORD;
  commenter RECORD;
  i INT;
  total_comments INT;
  selected_content TEXT;

  free_comments TEXT[] := ARRAY[
    '저도 완전 공감해요. 요즘 진짜 힘드네요.',
    '맞아요, 저도 같은 상황이에요. 어떻게 해결하셨는지 궁금해요.',
    '좋은 정보 감사해요. 많이 배웠습니다.',
    '저는 이렇게 해봤는데 효과 있었어요. 한 번 해보세요.',
    '진짜 공감되는 글이에요. 위로가 됩니다.',
    '저도 같은 고민이에요. 답변들 참고하겠습니다.',
    '이 글 보고 나만 그런 게 아니구나 싶었어요.',
    '저는 세무사 써서 해결했어요. 비용 아깝지 않더라고요.',
    '힘내세요! 다들 비슷한 어려움을 겪고 있어요.',
    '오 이런 방법이 있었군요. 바로 적용해봐야겠어요.',
    '저도 비슷한 경험이 있어서 공감돼요.',
    '정말 유용한 글이에요. 저장해둡니다.',
    '저는 다르게 접근했는데 결과는 비슷했어요.',
    '이 고민 저도 해봤어요. 결론은 그냥 감수하는 거더라고요.',
    '댓글 다 읽었는데 좋은 정보들이 많네요. 감사합니다.',
    '처음엔 저도 막막했는데 하다 보니 익숙해지더라고요.',
    '근처 점주분이랑 이 얘기 나눴는데 비슷한 상황이래요.',
    '저도 이 문제로 고민 많이 했어요. 쉽지 않죠.',
    '진짜 현실적인 고민이네요. 저도 지금 같은 상황이에요.',
    '좋은 글 써주셔서 감사해요. 많이 공감됩니다.',
    '저는 직접 연락해서 해결했어요. 시간이 좀 걸렸지만요.',
    '너무 공감돼요. 이런 거 공유해줘서 고맙습니다.',
    '저도 같은 문제 있었는데 결국 타협했어요.',
    '이런 커뮤니티 있어서 다행이에요. 혼자 고민 안 해도 되니까.',
    '경험 공유 감사해요. 참고하겠습니다.',
    '저도 이 방향으로 생각해봐야겠어요.',
    '와 저랑 상황이 완전 똑같네요. 어떻게 되셨는지 결과가 궁금해요.',
    '저는 이미 비슷한 상황 겪었는데 쉽지 않더라고요.',
    '같은 처지에 있는 분들이 이렇게 많구나 싶어요.',
    '저도 처음엔 몰랐는데 알고 나니 당연한 거였어요.',
    '좋은 방법 알려주셔서 고맙습니다. 바로 써봐야겠어요.',
    '이거 저도 여러 번 겪었어요. 진짜 힘들죠.',
    '댓글들 보면서 많이 배우고 가요. 감사합니다.',
    '이 방법 저도 써봤는데 꽤 효과 있었어요.',
    '혼자 고민했던 문제를 여기서 공유해주시니 감사해요.',
    '결국 경험에서 나오는 거네요. 저도 더 부딪혀봐야겠어요.',
    '저는 아직 이 단계까지 안 왔는데 미리 알아두면 좋겠어요.',
    '진짜 현실 공감 글이에요.',
    '글 잘 읽었습니다. 도움 많이 됐어요.',
    '저도 같은 질문 하려고 했는데 마침 있었네요. 감사합니다.'
  ];

  incident_comments TEXT[] := ARRAY[
    '완전 공감해요. 저도 비슷한 상황 겪었어요.',
    '진짜 말이 안 되는 상황이네요. 어떻게 됐나요?',
    '이런 일 당하면 정말 억울하죠. 파이팅이에요.',
    '법적 대응 진지하게 고려해보세요. 충분히 가능할 것 같아요.',
    '저도 똑같이 당했어요. 정말 지치는 일이에요.',
    '이 사람들 진짜 너무해요. 어떻게 이럴 수가 있죠.',
    '공유해주셔서 감사해요. 미리 알아두면 대비가 되죠.',
    '저도 이런 상황 처음엔 어떻게 해야 할지 몰랐어요.',
    '소비자원에 반박 자료 제출하면 도움 될 수 있어요.',
    '플랫폼 고객센터에 증거 자료 첨부해서 재신고해보세요.',
    '저는 그냥 넘어갔다가 더 큰 일 당했어요. 꼭 대응하세요.',
    '이런 사례 알려주셔서 조심해야겠다고 느꼈어요.',
    '가맹점주협의회에 도움 요청해보시는 것도 방법이에요.',
    '공정거래위원회 신고 검토해보세요. 비슷한 사례 있어요.',
    '변호사 무료 상담 받아보세요. 의외로 방법 있을 수 있어요.',
    '저도 이런 상황 때문에 정말 힘들었어요. 혼자 버티지 마세요.',
    '이런 일이 있었군요. 꼭 해결되길 바랍니다.',
    '힘내세요. 잘못한 게 없으면 당당하게 대응하세요.',
    '저도 비슷한 리뷰 테러 당한 적 있어요. 정말 열 받죠.',
    '진상 손님은 절대 다시 안 오게 단호하게 대응하는 게 나아요.',
    '이런 상황 공유해주셔서 저도 대비해야겠다 싶었어요.',
    '정말 억울하겠다. 증거 꼭 보존하세요.',
    '법적으로 충분히 대응 가능한 사안이에요. 포기하지 마세요.',
    '저는 이 상황에서 단호하게 거절했어요. 그게 더 나았어요.',
    '이런 갑질 정말 근절됐으면 좋겠어요.',
    '공유해주셔서 감사해요. 저도 이런 상황 생기면 어떻게 해야 할지 알겠어요.',
    '가맹점주도 권리가 있어요. 꼭 대응해보세요.',
    '진짜 이런 본사는 공정위에 신고해야 해요.',
    '저도 같은 경험 있어요. 정말 심리적으로 힘들더라고요.',
    '이런 글 공유해주셔서 같이 조심하게 돼요. 감사해요.',
    '혼자 감당하려 하지 말고 주변에 도움 요청하세요.',
    '이거 진짜 기록 다 남겨두세요. 나중에 증거 됩니다.',
    '저도 비슷한 일 당했는데 결국 법적 대응으로 해결했어요.',
    '이런 상황이 생기면 바로 대화 내용 캡처해두세요.',
    '저도 CCTV 없어서 당한 적 있어요. CCTV 진짜 필수예요.',
    '진짜 이런 상황들 들을 때마다 화가 나요.',
    '힘드시겠지만 포기하지 마세요. 방법이 반드시 있어요.',
    '이 글 보고 저도 계약서 다시 꼼꼼히 읽어봐야겠다 싶었어요.',
    '저도 같은 고민 하고 있어요. 같이 힘내요.',
    '이런 상황 알려주시면 다른 분들도 미리 대비할 수 있어요. 감사해요.'
  ];

BEGIN
  -- free, incident 게시판의 더미 사용자 글에 댓글 생성
  FOR post_rec IN
    SELECT po.id, po.board, po.comment_count, po.created_at
    FROM public.posts po
    JOIN public.profiles pr ON pr.id = po.author_id
    WHERE po.board IN ('free', 'incident')
      AND pr.email LIKE '%@fcindex.dummy'
    ORDER BY po.created_at
  LOOP
    total_comments := post_rec.comment_count;

    FOR i IN 1..total_comments LOOP
      -- 랜덤 더미 사용자 선택
      SELECT p.id, b.name AS brand_name, b.category AS brand_cat
      INTO commenter
      FROM public.profiles p
      JOIN public.brands b ON b.id = p.brand_id
      WHERE p.email LIKE '%@fcindex.dummy'
      ORDER BY random()
      LIMIT 1;

      -- 게시판 유형에 따라 댓글 내용 및 닉네임 결정
      -- 사건사고: 카테고리(업종)로 표시 / 자유게시판: 브랜드명으로 표시
      IF post_rec.board = 'incident' THEN
        selected_content := incident_comments[1 + (floor(random() * array_length(incident_comments, 1)))::int];
        INSERT INTO public.post_comments (post_id, author_id, content, nickname, created_at)
        VALUES (
          post_rec.id,
          commenter.id,
          selected_content,
          commenter.brand_cat,
          post_rec.created_at + (interval '1 hour' * i * (0.5 + random()))
        );
      ELSE
        selected_content := free_comments[1 + (floor(random() * array_length(free_comments, 1)))::int];
        INSERT INTO public.post_comments (post_id, author_id, content, nickname, created_at)
        VALUES (
          post_rec.id,
          commenter.id,
          selected_content,
          commenter.brand_name,
          post_rec.created_at + (interval '1 hour' * i * (0.5 + random()))
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 확인
SELECT
  p.board,
  p.title,
  p.comment_count AS "설정된 댓글 수",
  COUNT(c.id) AS "실제 댓글 수"
FROM public.posts p
LEFT JOIN public.post_comments c ON c.post_id = p.id
WHERE p.board IN ('free', 'incident')
GROUP BY p.id, p.board, p.title, p.comment_count
ORDER BY p.board, p.created_at DESC
LIMIT 20;
