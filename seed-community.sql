-- ============================================================
-- 커뮤니티 더미 게시글 + 점주톡 머릿글 분류
-- Supabase > SQL Editor 에서 실행하세요
-- ============================================================

-- ===== 자유게시판 (25개) =====

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '요즘 상권이 너무 힘들어요', '오픈한 지 2년 됐는데 작년부터 매출이 30% 넘게 빠졌어요. 근처에 대형마트 들어오고 주변 상가도 계속 생기면서 경쟁이 너무 심해졌어요. 다들 상권 변화에 어떻게 대응하고 계세요?', 'free', '수익·매출', true, 34, 12, now() - interval '2 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '배달앱 수수료 진짜 너무하지 않나요?', '작년 대비 수수료율이 2% 넘게 올랐어요. 배달 매출 비중이 50% 넘는데 이러면 남는 게 없어요. 자체배달 하시는 분 있으세요? 실제로 효과 있는지 궁금해요.', 'free', '마케팅·배달', true, 51, 18, now() - interval '4 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '본사에서 신메뉴 출시했는데 식재료 단가가 너무 비싸요', '신메뉴 들어오면서 새 식재료 발주해야 하는데 본사 공급가가 너무 비싸요. 마진이 거의 안 남는 메뉴를 왜 출시하는지 이해가 안 돼요. 다들 느끼시나요?', 'free', '본사 이야기', true, 42, 15, now() - interval '1 day'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '알바 구하기 진짜 너무 힘드네요', '3주째 구인 공고 올려놨는데 지원이 없어요. 최저임금 올려도 안 구해져요. 좋은 구인 채널 추천해주실 수 있나요? 알바몬, 알바천국 다 써봤어요.', 'free', '직원·인력', true, 28, 21, now() - interval '6 hours'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '오픈 8개월 만에 첫 흑자 달성했어요!', '소소하지만 너무 기쁘네요. 포기하고 싶었던 순간도 많았는데 버티길 잘했다 싶어요. 여기 있는 분들 덕분에 많이 배웠어요. 다들 파이팅입니다!', 'free', '자유', true, 87, 32, now() - interval '3 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '부가세 신고 처음인데 너무 막막해요', '올해 처음 부가세 신고인데 어디서부터 시작해야 할지 모르겠어요. 세무사 써야 할까요, 직접 할 수 있을까요? 비용은 보통 얼마나 드나요?', 'free', '세무·법률', true, 19, 14, now() - interval '5 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '2호점 낼까 고민인데 조언 부탁드려요', '현재 1호점 월 순수익이 400만원 정도 나오는데 2호점 고려 중이에요. 1호점 안정화됐다고 볼 수 있을까요? 2호점 냈다가 둘 다 망하는 경우도 많다고 해서 겁나요.', 'free', '창업·폐업', true, 33, 17, now() - interval '7 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '식재료비 비율이 계속 올라가는데 저만 그런가요?', '작년만 해도 식재료비가 매출의 28% 정도였는데 요즘은 33~35%까지 올라갔어요. 물가 오른 게 제일 크긴 한데 다들 어떻게 관리하고 계세요?', 'free', '수익·매출', true, 45, 19, now() - interval '8 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '가맹계약 재계약 때 꼭 확인해야 할 것들이 뭔가요?', '내년에 재계약인데 처음이라 뭘 봐야 할지 모르겠어요. 로열티나 식재료 공급 조건 변경이 있는지, 이전 계약과 달라진 조항 위주로 확인하면 될까요?', 'free', '질문', true, 22, 11, now() - interval '10 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '쿠팡이츠 단건배달 하시는 분 후기 궁금해요', '단건배달 도입하면 배달 시간 빨라져서 별점이 올라간다고 하는데 수수료가 더 비싸더라고요. 실제로 도입해보신 분들 효과 있었나요?', 'free', '마케팅·배달', true, 31, 13, now() - interval '11 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '주휴수당 계산 맞게 하고 있는 건지 모르겠어요', '주 15시간 이상 일하는 알바한테 주휴수당 줘야 하는 거 알긴 한데 계산이 헷갈려요. 혹시 공식 공유해주실 수 있는 분 계세요?', 'free', '직원·인력', true, 26, 9, now() - interval '12 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '본사 슈퍼바이저 방문이 너무 스트레스예요', '한 달에 한 번씩 오는데 올 때마다 지적만 해요. 도움이 되는 조언은 별로 없고 잔소리만 늘어놓는 느낌이에요. 다들 어떻게 대응하세요?', 'free', '본사 이야기', true, 58, 24, now() - interval '9 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '월매출 대비 임대료 비율 얼마나 되세요?', '저는 임대료가 매출의 18%인데 너무 높은 건지 모르겠어요. 일반적으로 몇 % 이하면 괜찮다고 보시나요?', 'free', '수익·매출', true, 39, 16, now() - interval '13 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '네이버 스마트플레이스 어떻게 관리하세요?', '예약 기능이랑 리뷰 관리 기능이 있다는 건 아는데 제대로 활용을 못하고 있어요. 사진 등록이나 이벤트 등록 효과 보신 분 있으세요?', 'free', '마케팅·배달', true, 17, 8, now() - interval '14 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '장사하면서 제일 힘든 순간이 언제예요?', '저는 매일 아침 오픈 준비가 제일 힘들어요. 직원 결근하면 혼자 다 해야 하니까요. 다들 어떤 부분이 제일 힘드세요?', 'free', '자유', true, 74, 38, now() - interval '15 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '폐업 결정 기준점이 어디라고 생각하세요?', '3개월 연속 적자면 접어야 할지 고민이에요. 주변에서는 더 버텨보라고 하는데 빚이 늘어가고 있어서요. 언제까지 버텨야 할지 모르겠어요.', 'free', '창업·폐업', true, 62, 27, now() - interval '16 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '본사 신규 교육 비용이 너무 부담돼요', '새 메뉴 출시할 때마다 교육비 청구해요. 한 번에 20~30만원씩인데 일 년에 5~6번은 하는 것 같아요. 가맹계약서에 명시된 거라 어쩔 수가 없어요.', 'free', '본사 이야기', true, 48, 20, now() - interval '17 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '임대차 계약 갱신 거절 걱정돼요', '임대차보호법상 10년 갱신 청구권이 있다는데 건물주가 직접 사용하겠다고 하면 내보낼 수 있다는 얘기를 들었어요. 권리금은 어떻게 보호받나요?', 'free', '세무·법률', true, 35, 15, now() - interval '18 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '매장 CCTV 설치 꼭 해야 하나요?', '아직 CCTV가 없는데 분쟁 생길 때 증거가 없어서 힘들 것 같아요. 법적으로 설치 의무는 없는 것 같던데 실제 운영하다 보면 필요할까요?', 'free', '질문', true, 21, 10, now() - interval '19 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '야간 알바가 계속 그만둬서 너무 힘들어요', '야간 시간대 알바가 3개월 안에 4명이 그만뒀어요. 시급도 주간보다 높게 주는데 이 정도면 저한테 문제가 있는 건지 모르겠어요.', 'free', '직원·인력', true, 29, 13, now() - interval '20 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '겨울이 여름보다 매출이 높으세요?', '저희는 핫음료 비중이 높아서 겨울 매출이 확실히 높아요. 계절 편차가 심한데 여름 비수기 대응을 어떻게 하는지 궁금해요.', 'free', '수익·매출', true, 23, 9, now() - interval '21 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '10주년 됐어요. 이 정도면 성공인가요?', '어느새 10년이 됐네요. 큰돈을 번 건 아니지만 가족 먹여 살리고 아이들 대학까지 보냈어요. 이걸 성공이라고 볼 수 있을까요? 뭔가 뿌듯하기도 하고 허무하기도 해요.', 'free', '자유', true, 112, 45, now() - interval '22 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '인스타그램 직접 운영하세요?', '마케팅 업체에 맡기자니 월 30~50만원이 부담스럽고 직접 하자니 시간이 없어요. 직접 운영하시는 분 하루에 얼마나 시간 쓰세요?', 'free', '마케팅·배달', true, 18, 11, now() - interval '23 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '화재보험 필수로 가입하셔야 하나요?', '가맹계약서에 화재보험 필수 가입이라고 되어있는데 본사 지정 보험사 외 다른 곳으로 가입해도 괜찮은지 궁금해요.', 'free', '질문', true, 14, 7, now() - interval '24 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.name, '처음 가입했어요. 이런 서비스가 있었으면 했는데', '가맹 시작한 지 1년 됐는데 항상 혼자 고민했거든요. 이런 데이터 비교 서비스가 있었으면 했는데 너무 유용하네요. 잘 부탁드립니다.', 'free', '자유', true, 64, 22, now() - interval '25 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;


