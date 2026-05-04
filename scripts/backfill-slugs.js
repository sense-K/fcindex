// ============================================================
// Phase 1 Step 1: posts.slug 백필 스크립트
// 실행: node scripts/backfill-slugs.js
// 전제: .env 파일에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정됨
//       add-slug-column.sql 이 먼저 Supabase에 실행돼 있어야 함
// ============================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// ── 환경변수 검증 ──────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ .env에 SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── slug 생성 함수 ─────────────────────────────────────────────
// 형식: {제목-슬러그화}-{UUID 앞 8자리}
// 예: "월매출 3000만원 어떻게 하셨나요?" → "월매출-3000만원-어떻게-하셨나요-a3f9c2b1"
function generateSlug(title, id) {
  // UUID에서 하이픈 제거 후 앞 8자리 추출
  const uuidSuffix = id.replace(/-/g, '').slice(0, 8);

  if (!title || !title.trim()) {
    return `post-${uuidSuffix}`;
  }

  const slug = title
    .toLowerCase()
    // 허용: 한글(가-힣, ㄱ-ㅎ, ㅏ-ㅣ), 영문 소문자, 숫자, 공백, 하이픈
    // 제거: 특수문자(?!·,. 등), 이모지, 기타 모든 문자
    .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9\s-]/g, '')
    // 공백(탭 포함) → 하이픈
    .replace(/\s+/g, '-')
    // 연속 하이픈 → 하나로
    .replace(/-{2,}/g, '-')
    // 앞뒤 하이픈 제거
    .replace(/^-+|-+$/g, '');

  // 제거 후 빈 문자열이면 fallback
  if (!slug) {
    return `post-${uuidSuffix}`;
  }

  // 최대 71자로 제한 (전체 80자 - 하이픈 1자 - UUID 8자)
  const titlePart = slug.length > 71
    ? slug.slice(0, 71).replace(/-+$/, '')  // 자른 후 trailing 하이픈 정리
    : slug;

  return `${titlePart}-${uuidSuffix}`;
}

// ── 메인 실행 ─────────────────────────────────────────────────
async function main() {
  console.log('📝 posts.slug 백필 시작\n');

  // 1단계: slug가 NULL인 전체 row 수 파악
  const { count: totalNull, error: countError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .is('slug', null);

  if (countError) {
    console.error('❌ 개수 조회 실패:', countError.message);
    process.exit(1);
  }

  if (!totalNull || totalNull === 0) {
    console.log('✅ 모든 row에 slug가 이미 있습니다. 백필 완료 상태.');
    return;
  }

  console.log(`🔍 처리 대상: ${totalNull}개 (slug = NULL)\n`);

  // 2단계: 대상 ID 전체 수집 (페이지네이션)
  //         수집 시점을 고정해야 처리 중 추가된 row와 혼선 없음
  const allRows = [];
  const PAGE_SIZE = 1000;
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title')
      .is('slug', null)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ ID 수집 실패:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  console.log(`📋 ID 수집 완료: ${allRows.length}개\n`);

  // 3단계: 배치별 UPDATE
  const BATCH_SIZE = 50;
  let processed = 0;
  const failed = [];

  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const slug = generateSlug(row.title, row.id);

      const { error: updateError } = await supabase
        .from('posts')
        .update({ slug })
        .eq('id', row.id);

      if (updateError) {
        failed.push({ id: row.id, title: row.title, error: updateError.message });
        process.stdout.write(`\r⏳ ${processed + failed.length}/${allRows.length} (실패: ${failed.length})`);
      } else {
        processed++;
        process.stdout.write(`\r⏳ ${processed}/${allRows.length}`);
      }
    }
  }

  // 4단계: 결과 출력
  console.log(`\n\n${'─'.repeat(40)}`);
  console.log(`✅ 성공: ${processed}개`);

  if (failed.length > 0) {
    console.log(`❌ 실패: ${failed.length}개`);
    console.log('\n실패한 row 목록:');
    failed.forEach(f => {
      console.log(`  ID: ${f.id}`);
      console.log(`  제목: ${f.title}`);
      console.log(`  오류: ${f.error}\n`);
    });
  } else {
    console.log('\n🎉 모든 row 백필 완료!');
    console.log('\n아래 검증 쿼리를 Supabase SQL Editor에서 실행하세요:');
    console.log('  → add-slug-column.sql 하단의 검증 쿼리 섹션 참고');
  }
}

main().catch(err => {
  console.error('\n❌ 예상치 못한 오류:', err.message);
  process.exit(1);
});
