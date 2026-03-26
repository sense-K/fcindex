-- ============================================================
-- 더미 프로필 닉네임을 자연스러운 영문 닉네임으로 교체
-- 접두사 100개 × 접미사 100개 = 10,000 고유 조합 (중복 없음)
-- ============================================================

-- 1. unique 제약 임시 해제
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_nickname_unique;

-- 2. 닉네임 일괄 업데이트
WITH ranked AS (
  SELECT id,
         (row_number() OVER (ORDER BY created_at) - 1) AS rn
  FROM public.profiles
  WHERE email LIKE '%@fcindex.dummy'
),
nickname_map AS (
  SELECT
    id,
    (ARRAY[
      'coffee','chicken','pizza','burger','rice','toast','latte','mocha',
      'cream','golden','lucky','happy','busy','smart','fresh','daily',
      'early','night','quick','soft','bold','cool','warm','sweet',
      'salty','crispy','melty','juicy','smoky','spicy',
      'tangy','zesty','flaky','glazed','roasted','baked','tender',
      'steamed','chunky','savory','cheesy','buttery','herby','minty',
      'nutty','fruity','citrus','peachy','mango','berry','cherry',
      'maple','honey','caramel','vanilla','cocoa','matcha','chai',
      'ginger','pepper','garlic','onion','sesame','soy','miso',
      'ramen','sushi','tacos','bagel','waffle','crepe','donut',
      'muffin','cookie','brownie','truffle','pudding','sorbet','gelato',
      'sunny','breezy','cloudy','windy','frosty','stormy','misty',
      'dewy','crisp','vivid','brisk','mellow','lively','serene',
      'jazzy','funky','quirky','snappy','zippy','peppy','cozy'
    ])[(rn / 100) % 100 + 1]
    ||
    (ARRAY[
      'boss','chief','owner','king','star','pro','ace','hub',
      'spot','nest','bay','den','lab','co','hq','guy',
      'gal','mate','zone','base','shop','club','crew','team',
      'gang','house','room','world','land','park',
      'desk','hall','grid','port','link','cove','peak','ridge',
      'trail','grove','field','brook','cliff','shore','plain','vault',
      'forge','depot','lodge','cabin','tower','haven','plaza','square',
      'point','stage','court','bench','track','route','line','circle',
      'corner','space','place','site','post','node','core','edge',
      'root','wing','deck','loft','yard','lane','path','gate',
      'loop','run','row','bar','box','pit','pad','camp',
      'fort','hold','keep','ward','rock','stone','wood','leaf',
      'bloom','vine','seed','moss','mill','dock'
    ])[rn % 100 + 1]
    AS new_nick
  FROM ranked
)
UPDATE public.profiles p
SET nickname = nm.new_nick
FROM nickname_map nm
WHERE p.id = nm.id;

-- 3. unique 제약 복구
ALTER TABLE public.profiles ADD CONSTRAINT profiles_nickname_unique UNIQUE (nickname);

-- 4. posts, post_comments 닉네임 동기화
UPDATE public.posts
SET nickname = (SELECT nickname FROM public.profiles WHERE public.profiles.id = public.posts.author_id)
WHERE author_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@fcindex.dummy');

UPDATE public.post_comments
SET nickname = (SELECT nickname FROM public.profiles WHERE public.profiles.id = public.post_comments.author_id)
WHERE author_id IN (SELECT id FROM public.profiles WHERE email LIKE '%@fcindex.dummy');

-- 5. 확인
SELECT nickname FROM public.profiles WHERE email LIKE '%@fcindex.dummy' ORDER BY random() LIMIT 20;