-- ===== 사건사고 (18개) - 닉네임: 브랜드 카테고리 (업종) =====

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '음식 다 먹고 이물질 있다는 진상 손님', '거의 다 먹은 상태에서 머리카락이 들어있다고 환불 요청했어요. CCTV 확인하니 본인 머리카락인 게 분명한데 목소리 크게 항의하니까 주변 시선이 신경 쓰여서 그냥 환불해줬어요. 이런 상황 어떻게 대응하세요?', 'incident', '진상 손님', true, 78, 31, now() - interval '1 day'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '본사가 로열티 15% 올린다고 갑자기 통보했어요', '계약 갱신 시점도 아닌데 다음 달부터 로열티를 일방적으로 올린다고 해요. 계약서에는 협의 없이 변경 불가라고 되어있는데 본사는 계약서 내 조항을 운운하며 강행하려 해요. 법적 대응이 가능한가요?', 'incident', '본사 갑질', true, 93, 42, now() - interval '3 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '별점 1점 리뷰 테러 당했어요', '같은 날 다른 계정들에서 별점 1점 리뷰가 5개 달렸어요. 내용도 거의 비슷해서 조직적인 것 같아요. 경쟁업체 소행인 것 같은데 신고해봤더니 플랫폼에서 검토 중이라고만 하고 안 지워줘요.', 'incident', '리뷰 테러', true, 65, 28, now() - interval '2 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '음식 먹고 배탈났다며 SNS에 올린다고 협박해요', '포장 주문 후 6시간이나 지난 뒤에 연락이 왔어요. 배탈이 났다며 SNS에 올리겠다고 협박하는데 이거 공갈 협박 아닌가요? 어떻게 대응해야 하나요?', 'incident', '진상 손님', true, 84, 35, now() - interval '5 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '본사 권장 판매가 강제화, 불법 아닌가요?', '본사에서 권장 판매가를 강제하고 그 이하로 팔면 계약 위반이라고 해요. 재판매가격 유지행위는 독점규제법 위반이라고 알고 있는데 가맹점은 예외인가요?', 'incident', '본사 갑질', true, 71, 29, now() - interval '6 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '인테리어 업체한테 제대로 사기 당했어요', '오픈 전 인테리어 업체에 2천만원 선금 줬는데 공사 절반도 안 하고 잠수탔어요. 사업자 등록도 말소되어 있고 대표 연락도 안 돼요. 피해 구제 방법이 있을까요?', 'incident', '사기·피해', true, 56, 23, now() - interval '8 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '경쟁업체가 저희 가게 가짜 리뷰 쓰는 것 같아요', '직원으로 보이는 사람이 퇴근 후 카운터에서 리뷰 이벤트 참여하는 거 목격했어요. 신고하려면 증거가 필요한데 이런 경우 어떻게 해야 하나요?', 'incident', '리뷰 테러', true, 47, 19, now() - interval '9 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '소비자원 신고하겠다는 손님 대응법', '포장 용기가 마음에 안 든다고 소비자원 신고하겠다고 해요. 환경부 규정대로 용기 쓰고 있는데 무작정 신고한다고 하면 어떻게 해야 하나요?', 'incident', '진상 손님', true, 38, 16, now() - interval '10 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '미승인 식재료 사용했다고 계약 해지 통보받았어요', '마진이 안 남아서 식재료 일부를 저렴한 거로 대체했다가 본사 점검에서 걸렸어요. 바로 계약 해지 통보가 왔는데 구제받을 방법이 없을까요?', 'incident', '본사 갑질', true, 89, 37, now() - interval '11 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '구글 별점 테러 신고해서 삭제 받으신 분 계세요?', '구글 지도 리뷰에 허위 사실로 별점 테러를 당했어요. 신고해도 구글에서 처리를 안 해줘서 너무 답답해요. 성공하신 분 있으시면 방법 알려주세요.', 'incident', '리뷰 테러', true, 52, 24, now() - interval '12 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '쿠폰 중복 사용 요구하며 30분째 버티는 손님', '앱 쿠폰이랑 제휴 쿠폰 중복 사용 안 된다고 하니까 왜 안 되냐며 30분째 우기고 있어요. 직원들도 당황하고 다른 손님들 눈치도 보여요. 이런 상황 어떻게 처리하세요?', 'incident', '진상 손님', true, 61, 26, now() - interval '13 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '전 점주한테 권리금 사기 당한 것 같아요', '전 점주가 월 매출 1,500만원이라고 해서 권리금 줬는데 실제 매출이 반도 안 돼요. 매출을 부풀린 거 같은데 법적으로 사기죄 해당되나요?', 'incident', '사기·피해', true, 73, 31, now() - interval '14 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '본사 강제 발주 물량이 너무 많아요', '매달 일정 물량 이상 발주 강제인데 재고가 남아서 버리는 상황이에요. 발주 줄이겠다고 하면 불이익 준다고 협박해요. 불공정거래행위 아닌가요?', 'incident', '본사 갑질', true, 67, 28, now() - interval '15 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '마감 시간에 들어와서 1시간 넘게 앉아있는 손님', '마감 10분 전에 들어오셔서 1시간 넘게 앉아계세요. 마감 됐다고 말씀드리니까 불친절하다고 리뷰 쓰겠다고 해요. 이런 분들 어떻게 응대하세요?', 'incident', '진상 손님', true, 55, 22, now() - interval '16 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '허위 리뷰 법적 대응 실제로 해보신 분 있나요?', '직원 욕설, 위생 불량 등 명백한 허위 내용으로 리뷰가 달렸어요. 변호사한테 물어보니 명예훼손 가능하다는데 소송 비용이 더 나올 것 같아서요. 실제 경험 있으신 분 계신가요?', 'incident', '리뷰 테러', true, 44, 20, now() - interval '17 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '직원이 재고 빼돌린 것 같아요', 'CCTV 확인하니 야간 직원이 마감 후 식재료를 챙겨가는 게 포착됐어요. 얼마나 됐는지 파악이 안 되는데 형사 고소와 민사 소송 둘 다 가능한가요?', 'incident', '기타', true, 81, 34, now() - interval '18 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, 'POS 업체가 계약 종료 후 데이터를 못 내보내게 해요', 'POS 계약 해지했더니 그동안의 매출 데이터를 내보내주지 않겠다고 해요. 이건 제 데이터인데 이런 게 합법인가요?', 'incident', '사기·피해', true, 36, 15, now() - interval '19 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;

INSERT INTO public.posts (author_id, brand_id, nickname, title, content, board, flair, is_anonymous, like_count, comment_count, created_at)
SELECT p.id, p.brand_id, b.category, '옆 가게에서 저희 흉보는 전단지를 돌렸어요', '경쟁 업체에서 저희 가게를 특정해서 위생 문제가 있다는 내용의 전단지를 주변에 뿌렸어요. 명백한 허위인데 영업 방해와 명예훼손으로 고소 가능한가요?', 'incident', '기타', true, 49, 21, now() - interval '20 days'
FROM public.profiles p JOIN public.brands b ON b.id = p.brand_id WHERE p.email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 1;


-- ===== 점주톡 기존 글 머릿글 분류 =====

UPDATE public.posts
SET flair = (ARRAY['자유', '수익·매출', '본사 이야기', '직원 구인', '메뉴·식재료', '장비·시설', '행사·이벤트', '질문'])[floor(random() * 8 + 1)]
WHERE board = 'brand' AND flair IS NULL;

-- 확인
SELECT board, flair, count(*) FROM public.posts GROUP BY board, flair ORDER BY board, flair;
