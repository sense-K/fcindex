require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('── Step 1: 현황 확인 ──────────────────────────\n');

  // [1] 전체 row 수 + NULL/빈 제목 개수
  const { count: total } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  const { count: titleNull } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .is('title', null);

  const { count: titleEmpty } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('title', '');

  console.log('[1] 전체 row 수 / NULL 제목 / 빈 제목');
  console.log(`  total_rows  : ${total}`);
  console.log(`  title_null  : ${titleNull}`);
  console.log(`  title_empty : ${titleEmpty}`);
  console.log();

  // [2] 샘플 10개 (board, title, 길이)
  const { data: samples, error: sampleErr } = await supabase
    .from('posts')
    .select('id, board, title')
    .limit(10);

  if (sampleErr) {
    console.error('[2] 샘플 조회 실패:', sampleErr.message);
    process.exit(1);
  }

  console.log('[2] title 샘플 10개');
  console.log('  board      | len | title');
  console.log('  ' + '─'.repeat(60));
  for (const row of samples) {
    const board = row.board.padEnd(10);
    const len   = String(row.title?.length ?? 0).padStart(3);
    const title = (row.title ?? '').slice(0, 50);
    console.log(`  ${board} | ${len} | ${title}`);
  }
  console.log();

  // [3] 이모지/특수문자 포함 제목 여부
  //     Supabase JS client에서 정규식 필터는 .filter() 미지원이라
  //     전체를 가져와서 JS에서 판별
  const { data: allTitles, error: allErr } = await supabase
    .from('posts')
    .select('id, title');

  if (allErr) {
    console.error('[3] 전체 조회 실패:', allErr.message);
    process.exit(1);
  }

  // 이모지 범위: U+1F000 이상 또는 일반 기호 범위
  const emojiRe = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{FE00}-\u{FEFF}]/u;
  const emojiRows = allTitles.filter(r => r.title && emojiRe.test(r.title));
  const nullOrEmptyRows = allTitles.filter(r => !r.title || r.title.trim() === '');

  console.log('[3] 이모지 포함 제목');
  console.log(`  emoji_title_count : ${emojiRows.length}`);
  if (emojiRows.length > 0) {
    emojiRows.slice(0, 5).forEach(r => console.log(`    → ${r.title}`));
  }
  console.log();
  console.log('[4] NULL 또는 빈 제목 row');
  console.log(`  null_or_empty_count : ${nullOrEmptyRows.length}`);
  if (nullOrEmptyRows.length > 0) {
    nullOrEmptyRows.slice(0, 5).forEach(r => console.log(`    id: ${r.id}  title: "${r.title}"`));
  }

  console.log('\n── 현황 확인 완료. Step 2 승인 전까지 대기 ──');
}

main().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
